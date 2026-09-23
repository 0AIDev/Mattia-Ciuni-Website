-- Private NDA recipients. The raw access token is never stored in Supabase.
create table if not exists public.nda_recipients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  token_hash text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  used_at timestamptz,
  constraint nda_full_name_length check (char_length(full_name) between 2 and 160),
  constraint nda_email_length check (char_length(email) between 3 and 254)
);

create index if not exists nda_recipients_email_idx
  on public.nda_recipients (lower(email));
create index if not exists nda_recipients_expiry_idx
  on public.nda_recipients (expires_at);

alter table public.nda_recipients enable row level security;

comment on table public.nda_recipients is 'Private NDA access records. Server-only through the Supabase service role; the raw token is never stored.';
comment on column public.nda_recipients.token_hash is 'SHA-256 hash of the one-time URL token.';
