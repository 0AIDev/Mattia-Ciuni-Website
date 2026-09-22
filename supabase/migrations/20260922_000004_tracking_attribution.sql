-- Tracking attribution extension
-- Run after 20260922_000003_analytics_events.sql.
-- No personal data is added: all values come from campaign parameters, paths and
-- referrer domains, with no email, name, IP or user-agent columns.

alter table public.feedback_submissions
  add column if not exists first_touch jsonb not null default '{}'::jsonb,
  add column if not exists last_touch jsonb not null default '{}'::jsonb;

alter table public.newsletter_subscribers
  add column if not exists first_touch jsonb not null default '{}'::jsonb,
  add column if not exists last_touch jsonb not null default '{}'::jsonb;

alter table public.analytics_events
  add column if not exists source text not null default 'direct',
  add column if not exists medium text not null default 'none',
  add column if not exists campaign text not null default '(not set)',
  add column if not exists content text not null default '(not set)',
  add column if not exists term text not null default '(not set)',
  add column if not exists campaign_id text not null default '(not set)',
  add column if not exists landing_page text not null default '/',
  add column if not exists first_touch jsonb not null default '{}'::jsonb,
  add column if not exists last_touch jsonb not null default '{}'::jsonb;

create index if not exists analytics_events_attribution_idx
  on public.analytics_events (source, medium, campaign, occurred_at desc);

create or replace view public.analytics_acquisition
with (security_invoker = true) as
select
  source,
  medium,
  campaign,
  campaign_id,
  landing_page,
  count(*) as events,
  count(*) filter (where event = 'page_view') as views,
  count(*) filter (where event in ('newsletter_signup', 'feedback_submitted')) as conversions,
  count(distinct visitor_day) as visitors,
  max(occurred_at) as last_seen
from public.analytics_events
group by 1, 2, 3, 4, 5;

comment on view public.analytics_acquisition is
  'Acquisition by current campaign and landing page, with anonymous visitors and real conversion events.';

create or replace view public.analytics_conversions
with (security_invoker = true) as
select
  occurred_at,
  event as conversion,
  page_path,
  source,
  medium,
  campaign,
  campaign_id,
  landing_page,
  first_touch,
  last_touch
from public.analytics_events
where event in ('newsletter_signup', 'feedback_submitted');

comment on view public.analytics_conversions is
  'Real first-party conversions only: newsletter signup and submitted feedback.';
