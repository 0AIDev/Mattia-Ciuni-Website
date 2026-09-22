-- The MacBook Gate, Phase 1A: contracts, configuration and state storage.
-- Run after 20260922_000004_tracking_attribution.sql.
-- No API handlers are included in this migration. RLS is enabled with no public
-- policies: only the server-side service role may access these tables.

create table if not exists public.macbook_contests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  canonical_origin text not null default 'https://mattiaciuni.it',
  status text not null default 'draft'
    check (status in ('draft', 'testing', 'live', 'paused', 'closed', 'drawing', 'complete', 'cancelled')),
  entry_cap integer not null default 3000 check (entry_cap > 0),
  max_attempts_per_ip_day integer not null default 2 check (max_attempts_per_ip_day > 0),
  llm_daily_budget_usd numeric(10,2) not null default 30 check (llm_daily_budget_usd > 0),
  max_prize_spend_usd numeric(10,2) not null default 2000 check (max_prize_spend_usd > 0),
  max_total_spend_usd numeric(10,2) not null default 2500 check (max_total_spend_usd > 0),
  max_evidence_age_hours integer not null default 24 check (max_evidence_age_hours > 0),
  minimum_valid_results integer not null default 3 check (minimum_valid_results >= 3),
  allowed_retailers jsonb not null default '["apple", "amazon", "back_market"]'::jsonb,
  base_entries_per_email integer not null default 1 check (base_entries_per_email = 1),
  social_bonuses_enabled boolean not null default false,
  referral_bonuses_enabled boolean not null default false,
  legal_entity_verified boolean not null default false,
  claim_status text not null default 'unverified'
    check (claim_status in ('unverified', 'verified')),
  claim_verification_note text not null default '',
  start_at timestamptz,
  end_at timestamptz,
  rules_version text not null,
  policy_version text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint macbook_contest_dates_order check (end_at is null or start_at is null or end_at > start_at),
  constraint macbook_contest_claim_note check (claim_status = 'unverified' or char_length(claim_verification_note) >= 20)
);

create unique index if not exists macbook_one_active_contest_idx
  on public.macbook_contests ((true))
  where status in ('testing', 'live', 'paused', 'closed', 'drawing');

create table if not exists public.macbook_attempts (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  contest_id uuid not null references public.macbook_contests(id),
  session_hash text not null,
  status text not null default 'created'
    check (status in ('created', 'searching', 'search_complete', 'search_failed', 'authorizing', 'declined', 'authorization_failed', 'ineligible', 'expired')),
  request_text text not null,
  normalized_product text not null default '',
  search_started_at timestamptz,
  search_completed_at timestamptz,
  authorization_id text,
  ledger_receipt_id text,
  decline_reason_code text,
  decline_reason_snapshot jsonb not null default '{}'::jsonb,
  ip_day_hash text not null default '',
  country_code text not null default '',
  eligible_for_entry boolean not null default false,
  client_request_id text,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint macbook_attempt_request_length check (char_length(request_text) between 1 and 500),
  constraint macbook_attempt_country_length check (char_length(country_code) <= 8),
  constraint macbook_attempt_eligible_requires_decline check (not eligible_for_entry or status = 'declined'),
  constraint macbook_attempt_eligible_requires_auth check (not eligible_for_entry or (authorization_id is not null and ledger_receipt_id is not null))
);

create unique index if not exists macbook_attempt_client_request_idx
  on public.macbook_attempts (contest_id, session_hash, client_request_id)
  where client_request_id is not null;
create index if not exists macbook_attempts_contest_status_idx
  on public.macbook_attempts (contest_id, status, created_at desc);
create index if not exists macbook_attempts_ip_day_idx
  on public.macbook_attempts (contest_id, ip_day_hash, created_at desc);

create table if not exists public.macbook_search_results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.macbook_attempts(id) on delete cascade,
  retailer text not null check (retailer in ('apple', 'amazon', 'back_market')),
  product_title text not null,
  model_identifier text not null default '',
  url text not null,
  price_minor bigint not null check (price_minor > 0),
  currency text not null check (char_length(currency) = 3),
  shipping_minor bigint not null default 0 check (shipping_minor >= 0),
  availability text not null default 'unknown',
  captured_at timestamptz not null,
  evidence_url text not null default '',
  evidence_hash text not null,
  is_valid boolean not null default false,
  validation_reason text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  constraint macbook_result_url_https check (url like 'https://%'),
  constraint macbook_result_evidence_hash check (char_length(evidence_hash) between 32 and 128)
);

create index if not exists macbook_search_results_attempt_idx
  on public.macbook_search_results (attempt_id, is_valid, price_minor);

