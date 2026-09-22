# MacBook Gate implementation specification

Status: Phase 1A approved, Phase 1B in progress. This document is a technical contract, not contest rules and not an external audit report.

## Canonical decisions

- Canonical campaign origin: `https://mattiaciuni.it`.
- Staging and preview origins must not be used in public campaign URLs.
- Allowed Phase 1 retailers: Apple, Amazon, Back Market.
- Minimum valid server-side evidence: three results.
- Phase 1 has one base entry per verified email. Referral and social bonuses are disabled.
- The contest is a random draw with commit-reveal. Leaderboards never determine the winner.
- The contest cannot enter `LIVE` until the legal entity is verified, dates exist, and ten real test-account rehearsals pass 10/10.
- The strong “first MacBook ever” claim is published only when `claim_status = verified`; otherwise the alternative copy is used.

## Email encryption key management

The `email_ciphertext` column stores encrypted contest email data. The encryption key is an operational secret named `MACBOOK_EMAIL_ENCRYPTION_KEY` and has one allowed location: Cloudflare Pages/Workers Secrets.

The key must never be:

- stored in Supabase;
- stored in a migration, fixture, test, `.env` file, or committed document;
- returned by any API;
- shown in the admin UI;
- printed in logs;
- sent to the browser.

Decryption is server-side only and is permitted only in an authenticated admin-review operation that needs to display the address. Public endpoints use `email_hash` and never decrypt.

### Rotation procedure

1. Generate a new key in a secure operator environment. Do not paste it into the repository or chat.
2. Add it to Cloudflare as a new versioned secret, for example `MACBOOK_EMAIL_ENCRYPTION_KEY_V2`.
3. Deploy code that can read the active version and re-encrypt records in a bounded, audited migration job. The job must write ciphertext with the new key and must not log plaintext.
4. Verify that representative admin review reads work and that public endpoints still return only masked/hash fields.
5. Promote the new secret to `MACBOOK_EMAIL_ENCRYPTION_KEY` and remove the old secret only after re-encryption has completed and rollback verification has passed.
6. Record only the rotation event, key version, operator role, and counts in `macbook_audit_events`. Never record the key or plaintext email.

Rollback is a controlled secret-version promotion, not a database export. Emergency revocation removes the compromised Cloudflare secret, disables decryption/admin review, records an audit event without sensitive values, and requires re-encryption before review resumes.

## Public rehearsal log contract

The future read-only endpoint is:

```text
GET /api/macbook/rehearsal-log
```

It returns only the ten completed rehearsal results after they exist. Before a complete rehearsal it must return an honest not-ready response or an empty list. It must never fabricate rows.

Allowed fields per result:

```json
{
  "run_label": "rehearsal-01",
  "account_test_hash": "sha256-truncated-value",
  "executed_at": "2026-10-01T12:00:00Z",
  "result": "passed",
  "valid_evidence_count": 3,
  "has_authorization_id": true,
  "has_ledger_receipt": true
}
```

The endpoint must not return raw email addresses, IP addresses, session IDs, tokens, provider credentials, private authorization payloads, or decrypted ciphertext. It is read-only, public, cache-safe, and must not expose database identifiers unnecessarily.

## Phase 1B boundary

Phase 1B owns only search and evidence validation:

```text
SearchProvider.search(query, context) -> SearchResult
```

Development uses `SEARCH_MODE=sandbox`. The sandbox reads only recorded-offer fixtures. The repository currently contains no verified recorded retailer offers, so the checked-in fixture is intentionally empty. Adding a fixture requires provenance from a real capture: retailer, original URL, capture timestamp, model identifier, price, currency, availability, evidence URL, evidence hash, and operator.

`SEARCH_MODE=live` is disabled outside the controlled rehearsal. It delegates to the existing payle-agent connector/browser pipeline when that dependency is supplied. Timeouts, bot detection, blocked pages, and provider errors remain failures. They are never converted into declines or entries.

The browser may submit a query only. It cannot submit prices, retailer names, URLs, screenshots, hashes, or evidence records for acceptance.
