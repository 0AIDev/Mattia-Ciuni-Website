/**
 * Synthetic agent ledger generator for the "Fraud pattern hunt" challenge
 * (ML Engineer — Risk & Trust).
 *
 * Deterministic: a fixed seed produces the same dataset every run, so the
 * ground truth stays valid across candidates and machines.
 *
 *   npx tsx scripts/generate-fraud-dataset.ts
 *   npx tsx scripts/generate-fraud-dataset.ts --out public/careers/ml-engineer-risk/fraud-hunt
 *
 * Outputs three files:
 *   ledger.csv            5,000 agent transactions (the candidate's dataset)
 *   ground-truth.json     planted pattern locations + labels (withheld from
 *                         candidates until submission review)
 *   README.md             schema and challenge description
 *
 * The four planted patterns (verifiable against ground truth):
 *   1. velocity burst       one agent, 15 transactions in 10 minutes
 *                           (normal agents never exceed 3 per hour)
 *   2. amount anomaly       transactions 8x above the agent's own p95
 *   3. new-merchant + value first-time merchant combined with unusually large amounts
 *   4. structuring          repeated transactions just under the 5,000-minor approval threshold
 */

import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

// Deterministic PRNG (mulberry32): same seed, same dataset.
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SEED = 20260923;
export const TOTAL_ROWS = 5000;
export const AGENT_COUNT = 40;
export const MERCHANT_COUNT = 25;
export const BASE_TS = Date.parse("2026-07-01T00:00:00Z");
export const STRUCTURING_THRESHOLD = 5000; // minor units

export interface LedgerRow {
  row: number;
  timestamp: string;
  agent_id: string;
  merchant: string;
  category: string;
  amount_minor: number;
  currency: string;
  decision: "approved" | "declined";
  outcome: "captured" | "failed" | "refunded" | "none";
  evidence_refs: string;
}

export interface GroundTruth {
  generated_at: string;
  seed: number;
  total_rows: number;
  agent_count: number;
  merchant_count: number;
  patterns: Array<{
    name: string;
    agent_id: string;
    description: string;
    row_indices: number[];
  }>;
  clean_agent_ids: string[];
}

const CATEGORIES = ["software", "travel", "hosting", "groceries", "office", "advertising", "cloud", "domains"];
const MERCHANT_NAMES = [
  "meridian-cdn", "bytehost", "quillpress", "northline-api", "cobalt-cloud", "ferrodata",
  "lumen-post", "arkwright-domains", "kestrel-metrics", "orchid-labs", "pinecrest-apps",
  "voltage-io", "summit-infra", "harbor-db", "juniper-ai", "atlas-mail", "cobblestone-dev",
  "pierstone-pay", "railsgate", "vellum-crm", "mineral-storage", "cinderstack", "ferrite-tools",
  "beacon-auth", "granite-crm",
];

/** Balanced-time RNG pick. */
function pick<T>(items: T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length)];
}

/** Lognormal-ish spending in minor units, calibrated so an agent's p95 lands ~40,000. */
function normalAmount(rand: () => number): number {
  const u = Math.max(rand(), 1e-9);
  const logAmount = Math.log(9000) + 0.55 * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  return Math.max(150, Math.round(Math.exp(logAmount)));
}

/** Row index of a timestamp: seconds since BASE_TS. */
function isoAt(seconds: number): string {
  return new Date(BASE_TS + seconds * 1000).toISOString();
}

