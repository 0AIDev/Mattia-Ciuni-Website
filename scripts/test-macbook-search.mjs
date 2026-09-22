import assert from "node:assert/strict";
import { createSearchProvider, evidenceHashForTest, hasMinimumEvidence, validateRecordedOffers } from "../lib/macbook-search.ts";

const now = new Date("2026-10-01T12:00:00.000Z");
const base = {
  productTitle: "MacBook Pro 14-inch",
  modelIdentifier: "MacBookPro14-M4",
  currency: "USD",
  shippingMinor: 0,
  availability: "in_stock",
  capturedAt: now.toISOString(),
  evidenceUrl: "https://evidence.example.test/capture",
};

async function offer(retailer, priceMinor, overrides = {}) {
  const offerWithoutHash = {
    retailer,
    ...base,
    url: `https://${retailer.replace("_", "-")}.example.test/macbook-pro`,
    priceMinor,
    ...overrides,
  };
  return {
    ...offerWithoutHash,
    evidenceHash: await evidenceHashForTest(offerWithoutHash),
    provenance: {
      source: "recorded_real_offer",
      capturedFrom: offerWithoutHash.url,
      capturedAt: offerWithoutHash.capturedAt,
      operator: "test-only-validator-input",
    },
  };
}

const validOffers = await Promise.all([
  offer("apple", 199900),
  offer("amazon", 189900),
  offer("back_market", 149900),
]);

const valid = await validateRecordedOffers(validOffers, { now, maxEvidenceAgeHours: 24, rehearsal: false });
assert.equal(valid.validResultCount, 3);
assert.equal(valid.bestOffer?.retailer, "back_market");
assert.equal(hasMinimumEvidence(valid, 3), true);

const stale = await offer("apple", 199900, { capturedAt: "2026-09-01T12:00:00.000Z", evidenceUrl: "https://evidence.example.test/stale" });
assert.equal((await validateRecordedOffers([stale], { now, maxEvidenceAgeHours: 24, rehearsal: false })).errors[0].code, "stale_evidence");

const unsupported = await offer("apple", 199900, { retailer: "other" });
assert.equal((await validateRecordedOffers([unsupported], { now, maxEvidenceAgeHours: 24, rehearsal: false })).errors[0].code, "unsupported_retailer");

const changed = { ...validOffers[0], priceMinor: 1 };
assert.equal((await validateRecordedOffers([changed], { now, maxEvidenceAgeHours: 24, rehearsal: false })).errors[0].code, "evidence_hash_mismatch");

const duplicate = [validOffers[0], await offer("apple", 199900, { evidenceUrl: "https://evidence.example.test/duplicate" })];
const duplicateResult = await validateRecordedOffers(duplicate, { now, maxEvidenceAgeHours: 24, rehearsal: false });
assert.equal(duplicateResult.validResultCount, 1);
assert.equal(duplicateResult.errors[0].code, "duplicate_offer");

const sandbox = createSearchProvider({ mode: "sandbox", sandboxOffers: [] });
const sandboxResult = await sandbox.search("MacBook Pro", { now, maxEvidenceAgeHours: 24, rehearsal: false });
assert.equal(sandboxResult.validResultCount, 0);
assert.equal(hasMinimumEvidence(sandboxResult, 3), false);

const live = createSearchProvider({ mode: "live", sandboxOffers: [], liveEnabledForRehearsal: true, liveSearch: async () => validOffers });
await assert.rejects(() => live.search("MacBook Pro", { now, maxEvidenceAgeHours: 24, rehearsal: false }), /live_search_requires_rehearsal/);
const liveResult = await live.search("MacBook Pro", { now, maxEvidenceAgeHours: 24, rehearsal: true });
assert.equal(liveResult.validResultCount, 3);

console.log("macbook-search: sandbox empty-fixture behavior, evidence validation, provenance, minimum results, live rehearsal gate and deterministic selection passed");
