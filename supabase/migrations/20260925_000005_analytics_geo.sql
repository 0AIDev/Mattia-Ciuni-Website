-- Mattia Ciuni website
-- Geographic aggregation for the admin dashboard world map
--
-- Run this file once in Supabase Dashboard -> SQL Editor, after
-- 20260922_000004_tracking_attribution.sql. It contains no credentials and is
-- safe to rerun.
--
-- The country column already exists on analytics_events, written by the
-- collector from Cloudflare's CF-IPCountry header (ISO 3166-1 alpha-2, empty
-- when the header is absent). This view only aggregates it: same guarantees as
-- the rest of the owned copy, no new data, no new exposure.

create index if not exists analytics_events_country_idx
  on public.analytics_events (country, occurred_at desc);

create or replace view public.analytics_geo
with (security_invoker = true) as
select
  nullif(country, '') as country,
  count(*) filter (where event = 'page_view') as views,
  count(distinct visitor_day) as visitors,
  max(occurred_at) as last_seen
from public.analytics_events
where country <> ''
group by 1
order by visitors desc;

comment on view public.analytics_geo is
  'Visitors and views by country (ISO 3166-1 alpha-2 from CF-IPCountry), aggregated from the owned copy.';
