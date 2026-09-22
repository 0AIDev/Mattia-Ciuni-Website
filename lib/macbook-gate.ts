export const MACBOOK_GATE_VERSION = "phase-1a" as const;
export const MACBOOK_CANONICAL_ORIGIN = "https://mattiaciuni.it" as const;

export const CONTEST_STATUSES = [
  "draft",
  "testing",
  "live",
  "paused",
  "closed",
  "drawing",
  "complete",
  "cancelled",
] as const;
export type ContestStatus = (typeof CONTEST_STATUSES)[number];

export const ATTEMPT_STATUSES = [
  "created",
  "searching",
  "search_complete",
  "search_failed",
  "authorizing",
  "declined",
  "authorization_failed",
  "ineligible",
  "expired",
] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export const CLAIM_STATUSES = ["unverified", "verified"] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const RETAILERS = ["apple", "amazon", "back_market"] as const;
export type Retailer = (typeof RETAILERS)[number];

export type ContestConfig = {
  slug: string;
  canonicalOrigin: typeof MACBOOK_CANONICAL_ORIGIN;
  status: ContestStatus;
  entryCap: 3000;
  maxAttemptsPerIpDay: 2;
  llmDailyBudgetUsd: 30;
  maxPrizeSpendUsd: 2000;
  maxTotalSpendUsd: 2500;
  maxEvidenceAgeHours: number;
  minimumValidResults: 3;
  allowedRetailers: readonly Retailer[];
  baseEntriesPerEmail: 1;
  socialBonusesEnabled: false;
  referralBonusesEnabled: false;
  legalEntityVerified: boolean;
  claimStatus: ClaimStatus;
  startAt: string | null;
  endAt: string | null;
  rulesVersion: string;
  policyVersion: string;
};

/** Safe before launch: no dates, no legal entity, and no public LIVE state. */
export const DEFAULT_CONTEST_CONFIG: ContestConfig = {
  slug: "macbook-2026",
  canonicalOrigin: MACBOOK_CANONICAL_ORIGIN,
  status: "draft",
  entryCap: 3000,
  maxAttemptsPerIpDay: 2,
  llmDailyBudgetUsd: 30,
  maxPrizeSpendUsd: 2000,
  maxTotalSpendUsd: 2500,
  maxEvidenceAgeHours: 24,
  minimumValidResults: 3,
  allowedRetailers: RETAILERS,
  baseEntriesPerEmail: 1,
  socialBonusesEnabled: false,
  referralBonusesEnabled: false,
  legalEntityVerified: false,
  claimStatus: "unverified",
  startAt: null,
  endAt: null,
  rulesVersion: "2026-10-v1",
  policyVersion: "domains-only-v1",
};

export const CLAIM_COPY = {
  unverified: "A MacBook bought by an AI agent under human-defined policy, with a public receipt.",
  verified: "The first MacBook ever bought by an AI agent under human-defined policy, with a public receipt.",
} as const;

export type StateTransitionError =
  | "invalid_transition"
  | "live_requires_legal_entity"
  | "live_requires_dates"
  | "live_requires_rehearsal"
  | "live_requires_verified_claim_evidence";

export type RehearsalSummary = {
  total: number;
  successful: number;
  failed: number;
  allHaveRealAuthorization: boolean;
  allHaveLedgerReceipts: boolean;
  allHaveMinimumEvidence: boolean;
};

export function canPublishClaim(config: Pick<ContestConfig, "claimStatus">): boolean {
  return config.claimStatus === "verified";
}

export function publicClaim(config: Pick<ContestConfig, "claimStatus">): string {
  return CLAIM_COPY[config.claimStatus];
}

export function isLiveReady(config: ContestConfig, rehearsal: RehearsalSummary): boolean {
  return (
    config.legalEntityVerified &&
    config.startAt !== null &&
    config.endAt !== null &&
    rehearsal.total === 10 &&
    rehearsal.successful === 10 &&
    rehearsal.failed === 0 &&
    rehearsal.allHaveRealAuthorization &&
    rehearsal.allHaveLedgerReceipts &&
    rehearsal.allHaveMinimumEvidence
  );
}

const TRANSITIONS: Record<ContestStatus, readonly ContestStatus[]> = {
  draft: ["testing", "cancelled"],
  testing: ["live", "paused", "cancelled"],
  live: ["paused", "closed"],
  paused: ["testing", "live", "closed", "cancelled"],
  closed: ["drawing", "cancelled"],
  drawing: ["complete", "cancelled"],
  complete: [],
  cancelled: [],
};

export function canTransition(from: ContestStatus, to: ContestStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function transitionContest(
  config: ContestConfig,
  to: ContestStatus,
  rehearsal: RehearsalSummary,
): ContestConfig {
  if (!canTransition(config.status, to)) throw new Error("invalid_transition" satisfies StateTransitionError);
  if (to === "live" && !config.legalEntityVerified) {
    throw new Error("live_requires_legal_entity" satisfies StateTransitionError);
  }
  if (to === "live" && (!config.startAt || !config.endAt)) {
    throw new Error("live_requires_dates" satisfies StateTransitionError);
  }
  if (to === "live" && !isLiveReady(config, rehearsal)) {
    throw new Error("live_requires_rehearsal" satisfies StateTransitionError);
  }
  return { ...config, status: to };
}

export function isAttemptEligibleForEntry(input: {
  status: AttemptStatus;
  authorizationId: string | null;
  ledgerReceiptId: string | null;
  validEvidenceCount: number;
  minimumValidResults: number;
}): boolean {
  return (
    input.status === "declined" &&
    Boolean(input.authorizationId) &&
    Boolean(input.ledgerReceiptId) &&
    input.validEvidenceCount >= input.minimumValidResults
  );
}

export type AuthorizationDecision =
  | {
      status: "approved";
      authorizationId: string;
      ledgerReceiptId: string;
      policyVersion: string;
    }
  | {
      status: "declined";
      authorizationId: string;
      ledgerReceiptId: string;
      reasonCode: string;
      reasonMessage: string;
      policyVersion: string;
    };

/** Provider failures, timeouts, and incomplete receipts are never decisions. */
export function isGenuineDecline(
  decision: AuthorizationDecision | null,
  expectedPolicyVersion: string,
): decision is Extract<AuthorizationDecision, { status: "declined" }> {
  return Boolean(
    decision &&
      decision.status === "declined" &&
      decision.authorizationId &&
      decision.ledgerReceiptId &&
      decision.reasonCode &&
      decision.policyVersion === expectedPolicyVersion,
  );
}
