// @ts-expect-error Node's offline test loader needs the explicit extension; Pages bundles extensionless imports.
import { RETAILERS, type Retailer } from "./macbook-gate.ts";

export type SearchMode = "sandbox" | "live";

export type RecordedOffer = {
  retailer: Retailer;
  productTitle: string;
  modelIdentifier: string;
  url: string;
  priceMinor: number;
  currency: string;
  shippingMinor: number;
  availability: "in_stock" | "out_of_stock" | "unknown";
  capturedAt: string;
  evidenceUrl: string;
  evidenceHash: string;
  provenance: {
    source: "recorded_real_offer";
    capturedFrom: string;
    capturedAt: string;
    operator: string;
  };
};

export type EvidenceValidationError =
  | "unsupported_retailer"
  | "invalid_url"
  | "invalid_price"
  | "invalid_currency"
  | "invalid_model_identifier"
  | "invalid_availability"
  | "invalid_timestamp"
  | "future_evidence"
  | "stale_evidence"
  | "missing_evidence_hash"
  | "evidence_hash_mismatch"
  | "missing_provenance"
  | "duplicate_offer";

export type ValidatedOffer = RecordedOffer;

export type SearchResult = {
  offers: ValidatedOffer[];
  validResultCount: number;
  errors: Array<{ index: number; code: EvidenceValidationError }>;
  bestOffer: ValidatedOffer | null;
};

export type SearchContext = {
  now?: Date;
  maxEvidenceAgeHours: number;
  rehearsal: boolean;
};

export type LiveSearch = (query: string, retailers: readonly Retailer[]) => Promise<RecordedOffer[]>;

const RETAILER_ORDER = new Map(RETAILERS.map((retailer, index) => [retailer, index]));
const ISO_CURRENCY = /^[A-Z]{3}$/;
const HASH = /^[a-f0-9]{64}$/;
const MODEL_IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9 ._\-/]{1,119}$/;
const AVAILABILITY = new Set(["in_stock", "out_of_stock", "unknown"]);

function validDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function evidencePayload(offer: Omit<RecordedOffer, "evidenceHash" | "provenance">): string {
  return [
    offer.retailer,
    offer.productTitle,
    offer.modelIdentifier,
    offer.url,
    offer.priceMinor,
    offer.currency,
    offer.shippingMinor,
    offer.availability,
    offer.capturedAt,
    offer.evidenceUrl,
  ].join("|");
}

async function expectedEvidenceHash(offer: RecordedOffer): Promise<string> {
  const { evidenceHash, provenance, ...withoutHash } = offer;
  void evidenceHash;
  void provenance;
  return sha256(evidencePayload(withoutHash));
}

export async function validateRecordedOffers(
  offers: readonly RecordedOffer[],
  context: SearchContext,
): Promise<SearchResult> {
  const now = context.now || new Date();
  const valid: ValidatedOffer[] = [];
  const errors: Array<{ index: number; code: EvidenceValidationError }> = [];
  const seen = new Set<string>();

  for (const [index, offer] of offers.entries()) {
    if (!RETAILERS.includes(offer.retailer)) {
      errors.push({ index, code: "unsupported_retailer" });
      continue;
    }
    if (!offer.url.startsWith("https://") || !offer.evidenceUrl.startsWith("https://")) {
      errors.push({ index, code: "invalid_url" });
      continue;
    }
    if (!Number.isInteger(offer.priceMinor) || offer.priceMinor <= 0 || !Number.isInteger(offer.shippingMinor) || offer.shippingMinor < 0) {
      errors.push({ index, code: "invalid_price" });
      continue;
    }
    if (!ISO_CURRENCY.test(offer.currency)) {
      errors.push({ index, code: "invalid_currency" });
      continue;
    }
    if (!MODEL_IDENTIFIER.test(offer.modelIdentifier)) {
      errors.push({ index, code: "invalid_model_identifier" });
      continue;
    }
    if (!AVAILABILITY.has(offer.availability)) {
      errors.push({ index, code: "invalid_availability" });
      continue;
    }
    if (!validDate(offer.capturedAt) || !validDate(offer.provenance.capturedAt)) {
      errors.push({ index, code: "invalid_timestamp" });
      continue;
    }
    const capturedAt = Date.parse(offer.capturedAt);
    const age = now.getTime() - capturedAt;
    if (age < 0) {
      errors.push({ index, code: "future_evidence" });
      continue;
    }
    if (age > context.maxEvidenceAgeHours * 60 * 60 * 1000) {
      errors.push({ index, code: "stale_evidence" });
      continue;
    }
    if (!HASH.test(offer.evidenceHash)) {
      errors.push({ index, code: "missing_evidence_hash" });
      continue;
    }
    if (offer.provenance.source !== "recorded_real_offer" || !offer.provenance.capturedFrom.startsWith("https://") || !offer.provenance.operator) {
      errors.push({ index, code: "missing_provenance" });
      continue;
    }
    if (offer.provenance.capturedAt !== offer.capturedAt || offer.provenance.capturedFrom !== offer.url) {
      errors.push({ index, code: "missing_provenance" });
      continue;
    }
    if (offer.evidenceHash !== await expectedEvidenceHash(offer)) {
      errors.push({ index, code: "evidence_hash_mismatch" });
      continue;
    }
    const duplicateKey = `${offer.retailer}|${offer.modelIdentifier}`;
    if (seen.has(duplicateKey)) {
      errors.push({ index, code: "duplicate_offer" });
      continue;
    }
    seen.add(duplicateKey);
    valid.push(offer);
  }

  valid.sort((a, b) =>
    (a.priceMinor + a.shippingMinor) - (b.priceMinor + b.shippingMinor) ||
    (RETAILER_ORDER.get(a.retailer) || 0) - (RETAILER_ORDER.get(b.retailer) || 0) ||
    a.modelIdentifier.localeCompare(b.modelIdentifier),
  );

  return { offers: valid, validResultCount: valid.length, errors, bestOffer: valid[0] || null };
}

export function createSearchProvider(options: {
  mode: SearchMode;
  sandboxOffers: readonly RecordedOffer[];
  liveSearch?: LiveSearch;
  liveEnabledForRehearsal?: boolean;
}) {
  return {
    async search(query: string, context: SearchContext): Promise<SearchResult> {
      if (!query.trim()) return { offers: [], validResultCount: 0, errors: [], bestOffer: null };
      if (options.mode === "sandbox") return validateRecordedOffers(options.sandboxOffers, context);
      if (!context.rehearsal || options.liveEnabledForRehearsal !== true || !options.liveSearch) {
        throw new Error("live_search_requires_rehearsal");
      }
      return validateRecordedOffers(await options.liveSearch(query, RETAILERS), context);
    },
  };
}

export function hasMinimumEvidence(result: SearchResult, minimumValidResults = 3): boolean {
  return result.validResultCount >= minimumValidResults;
}

/** Test helper only. It creates a hash for a supplied validator object; it does not claim a real retailer capture. */
export async function evidenceHashForTest(offer: Omit<RecordedOffer, "evidenceHash" | "provenance">): Promise<string> {
  return sha256(evidencePayload(offer));
}
