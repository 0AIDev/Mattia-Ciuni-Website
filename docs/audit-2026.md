# Security audit evidence register — 2026

## Status and scope

This file is an evidence register for repository-verifiable security controls. It is **not** an external audit report. The signed external F1-F10 report was not present in the repository at the time this document was created, so the original findings cannot be reconstructed truthfully.

No page, contest rule, YC document, or public claim may describe this file as proof that an external audit was completed. Attach the actual signed report before making that claim.

The controls below reference code and tests that exist in this repository. They are not represented as fixes for unknown external findings.

## F1 — Source finding unavailable

- Original finding: unavailable. The source F1-F10 report was not supplied.
- Repository evidence: no external audit artifact found under `docs/` or the repository root.
- Current control: the project refuses to invent an F1 finding or claim closure.
- Regression guard: editorial truth gate in `.claude/skills/editorial-payle/SKILL.md`, especially the evidence requirement for LIVE claims.
- Status: `UNVERIFIED — source report required`.

## F2 — Authentication and session controls

- Original finding: unavailable. No original F2 text is present.
- Repository-verifiable control: admin access requires token plus TOTP, uses an HttpOnly/Secure/SameSite session, separates rate limits, and supports logout/revocation.
- Evidence: `functions/api/admin/feedback.ts`.
- Regression tests: `scripts/test-admin.mjs` covers bootstrap replay, token plus TOTP login, wrong factors, session access, logout, bearer-token rejection, and brute-force limits.
- Status: `CONTROL VERIFIED IN REPOSITORY; EXTERNAL FINDING UNVERIFIED`.

## F3 — Public/private content separation

- Original finding: unavailable. No original F3 text is present.
- Repository-verifiable control: private admin paths reject Markdown negotiation and private generated cards are not published.
- Evidence: `functions/_middleware.ts`, `public/_routes.json`, `scripts/verify.js`.
- Regression tests: `scripts/test-security.mjs` and the private-artifact checks in `scripts/verify.js`.
- Status: `CONTROL VERIFIED IN REPOSITORY; EXTERNAL FINDING UNVERIFIED`.

## F4 — Public form validation and abuse controls

- Original finding: unavailable. No original F4 text is present.
- Repository-verifiable control: same-origin checks, JSON validation, honeypot handling, byte-based body limits, rate limits, and no IP persistence in feedback records.
- Evidence: `functions/api/feedback.ts`.
- Regression tests: `scripts/test-feedback.mjs` covers malformed requests, honeypot, streamed oversized bodies, PII trimming, rate limiting, origin-derived links, and quiet logs.
- Status: `CONTROL VERIFIED IN REPOSITORY; EXTERNAL FINDING UNVERIFIED`.

## F5 — Subscriber identity and provider handling

- Original finding: unavailable. No original F5 text is present.
- Repository-verifiable control: email canonicalization, disposable-domain checks, provider idempotency, deduplication, and server-only provider credentials.
- Evidence: `functions/api/subscribe.ts`, `lib/email-normalization.ts`.
- Regression tests: `scripts/test-newsletter.mjs` covers canonicalization, provider contracts, idempotency, rate limits, and absence of the old welcome-copy behavior.
- Status: `CONTROL VERIFIED IN REPOSITORY; EXTERNAL FINDING UNVERIFIED`.

## F6 — Analytics privacy boundary

- Original finding: unavailable. No original F6 text is present.
- Repository-verifiable control: the first-party collector rejects unknown events, does not persist raw IP or user-agent values, uses a daily-scoped hash, sanitizes values, and rate-limits writes.
- Evidence: `functions/api/collect.ts`, `supabase/migrations/20260922_000003_analytics_events.sql`.
- Regression tests: `scripts/test-collect.mjs`, `scripts/test-analytics.mjs`.
- Status: `CONTROL VERIFIED IN REPOSITORY; EXTERNAL FINDING UNVERIFIED`.

## F7 — Analytics consent and duplication

- Original finding: unavailable. No original F7 text is present.
- Repository-verifiable control: Google Analytics is consent-gated, Umami is separated, event names are centralized, and client components use the shared tracking helper.
- Evidence: `components/GoogleAnalytics.tsx`, `components/UmamiAnalytics.tsx`, `lib/analytics.ts`.
- Regression tests: `scripts/test-analytics.mjs`.
- Status: `CONTROL VERIFIED IN REPOSITORY; EXTERNAL FINDING UNVERIFIED`.

## F8 — Security headers and dependency baseline

- Original finding: unavailable. No original F8 text is present.
- Repository-verifiable control: CSP, HSTS, frame protection, `nosniff`, Referrer Policy, Permissions Policy, and repository secret scans are checked.
- Evidence: `public/_headers`, `scripts/security-audit.mjs`.
- Regression tests: `npm run test:security`.
- Status: `CONTROL VERIFIED IN REPOSITORY; EXTERNAL FINDING UNVERIFIED`.

## F9 — MacBook Gate fail-closed contracts

- Original finding: unavailable. This section documents the newly approved Phase 1A control, not an external finding.
- Repository-verifiable control: timeout/provider failure is not a decline; a genuine decline requires authorization ID, ledger receipt, reason code, and expected policy version. LIVE requires legal entity, dates, and a 10/10 rehearsal.
- Evidence: `lib/macbook-gate.ts`, `supabase/migrations/20260922_000005_macbook_gate.sql`.
- Regression tests: `scripts/test-macbook-gate.mjs`.
- Status: `PHASE 1A CONTROL VERIFIED IN REPOSITORY; EXTERNAL FINDING UNVERIFIED`.

## F10 — MacBook Gate evidence provenance

- Original finding: unavailable. This section documents the newly approved Phase 1B control, not an external finding.
- Repository-verifiable control: only server-side evidence is accepted; retailer, URL, price, timestamp, hash, provenance, freshness, and duplicate checks are required. Sandbox mode does not claim to be live search.
- Evidence: `lib/macbook-search.ts`, `docs/MACBOOK-GATE-PHASE-1A.md`.
- Regression tests: `scripts/test-macbook-search.mjs`.
- Status: `PHASE 1B CONTROL VERIFIED IN REPOSITORY; EXTERNAL FINDING UNVERIFIED`.

## Required action before publication

Supply the actual external report containing F1-F10. Then replace the unavailable finding descriptions with the report's exact language, preserve the repository evidence links, and have the external auditor or an authorized operator confirm the mapping. Until then, the truthful statement is:

> The repository contains security controls and regression tests. The external F1-F10 audit report is not included here and has not been independently verified from this repository.
