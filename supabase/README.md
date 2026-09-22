# Supabase database

This directory contains the database schema for the personal site.

## Apply the schema

1. Open the Supabase project dashboard.
2. Open **SQL Editor**.
3. Create a new query.
4. Copy the complete contents of:

   ```text
   supabase/migrations/20260922_000001_initial_schema.sql
   ```

5. Run the query.
6. In **Table Editor**, confirm these tables exist:

   - `feedback_submissions`
   - `newsletter_subscribers`
   - `admin_sessions`
   - `admin_rate_limits`
   - `admin_audit_log`
   - `email_delivery_events`
   - `private_kv` (from the second migration, for the temporary KV compatibility layer)
   - `analytics_events` (from the third migration, the site-owned copy of the measurement)
   - the views `analytics_daily`, `analytics_pages`, `analytics_flow`, `analytics_acquisition`, `analytics_conversions`

Run all migration files in filename order. The fourth migration adds queryable first-touch/last-touch attribution and acquisition/conversion views. Each migration is idempotent and contains no credentials. They can be run again safely.

## The measurement copy (`analytics_events`)

Umami and Google Analytics are services run by someone else: they can change plan, prune
their history or close. `functions/api/collect.ts` therefore writes a copy of every site
event into `analytics_events`, so the measurement of the site cannot be lost with them.

The copy is anonymous by construction:

- no IP address is stored, not even truncated;
- no user agent, no cookie, no device identifier;
- the raw address is read once, hashed together with a server secret and the UTC date, and
discarded. `visitor_day` is that truncated hash: it counts distinct visits inside one day,
it cannot be reversed, and it cannot link one day to the next;
- only `country` (from Cloudflare) and a one-word `device` survive the request;
- events and parameter names are whitelisted, values are primitives and truncated;
- campaign source, medium, campaign, content, term, campaign ID and landing path are stored in dedicated columns;
- first-touch and last-touch attribution snapshots contain only campaign fields and referrer domains, never personal data.

The salt comes from `ANALYTICS_SALT` if set, otherwise from the service role key. No extra
configuration is required. There is no retention policy: the table is never pruned, because
not losing this data is the reason it exists.

## Security model

- RLS is enabled on every application table.
- No anonymous policies are created.
- The browser must never query these tables directly.
- Pages Functions will use `SUPABASE_SERVICE_ROLE_KEY` only on the server.
- Never use the service role key in `NEXT_PUBLIC_*` variables.
- Never commit `servicerole.txt`, `.env.local`, or `.dev.vars`.

## Cloudflare Pages secrets

After the schema exists, configure these as **Production Secrets** in Cloudflare Pages:

```text
SUPABASE_URL=https://kthtavvhjharmluqfdzn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<the service-role key stored only in your local .dev.vars and Cloudflare Secret>
```

The anon key is not needed by the server-side Pages Functions. It must not be used as a substitute for the service role key.

## Migration order

The application should be switched in this order:

1. Apply the schema.
2. Verify the tables, attribution columns and views in Supabase.
3. Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.dev.vars` for local Pages testing and as Production Secrets in Cloudflare Pages.
4. Import existing KV records without deleting KV data.
5. Enable dual-write for a verification window.
6. Read from Supabase and retain KV as a rollback copy.
7. Verify feedback submission, moderation, newsletter deduplication, login sessions and rate limits.
8. Only then remove the old provider storage paths.

No existing KV record should be deleted as part of the first deployment.
