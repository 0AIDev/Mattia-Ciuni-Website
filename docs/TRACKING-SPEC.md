# Tracking specification

## Scope and audit

The site is a static Next.js export served by Cloudflare Pages. The real public actions are:

- reading home, About, Work, Thoughts, Notes, Feedback, Newsletter, Links, legal pages and media pages;
- internal navigation and external links to Payle, GitHub, LinkedIn, X, Instagram, Crunchbase and email;
- the newsletter form;
- the feedback modal;
- audio and video players;
- the notes carousel;
- copy-link and copy-email controls.

There is no checkout, ecommerce, calendar, phone, WhatsApp, Telegram, paid advertising tag, social embed or public account flow in the repository. The RAG chat route exists in code but the public component is disabled, so it is not part of the active funnel. The private admin route is excluded from all analytics.

The existing implementation had GA4 consent gating and Umami, but attribution was only initialized inside the GA4 loader. This lost source, click and navigation events for visitors who declined GA4. The implementation now has a first-party event path independent of GA4, a semantic data layer, session attribution, and a server-owned Supabase copy.

## Architecture

```text
Browser
  ├─ dataLayer: semantic events, flat values, no PII
  ├─ GA4: optional, loaded only after analytics consent
  ├─ Umami: cookieless page measurement and custom events
  └─ POST /api/collect: batched first-party copy
        └─ Supabase analytics_events (service role server-side only)
             ├─ analytics_daily
             ├─ analytics_pages
             ├─ analytics_flow
             ├─ analytics_acquisition
             └─ analytics_conversions
```

GTM is not installed because no GTM container ID exists. Google Ads and Meta are not installed because no conversion ID, pixel ID or server dataset exists. When those credentials exist, the data layer is ready for them without changing component instrumentation.

## Event taxonomy

All names are lowercase snake case. Every event is sent through `track()` and is copied to Supabase. The `content_kind` value is derived from the path.

| Event | When | Important parameters | Conversion |
|---|---|---|---|
| `page_view` | Initial page and client navigation | `page_location`, `page_title`, `content_kind`, `from_path`, attribution | No |
| `page_leave` | Navigation, tab hide or page close | `dwell_seconds`, `max_scroll_percent`, `next_page`, session totals | No |
| `traffic_source` | Once per tab session | current, first and last touch attribution | No |
| `navigation_click` | Any link or button click | `cta_id`, `cta_text`, `cta_location`, `destination` | No |
| `cta_click` | CTA/link interaction | same as navigation | No |
| `outbound_click` | External link interaction | destination host, outbound flag | No |
| `social_click` | Social profile interaction | network, destination | Micro |
| `email_click` | `mailto:` interaction or copy email | destination domain/address class | Micro |
| `copy_link` | Article or section URL copied | `copy_kind`, `content_kind` | Micro |
| `scroll_depth` | 25, 50, 75 and 100 percent | `percent`, `content_kind` | Engagement |
| `form_start` | First field focus | `form_id`, `form_location` | No |
| `form_field_interaction` | First focus per field | `form_id`, `field` only | No |
| `form_submit` | Form submitted | `form_id`, `form_location` | No |
| `form_success` | API confirms success | `form_id`, `form_location` | No |
| `form_error` | Validation, network or server failure | `form_id`, `reason` | No |
| `newsletter_signup` | Newsletter subscription accepted | form location and attribution | Primary |
| `newsletter_already_subscribed` | Duplicate subscription | form location | No |
| `newsletter_error` | Newsletter failure | safe reason code | No |
| `feedback_open` | Feedback modal opened | location and trigger | Micro |
| `feedback_submitted` | Feedback API accepts message | location, has-name, has-email, length | Primary |
| `feedback_error` | Feedback validation/API failure | safe reason code | No |
| `carousel_step` | Featured notes carousel moved | direction and list | Engagement |
| `media_play` | Audio/video starts | media kind and title | Engagement |
| `media_progress` | Audio/video reaches 25/50/75 | media kind, title, percent | Engagement |
| `media_complete` | Audio/video ends | media kind and title | Engagement |

Names, emails, message bodies, tokens and raw query strings are never event parameters.

## Attribution specification

Accepted query parameters:

```text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
utm_id
gclid
gbraid
wbraid
fbclid
msclkid
ttclid
li_fat_id
```

Normalization:

- source and medium are lowercased;
- referrers are reduced to hostname only;
- landing pages store pathname only, never the full query string;
- absent source is `direct / none`;
- search referrers become `organic_search`;
- click IDs without UTM medium become `paid`;
- all click IDs are retained in the anonymous attribution object, not just the first one.

First touch is the first meaningful attribution in the session. Last touch updates when a meaningful campaign/referrer arrives. Session attribution is stored in `sessionStorage` for first-party Supabase measurement. A persistent first-touch copy is written to `localStorage` only after the visitor accepts GA4 analytics consent. This distinction prevents persistent attribution storage from being silently treated as consent-free.

No redirect in the current site removes query parameters. Forms submit the normalized attribution fields to their APIs, and analytics events carry current, first and last touch snapshots to Supabase.

## Data layer

The data layer is a future-vendor boundary, not a tag loader:

```ts
{
  event: string,
  content_kind: string,
  cta_id?: string,
  cta_text?: string,
  cta_location?: string,
  destination?: string,
  source?: string,
  medium?: string,
  campaign?: string,
  campaign_id?: string,
  landing_page?: string,
  percent?: number,
  form_id?: string,
  form_location?: string,
  reason?: string
}
```

Only primitive values are pushed. Nested first/last touch objects go to the server collector and are excluded from the flat data layer. PII is forbidden by implementation and by the collector allowlist.

## Funnel

```text
Acquisition
  → landing page
  → page_view
  → scroll / media / social / CTA engagement
  → form_start
  → form_submit
  → form_success
  → newsletter_signup OR feedback_submitted
```

The current site has two real primary conversions: newsletter signup and submitted feedback. There is no customer or revenue event, so CPL, CAC, ROAS and revenue attribution are not fabricated. They can be added later through a CRM/offline conversion endpoint.

## Supabase

Migration order:

1. `20260922_000001_initial_schema.sql`
2. `20260922_000002_private_kv.sql`
3. `20260922_000003_analytics_events.sql`
4. `20260922_000004_tracking_attribution.sql`

The browser never queries Supabase. The Pages Function uses `SUPABASE_SERVICE_ROLE_KEY`; RLS remains enabled. The new columns are campaign fields plus `first_touch` and `last_touch` JSON objects. `analytics_acquisition` and `analytics_conversions` support campaign and conversion reporting without parsing raw event JSON.

## Privacy boundary

GA4 remains off until consent. Umami and the anonymous first-party aggregate copy do not write browser identifiers. The first-party server copy retains a daily rotating visitor hash, coarse country, coarse device class, path, event and attribution fields. No IP, user agent, email, name, feedback text or stable cross-day visitor ID is stored in `analytics_events`.

The privacy and cookies pages must describe session attribution, persistent first-touch storage after consent, campaign IDs, the data layer and the new Supabase views before this change is deployed.

## Dashboard

The private admin dashboard reads `analytics_daily`, `analytics_pages`, `analytics_flow`, and after the migration can add `analytics_acquisition` and `analytics_conversions`. The browser receives only aggregated rows after the existing token + TOTP session. The service role never reaches the page.

Recommended reports:

- acquisition: visitors, views and conversions by source, medium, campaign and landing page;
- content: views, exits, average seconds and scroll depth by path;
- flow: most common page-to-page transitions;
- conversion: newsletter and feedback counts by first/last touch;
- quality: collector status, missing attribution rate and events rejected by allowlist.

## QA checklist

- `npm run test:analytics`
- `npm run test:collect`
- `npm run test:admin`
- `npm run test:security`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- direct landing URL with UTM parameters;
- campaign URL with all click IDs;
- internal navigation after landing;
- GA declined: Umami, data layer and Supabase still receive safe events;
- GA accepted: GA receives one page view, no duplicate from consent transition;
- newsletter form start, submit, success and duplicate;
- feedback form start, submit, success and validation error;
- media play, progress and complete;
- email, social, outbound and copy events;
- Supabase row contains attribution but no PII;
- admin endpoint returns aggregates only after authentication.

## Not implemented without credentials

No Google Tag Manager container, Google Ads conversion action, Meta Pixel, Meta CAPI dataset, BigQuery project, CRM or revenue source is present in this repository. Adding them without IDs would be a false implementation. The first-party event and attribution contract is the stable foundation for those integrations when the accounts are supplied.