create table if not exists public.macbook_email_verifications (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.macbook_attempts(id) on delete cascade,
  email_hash text not null,
  email_ciphertext text not null,
  token_hash text not null unique,
  status text not null default 'sent'
    check (status in ('not_requested', 'sent', 'verified', 'expired', 'consumed', 'blocked')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  waitlist_opt_in boolean not null default false,
  expires_at timestamptz not null,
  verified_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists macbook_email_verifications_attempt_idx
  on public.macbook_email_verifications (attempt_id, created_at desc);
create index if not exists macbook_email_verifications_email_idx
  on public.macbook_email_verifications (email_hash);

create table if not exists public.macbook_entries (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  contest_id uuid not null references public.macbook_contests(id),
  attempt_id uuid not null unique references public.macbook_attempts(id),
  email_hash text not null,
  base_entries integer not null default 1 check (base_entries = 1),
  bonus_entries integer not null default 0 check (bonus_entries = 0),
  total_entries integer generated always as (base_entries + bonus_entries) stored,
  status text not null default 'eligible'
    check (status in ('pending_verification', 'eligible', 'ineligible', 'revoked', 'frozen')),
  eligibility_reason text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint macbook_entry_phase_one_bonus check (bonus_entries = 0)
);

create unique index if not exists macbook_one_base_entry_per_email_idx
  on public.macbook_entries (contest_id, email_hash)
  where status in ('pending_verification', 'eligible', 'frozen');
create index if not exists macbook_entries_contest_status_idx
  on public.macbook_entries (contest_id, status, created_at);

create table if not exists public.macbook_rehearsals (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.macbook_contests(id),
  run_label text not null,
  attempt_id uuid references public.macbook_attempts(id),
  authorization_id text,
  ledger_receipt_id text,
  valid_evidence_count integer not null default 0 check (valid_evidence_count >= 0),
  result text not null check (result in ('passed', 'failed')),
  failure_reason text not null default '',
  account_test_hash text not null,
  executed_at timestamptz not null default timezone('utc', now()),
  executed_by text not null
);

create unique index if not exists macbook_rehearsal_label_idx
  on public.macbook_rehearsals (contest_id, run_label);
create index if not exists macbook_rehearsals_contest_idx
  on public.macbook_rehearsals (contest_id, executed_at desc);

create table if not exists public.macbook_audit_events (
  id bigint generated by default as identity primary key,
  contest_id uuid references public.macbook_contests(id),
  aggregate_type text not null,
  aggregate_id uuid,
  event_type text not null,
  actor_type text not null check (actor_type in ('system', 'ceo', 'test_account')),
  actor_id text not null default '',
  payload jsonb not null default '{}'::jsonb,
  previous_hash text not null default '',
  event_hash text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists macbook_audit_events_contest_idx
  on public.macbook_audit_events (contest_id, created_at desc);
create index if not exists macbook_audit_events_aggregate_idx
  on public.macbook_audit_events (aggregate_type, aggregate_id, created_at);

-- This trigger covers mutable configuration and business rows. Audit events are
-- append-only and intentionally have no update trigger.
drop trigger if exists macbook_contests_set_updated_at on public.macbook_contests;
create trigger macbook_contests_set_updated_at
before update on public.macbook_contests
for each row execute function public.set_updated_at();

drop trigger if exists macbook_attempts_set_updated_at on public.macbook_attempts;
create trigger macbook_attempts_set_updated_at
before update on public.macbook_attempts
for each row execute function public.set_updated_at();

drop trigger if exists macbook_entries_set_updated_at on public.macbook_entries;
create trigger macbook_entries_set_updated_at
before update on public.macbook_entries
for each row execute function public.set_updated_at();

alter table public.macbook_contests enable row level security;
alter table public.macbook_attempts enable row level security;
alter table public.macbook_search_results enable row level security;
alter table public.macbook_email_verifications enable row level security;
alter table public.macbook_entries enable row level security;
alter table public.macbook_rehearsals enable row level security;
alter table public.macbook_audit_events enable row level security;

comment on table public.macbook_contests is 'Server-only contest configuration. LIVE requires legal_entity_verified, dates, and a 10/10 real-decline rehearsal.';
comment on column public.macbook_contests.llm_daily_budget_usd is 'Hard daily LLM spending limit for contest attempts.';
comment on column public.macbook_contests.max_total_spend_usd is 'Hard total campaign spending cap, including prize, LLM and infrastructure.';
comment on column public.macbook_contests.claim_status is 'Only verified permits the stronger first-ever marketing claim.';
comment on table public.macbook_attempts is 'Server-owned real-agent attempts. A timeout or provider failure is never a decline.';
comment on table public.macbook_search_results is 'Timestamped retailer evidence. Client-submitted prices are never trusted.';
comment on table public.macbook_email_verifications is 'One-time contest verification records. Email content is encrypted and indexed only by hash.';
comment on table public.macbook_entries is 'One base entry per verified email and contest. Phase 1 has no social or referral bonuses.';
comment on table public.macbook_rehearsals is 'Ten real test-account runs required before TESTING can transition to LIVE.';
comment on table public.macbook_audit_events is 'Append-only tamper-evident contest audit trail. Never update or delete rows.';
