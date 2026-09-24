export type JobStatus = "open" | "coming-soon" | "closed";

export type CareerQuestion = {
  id: string;
  label: string;
  type: "text" | "textarea" | "url" | "number";
  required: boolean;
  minimum: number;
};

export interface CareerChallenge {
  title: string;
  description: string;
  deliverable: string;
}

export interface CareerJob {
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  compensation?: string;
  status: JobStatus;
  shortPitch: string;
  description: string;
  challenge?: CareerChallenge;
  employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACTOR";
  postedAt?: string;
  questions?: CareerQuestion[];
  /** JobPosting structured data: real salary band when the role is open. */
  salaryMin?: number;
  salaryMax?: number;
  /** Sidebar copy override for open roles (kept minimal: one sentence). */
  applyNote?: string;
  /** Highlighted note rendered under the challenge, with an optional asset link. */
  datasetNote?: string;
  datasetHref?: string;
  datasetHrefLabel?: string;
}

/**
 * Mattia adds real openings here by changing status to "open" and filling in
 * the role details. Keep compensation and availability explicit on every live role.
 */
export const jobs: CareerJob[] = [
  {
    slug: "agent-runtime-founding-engineer",
    title: "Founding Engineer, Agent Runtime",
    department: "Engineering",
    location: "Remote, flexible time zones",
    type: "Full-time (contractor now)",
    compensation: "€2,500-3,000/month + 0.75-1% equity",
    status: "open",
    postedAt: "2026-09-23",
    shortPitch: "Build the execution layer that lets AI agents act without losing the rules that keep money safe.",
    description: `### The role

Payle's authorization engine is live: agents ask for permission, a deterministic policy engine decides, every transaction lands in a hash-chained ledger that anyone can verify. The money path is audited, money-tested under concurrency, and finished.

What's missing is the layer agents run on. You would own it end to end: the agent runtime that searches real retailers, captures evidence, compares offers, attempts purchases through the authorization gate, and verifies outcomes. Your work is the reason the gate exists: without the runtime, the engine is a vault with no hands.

### What exists

- The Go authorization core: policy DSL, idempotent under concurrent agent retries (proven: 100 parallel identical requests, exactly one decision), hash-chained append-only ledger, kill switch, reconciliation. Externally audited; findings fixed with regression tests in CI.
- A live demo: our agent buys real domains through the gate at mattiaciuni.pages.dev/agent: real search, real policy decline, real receipts.
- The OpenAPI contract between engine and runtime: your layer consumes it, and helps us evolve it.

### What you'd build

- The full agent runtime: planning loops with frontier LLMs (tool calling, structured outputs), search connectors across retailers (Apple, Amazon, Back Market for the launch campaign; broader catalog over time), a browser pipeline for evidence capture (screenshots, extraction hashes, freshness checks)
- Deterministic comparison and ranking: same input, same ranking, every time: with written explanations for every recommendation. The LLM plans; it never ranks silently
- The MacBook Gate: our launch campaign where the agent tries to buy a MacBook 2,000 times under policy, declines every time, and buys one real one for the draw winner. Your runtime powers it
- Outcome verification: the charge is not the task. You build the checks that prove the domain registered, the order shipped, the subscription cancelled

### You

- TypeScript/Node strong: the runtime lives in TypeScript. Go familiarity is a plus (the engine you'll talk to is Go)
- LLM orchestration in production: tool calling, structured outputs, planning loops: and you know where agents break: retries that double-charge, silent prompt injection, workflows that look fine in demo and die at scale
- Web automation real experience: Playwright, anti-bot realities, evidence capture without faking anything
- You understand money: idempotency, the difference between a timeout and a decline, why "it worked in the demo" is not a deployment standard
- Written communication: the team is distributed and writes everything down. You explain decisions in text, cleanly

### Compensation

€2,500-3,000/month + 0.75-1% equity (4-year vesting, 1-year cliff). Contractor now, full-time at YC acceptance, relocation possible with sponsorship.

### The challenge

Your first artifact: a small agent with a hard boundary. Build an agent that does useful work while keeping authorization deterministic and inspectable. Deliverable: a working repository, a short decision log, and tests that show where the boundary holds. We pay for your time.`,
    challenge: {
      title: "A small agent with a hard boundary",
      description: "Build an agent that does useful work while keeping authorization deterministic and inspectable. We pay for your time.",
      deliverable: "A working repository, a short decision log, and tests that show where the boundary holds.",
    },
    employmentType: "FULL_TIME",
    salaryMin: 2500,
    salaryMax: 3000,
  },
  {
    slug: "ml-engineer-risk",
    title: "ML Engineer — Risk & Trust",
    department: "Engineering",
    location: "Remote (global)",
    type: "Part-time → Full-time (YC acceptance)",
    compensation: "€2,000-3,500/month + 0.5-1% equity",
    status: "open",
    postedAt: "2026-09-23",
    shortPitch: "Build the trust layer for autonomous agent spending: fraud scoring, on a behavioral dataset that doesn't exist anywhere else.",
    description: `### The role

Payle's authorization engine decides, in milliseconds, whether an AI agent is allowed to spend money. It's deterministic, policy-driven, and live. What it doesn't have yet is a risk layer: the ML that scores transactions for fraud, scores merchants for quality, and builds trust profiles for agents over time.

Phase 0 of that risk engine is rules-based and in final build. Phase 1 is yours: evolve it into real ML on a dataset nobody else on earth has: an append-only ledger of every agent authorization, payment, and outcome, with full context attached.

### What you'd build

- Risk scoring for agent transactions: fraud detection, merchant quality scoring, and per-agent trust profiles that evolve with every verified outcome
- A feature store with point-in-time correctness: no leakage. Enforced in code, proven by test, not promised in a doc
- Models: starting with LightGBM (explainable, fast, right for tabular data at 20ms latency budgets), evolving as labeled data grows. If a deep learning model earns its place, bring the evidence
- Explainability on every decision: SHAP-derived factors, because credit-adjacent outputs must be explainable to users, merchants, and eventually regulators
- Model discipline: registry, model cards, drift monitoring (PSI), shadow-mode deployments before anything influences a real decision, and fairness testing on underwriting-adjacent models
- The honest constraint: you cannot train fraud detection on data that doesn't exist yet. Phase 1 is building the pipelines, the feature store, and the evaluation discipline. The models earn their deployment as the labeled data grows. If you'd rather pretend otherwise, we're the wrong company

### You

- Strong classical ML: LightGBM/XGBoost, feature engineering, proper validation. And you can explain why you'd pick classical over deep learning for tabular fraud scoring at 20ms latency
- You've felt the pain of data leakage, or you're hungry to learn why it silently kills models that look perfect offline
- You treat "AUC 0.99" as a red flag, not a win
- Python strong, SQL competent, comfortable with point-in-time joins and event-time reasoning
- Written communication: the team is distributed across four countries and writes everything down. You explain model decisions in text, cleanly

### Compensation

€2,000-3,500/month (part-time to start, full-time path at YC acceptance) + 0.5-1% equity (4-year vesting, 1-year cliff). Remote-first, async-friendly, Friday demos for the whole team.

### The challenge

Your first artifact: a fraud pattern hunt. We give you a synthetic agent ledger dataset with planted fraud patterns (some obvious, some subtle). Build the scoring model, find the patterns, and defend every feature, threshold, and model choice in a written analysis. We pay for your time. You keep the work.`,
    challenge: {
      title: "Fraud pattern hunt",
      description: "Find the planted fraud pattern in a synthetic agent ledger dataset, build the scoring model, and defend every feature and threshold you choose.",
      deliverable: "Jupyter notebook + written analysis: features used, model choice defended, explainability output, and the fraud pattern you found.",
    },
    employmentType: "PART_TIME",
    salaryMin: 2000,
    salaryMax: 3500,
    applyNote: "Applications are open. First step: the fraud pattern hunt below.",
    datasetNote: "**Note:** the synthetic dataset ships with the challenge. In production, you'd train on our real append-only ledger, a dataset of agent spending behavior that doesn't exist anywhere else.",
    datasetHref: "/careers/ml-engineer-risk/fraud-hunt/ledger.csv",
    datasetHrefLabel: "Download the dataset (CSV)",
    questions: [
      { id: "ml-models-deployed", label: "How many ML models have you deployed to production (serving real predictions to real users)?", type: "number", required: true, minimum: 0 },
      { id: "ml-shadow-mode", label: "Your fraud/risk model scores a transaction 0.97 with great offline AUC. What do you do BEFORE deploying it to production?", type: "textarea", required: true, minimum: 200 },
      { id: "ml-rules-vs-ml", label: "Pre-seed stage: our labeled fraud data is small. Rules first and evolve to ML, or ML immediately? Be concrete about the trade-off.", type: "textarea", required: true, minimum: 200 },
      { id: "ml-lightgbm-or-deep", label: "Which would you pick for tabular fraud scoring at 20ms latency: LightGBM or a deep model? What would change your mind?", type: "textarea", required: true, minimum: 200 },
    ],
  },
];

export function getJob(slug: string): CareerJob | undefined {
  return jobs.find((job) => job.slug === slug);
}

export function openJobs(): CareerJob[] {
  return jobs.filter((job) => job.status === "open");
}

export function comingSoonJobs(): CareerJob[] {
  return jobs.filter((job) => job.status === "coming-soon");
}

export function publicJobs(): CareerJob[] {
  return jobs.filter((job) => job.status === "open" || job.status === "coming-soon");
}

export function shouldShowRoleSearch(jobCount: number): boolean {
  return jobCount >= 3;
}