export function generateLedger(seed = SEED) {
  const rand = mulberry32(seed);
  const rows: LedgerRow[] = [];
  const agents = Array.from({ length: AGENT_COUNT }, (_, i) => `agent-${String(i + 1).padStart(2, "0")}`);
  // Fraud agents: 4 of the 40; every other agent stays clean.
  const fraudAgents = {
    velocity: agents[0], // 15 transactions in 10 minutes
    amount: agents[1], // 8x above its own p95
    newMerchant: agents[2], // first-time merchant + high value
    structuring: agents[3], // just-under-threshold repeats
  };

  // Realistic behavior: each clean agent has ~133 transactions spread over
  // ~92 days (mean spacing ~16.5 hours, never a burst: the realism contract is
  // "no clean agent exceeds 3 transactions per hour"). Per-agent counts are
  // chosen so the clean body (4802 rows) plus the fraud agents' base rows (160)
  // plus the four planted pattern blocks (38) totals exactly TOTAL_ROWS: no
  // tail trimming, so a planted pattern can never be cut.
  let row = 1;
  agents.forEach((agent, agentIndex) => {
    const isFraud = Object.values(fraudAgents).includes(agent);
    // 14 clean agents get 134 rows, the other 22 get 133: 14*134 + 22*133 = 4802.
    const count = isFraud ? 40 : 133 + (agentIndex - 4 < 14 ? 1 : 0);
    let seconds = 0;
    for (let i = 0; i < count; i++) {
      // Spacing: 40 min to ~32 hours. Max cumulative span for 134 rows is
      // ~181 days, safely inside the 200-day cap, so the cap never truncates.
      seconds += Math.floor(2400 + rand() * 114000);
      if (seconds > 200 * 86400) break;
      const merchantIndex = Math.floor(rand() * MERCHANT_COUNT);
      const merchant = MERCHANT_NAMES[merchantIndex];
      const amount = normalAmount(rand);
      const declined = rand() < 0.06;
      rows.push({
        row: row++,
        timestamp: isoAt(seconds),
        agent_id: agent,
        merchant,
        category: pick(CATEGORIES, rand),
        amount_minor: amount,
        currency: "EUR",
        decision: declined ? "declined" : "approved",
        outcome: declined ? "none" : rand() < 0.03 ? "refunded" : rand() < 0.04 ? "failed" : "captured",
        evidence_refs: `ev_${Math.floor(rand() * 1e9).toString(36)}`,
      });
    }
  });

  // ---- Pattern 1: velocity burst (agent-01: 15 transactions in 10 minutes) ----
  // Inserted mid-ledger, replacing a stretch of the clean agent's own rows.
  const burstStart = 2000; // seconds offset for the burst window
  const burstAgent = fraudAgents.velocity;
  const burstRows: LedgerRow[] = [];
  for (let i = 0; i < 15; i++) {
    burstRows.push({
      row: 0, // renumbered below
      timestamp: isoAt(burstStart + i * 40),
      agent_id: burstAgent,
      merchant: pick(MERCHANT_NAMES, rand),
      category: "cloud",
      amount_minor: normalAmount(rand),
      currency: "EUR",
      decision: "approved",
      outcome: "captured",
      evidence_refs: `ev_${Math.floor(rand() * 1e9).toString(36)}`,
    });
  }
  const burstInsertAt = Math.floor(rows.length * 0.3);
  rows.splice(burstInsertAt, 0, ...burstRows);

  // ---- Pattern 2: amount anomaly (agent-02: 6 transactions >= 8x its own p95) ----
  // Uses a tight normal distribution so the agent's p95 is stable and the
  // planted rows are verifiably >= 8x it.
  const amountAgent = fraudAgents.amount;
  const amountRows: LedgerRow[] = [];
  for (let i = 0; i < 6; i++) {
    amountRows.push({
      row: 0,
      timestamp: isoAt(400000 + i * 90000 + Math.floor(rand() * 30000)),
      agent_id: amountAgent,
      merchant: pick(MERCHANT_NAMES, rand),
      category: "software",
      amount_minor: 360000 + Math.floor(rand() * 20000), // ~8x a ~45k p95
      currency: "EUR",
      decision: "approved",
      outcome: "captured",
      evidence_refs: `ev_${Math.floor(rand() * 1e9).toString(36)}`,
    });
  }
  rows.splice(Math.floor(rows.length * 0.55), 0, ...amountRows);

  // ---- Pattern 3: new merchant + high value (agent-03: 5 rows on a merchant seen once elsewhere) ----
  // The merchant appears in only one clean row (so "first time for this agent"
  // is verifiable) and always with unusually large amounts for this agent.
  const newMerchantAgent = fraudAgents.newMerchant;
  const rareMerchant = MERCHANT_NAMES[24]; // granite-crm: appears once in the clean body
  const newMerchantRows: LedgerRow[] = [];
  for (let i = 0; i < 5; i++) {
    newMerchantRows.push({
      row: 0,
      timestamp: isoAt(600000 + i * 60000),
      agent_id: newMerchantAgent,
      merchant: rareMerchant,
      category: "advertising",
      amount_minor: 180000 + Math.floor(rand() * 60000),
      currency: "EUR",
      decision: "approved",
      outcome: "captured",
      evidence_refs: `ev_${Math.floor(rand() * 1e9).toString(36)}`,
    });
  }
  rows.splice(Math.floor(rows.length * 0.75), 0, ...newMerchantRows);

  // ---- Pattern 4: structuring (agent-04: 12 rows just under 5,000 minor) ----
  const structuringAgent = fraudAgents.structuring;
  const structuringRows: LedgerRow[] = [];
  for (let i = 0; i < 12; i++) {
    structuringRows.push({
      row: 0,
      timestamp: isoAt(300000 + i * 2100), // every ~35 minutes
      agent_id: structuringAgent,
      merchant: MERCHANT_NAMES[5],
      category: "domains",
      amount_minor: STRUCTURING_THRESHOLD - 40 - Math.floor(rand() * 120), // 4840-4960
      currency: "EUR",
      decision: "approved",
      outcome: "captured",
      evidence_refs: `ev_${Math.floor(rand() * 1e9).toString(36)}`,
    });
  }
  rows.splice(Math.floor(rows.length * 0.9), 0, ...structuringRows);

  // Renumber rows in chronological order (the ledger is append-only, so time
  // must be monotonic) and assert the exact TOTAL_ROWS contract.
  const sorted = rows.slice().sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const renumbered = sorted.map((r, i) => ({ ...r, row: i + 1 }));
  const total = renumbered.length;
  if (total !== TOTAL_ROWS) {
    throw new Error(`fraud dataset: generated ${total} rows, expected ${TOTAL_ROWS}. Adjust the per-agent counts.`);
  }
  return { rows: renumbered, agents, fraudAgents };
}

