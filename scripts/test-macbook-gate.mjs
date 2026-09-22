import assert from "node:assert/strict";
import {
  DEFAULT_CONTEST_CONFIG,
  isAttemptEligibleForEntry,
  isGenuineDecline,
  isLiveReady,
  publicClaim,
  transitionContest,
} from "../lib/macbook-gate.ts";

const rehearsal = {
  total: 10,
  successful: 10,
  failed: 0,
  allHaveRealAuthorization: true,
  allHaveLedgerReceipts: true,
  allHaveMinimumEvidence: true,
};

assert.equal(DEFAULT_CONTEST_CONFIG.status, "draft");
assert.equal(DEFAULT_CONTEST_CONFIG.canonicalOrigin, "https://mattiaciuni.it");
assert.equal(DEFAULT_CONTEST_CONFIG.entryCap, 3000);
assert.equal(DEFAULT_CONTEST_CONFIG.llmDailyBudgetUsd, 30);
assert.equal(DEFAULT_CONTEST_CONFIG.maxTotalSpendUsd, 2500);
assert.deepEqual(DEFAULT_CONTEST_CONFIG.allowedRetailers, ["apple", "amazon", "back_market"]);
assert.equal(DEFAULT_CONTEST_CONFIG.socialBonusesEnabled, false);
assert.equal(DEFAULT_CONTEST_CONFIG.referralBonusesEnabled, false);
assert.equal(publicClaim(DEFAULT_CONTEST_CONFIG), "A MacBook bought by an AI agent under human-defined policy, with a public receipt.");
assert.equal(isLiveReady(DEFAULT_CONTEST_CONFIG, rehearsal), false);

assert.throws(
  () => transitionContest(DEFAULT_CONTEST_CONFIG, "live", rehearsal),
  /invalid_transition/,
);
assert.throws(
  () => transitionContest({ ...DEFAULT_CONTEST_CONFIG, status: "testing", startAt: "2026-10-01T00:00:00Z", endAt: "2026-10-22T00:00:00Z" }, "live", rehearsal),
  /live_requires_legal_entity/,
);
assert.throws(
  () => transitionContest({ ...DEFAULT_CONTEST_CONFIG, status: "testing", legalEntityVerified: true }, "live", rehearsal),
  /live_requires_dates/,
);
assert.throws(
  () => transitionContest({ ...DEFAULT_CONTEST_CONFIG, status: "testing", legalEntityVerified: true, startAt: "2026-10-01T00:00:00Z", endAt: "2026-10-22T00:00:00Z" }, "live", { ...rehearsal, successful: 9, failed: 1 }),
  /live_requires_rehearsal/,
);

const ready = {
  ...DEFAULT_CONTEST_CONFIG,
  status: "testing",
  legalEntityVerified: true,
  startAt: "2026-10-01T00:00:00Z",
  endAt: "2026-10-22T00:00:00Z",
};
assert.equal(isLiveReady(ready, rehearsal), true);
assert.equal(transitionContest(ready, "live", rehearsal).status, "live");

assert.equal(isAttemptEligibleForEntry({ status: "declined", authorizationId: "auth", ledgerReceiptId: "receipt", validEvidenceCount: 3, minimumValidResults: 3 }), true);
assert.equal(isAttemptEligibleForEntry({ status: "declined", authorizationId: "auth", ledgerReceiptId: null, validEvidenceCount: 3, minimumValidResults: 3 }), false);
assert.equal(isAttemptEligibleForEntry({ status: "authorization_failed", authorizationId: "auth", ledgerReceiptId: "receipt", validEvidenceCount: 3, minimumValidResults: 3 }), false);

const realDecline = { status: "declined", authorizationId: "auth_1", ledgerReceiptId: "receipt_1", reasonCode: "POLICY_LIMIT_EXCEEDED", reasonMessage: "exceeds demo policy", policyVersion: "domains-only-v1" };
assert.equal(isGenuineDecline(realDecline, "domains-only-v1"), true);
assert.equal(isGenuineDecline({ ...realDecline, ledgerReceiptId: "" }, "domains-only-v1"), false);
assert.equal(isGenuineDecline({ ...realDecline, policyVersion: "wrong-policy" }, "domains-only-v1"), false);
assert.equal(isGenuineDecline(null, "domains-only-v1"), false);

console.log("macbook-gate: Phase 1A configuration, state machine, rehearsal gate and fail-closed contracts passed");
