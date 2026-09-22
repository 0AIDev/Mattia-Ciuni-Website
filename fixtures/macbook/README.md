# MacBook Gate sandbox fixtures

Sandbox fixtures must be recorded from real retailer captures. They are not invented test content and must never be presented as live search results.

Each offer must include:

- Apple, Amazon, or Back Market retailer identifier;
- original HTTPS URL;
- capture timestamp;
- model identifier;
- price, currency, shipping, and availability;
- evidence URL and SHA-256 evidence hash;
- operator/provenance metadata.

No verified recorded retailer offers are currently checked into this repository. `offers.json` is intentionally empty. Phase 1B tests use explicitly marked in-memory validation objects to exercise the validator, not to claim that a real retailer search happened.

A live fixture may be added only after a real capture is reviewed and its provenance is committed alongside the fixture.