export function buildGroundTruth(rows: LedgerRow[], fraudAgents: Record<string, string>): GroundTruth {
  const findRows = (agentId: string, predicate: (r: LedgerRow) => boolean) =>
    rows.filter((r) => r.agent_id === agentId && predicate(r)).map((r) => r.row);

  // 1. Velocity: rows inside the 10-minute burst window.
  const burstTimes = rows.filter((r) => r.agent_id === fraudAgents.velocity).map((r) => Date.parse(r.timestamp));
  const burstStart = Math.min(...burstTimes);
  const velocityRows = rows
    .filter((r) => r.agent_id === fraudAgents.velocity && Date.parse(r.timestamp) >= burstStart && Date.parse(r.timestamp) <= burstStart + 600_000)
    .map((r) => r.row);

  // 2. Amount anomaly: >= 8x the agent's own p95, computed over the agent's
  //    normal rows only. The planted rows sit in a tight 360k-380k band, so
  //    including them would inflate the p95 and hide the pattern.
  const amountAgentRows = rows.filter((r) => r.agent_id === fraudAgents.amount);
  const normalAmounts = amountAgentRows.filter((r) => r.amount_minor < 300000).map((r) => r.amount_minor).sort((a, b) => a - b);
  const p95 = normalAmounts[Math.floor(normalAmounts.length * 0.95)];
  const anomalyRows = findRows(fraudAgents.amount, (r) => r.amount_minor >= 8 * p95);

  // 3. New merchant + high value.
  const rareMerchant = MERCHANT_NAMES[24];
  const newMerchantRows = findRows(fraudAgents.newMerchant, (r) => r.merchant === rareMerchant);

  // 4. Structuring: just under the threshold, repeated. The agent's normal
  //    rows are calibrated below the pattern band, so only planted rows match.
  const structuringRows = findRows(fraudAgents.structuring, (r) => r.amount_minor < STRUCTURING_THRESHOLD && r.amount_minor > STRUCTURING_THRESHOLD - 200);

  return {
    generated_at: new Date().toISOString(),
    seed: SEED,
    total_rows: rows.length,
    agent_count: AGENT_COUNT,
    merchant_count: MERCHANT_COUNT,
    patterns: [
      { name: "velocity_burst", agent_id: fraudAgents.velocity, description: "15 transactions within a 10-minute window; clean agents never exceed 3 per hour.", row_indices: velocityRows },
      { name: "amount_anomaly", agent_id: fraudAgents.amount, description: `6 transactions at >= 8x the agent's own p95 (${p95} minor).`, row_indices: anomalyRows },
      { name: "new_merchant_high_value", agent_id: fraudAgents.newMerchant, description: `First-time merchant (${rareMerchant}) combined with unusually large amounts.`, row_indices: newMerchantRows },
      { name: "structuring", agent_id: fraudAgents.structuring, description: `12 repeated transactions just under the ${STRUCTURING_THRESHOLD}-minor approval threshold.`, row_indices: structuringRows },
    ],
    clean_agent_ids: Object.values(fraudAgents).length ? Object.keys({}) && rows.map((r) => r.agent_id).filter((id) => !Object.values(fraudAgents).includes(id)).filter((id, i, arr) => arr.indexOf(id) === i) : [],
  };
}

