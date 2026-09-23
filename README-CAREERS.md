# Careers

The public Careers page is `/careers/`. Job data lives in `lib/careers/jobs.ts`.

## Add an opening

1. Add or edit a `CareerJob` object in `lib/careers/jobs.ts`.
2. Keep `status: "coming-soon"` until the role is ready to accept applications.
3. To open it, set `status: "open"`, write the complete description and challenge, and set the correct `employmentType`.
4. Build and inspect `/careers/<slug>/` and `/careers/<slug>/apply/` before publishing.
5. To close it, set `status: "closed"`. The direct detail URL remains available and the apply route redirects back to the detail page.

The repository intentionally starts with zero open roles and one coming-soon example. No application form is reachable until a job is changed to `open`.

## Database

Apply `supabase/migrations/20260923_000006_careers_applications.sql` in the Supabase SQL editor. RLS is enabled and there are no public policies. The Pages Functions use only the server-side service role.

## Cloudflare Pages secrets

Production secrets:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
CAREERS_FROM_EMAIL
IP_HASH_SALT
```

`CAREERS_FROM_EMAIL` must be a verified Resend sender, normally `Mattia Ciuni <ceo@usepayle.com>`. Bind the existing `RATE_LIMIT` KV namespace. If the binding is absent, the function uses the server-side `private_kv` table as a fallback.

## Verification behavior

The application is stored as pending until the one-time email link is clicked. Tokens are random, stored only as SHA-256 hashes, expire after 48 hours, and are cleared after successful verification. The API never logs names, emails, IPs, tokens, or application text.

A real delivery test remains an operational check: submit with a real email, click the link, then confirm `email_verified = true` in Supabase using the dashboard or a server-side query. Do not put a real API key in the repository or in a browser variable.