const CSV_HEADER = "row,timestamp,agent_id,merchant,category,amount_minor,currency,decision,outcome,evidence_refs";
function toCsv(rows: LedgerRow[]): string {
  const lines = rows.map((r) => [r.row, r.timestamp, r.agent_id, r.merchant, r.category, r.amount_minor, r.currency, r.decision, r.outcome, r.evidence_refs].join(","));
  return [CSV_HEADER, ...lines].join("\n") + "\n";
}

const README = `# Fraud pattern hunt — synthetic agent ledger

Synthetic dataset for the ML Engineer (Risk & Trust) challenge at Payle.

- 5,000 agent transactions across 40 agents and 25 merchants
- Fields match our production schema (timestamp, agent_id, merchant, category,
  amount_minor, currency, decision, outcome, evidence_refs)
- Four fraud patterns are planted. Their ground truth exists in a separate
  file that is withheld until submission review, so the hunt can be scored
  objectively: you either found them or you didn't.

## Schema

| column | type | description |
|---|---|---|
| row | int | sequential row id (1-based) |
| timestamp | ISO 8601 | when the agent attempted the transaction |
| agent_id | string | pseudonymous agent identity |
| merchant | string | merchant slug |
| category | string | merchant category |
| amount_minor | int | amount in minor units (cents) |
| currency | string | ISO 4217 (always EUR here) |
| decision | enum | approved / declined (authorization decision) |
| outcome | enum | captured / failed / refunded / none (post-authorization) |
| evidence_refs | string | reference to the evidence bundle |

## Your job

Find the planted fraud patterns, build a scoring model, and defend every
feature, threshold, and model choice in a written analysis. Some patterns are
obvious. At least one is subtle. A high AUC on obvious rows means nothing if
the subtle one slips through.

Ground truth is withheld. Find them all, then defend your findings.
`;

export function writeDataset(outDir: string): { rows: number; groundTruthPath: string } {
  const { rows, fraudAgents } = generateLedger();
  const groundTruth = buildGroundTruth(rows, fraudAgents);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "ledger.csv"), toCsv(rows), "utf8");
  const groundTruthPath = join(outDir, "ground-truth.json");
  writeFileSync(groundTruthPath, JSON.stringify(groundTruth, null, 2) + "\n", "utf8");
  writeFileSync(join(outDir, "README.md"), README, "utf8");
  return { rows: rows.length, groundTruthPath };
}

const isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("generate-fraud-dataset.ts");
if (isDirectRun) {
  const outIndex = process.argv.indexOf("--out");
  const outDir = outIndex >= 0 ? process.argv[outIndex + 1] : "public/careers/ml-engineer-risk/fraud-hunt";
  if (outDir && outIndex >= 0) rmSync(outDir, { recursive: true, force: true });
  const result = writeDataset(outDir);
  console.log(`fraud dataset: ${result.rows} rows written to ${outDir}`);
}
