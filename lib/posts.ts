export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; lang: string; code: string };

export interface Post {
  slug: string;
  title: string;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  updated?: string;
  tags: string[];
  keywords: string[];
  content: Block[];
}

function minutesOf(blocks: Block[]): number {
  const words = blocks
    .map((b) =>
      b.type === "list"
        ? b.items.join(" ")
        : b.type === "code"
          ? b.code
          : b.text
    )
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

const raw: Post[] = [
  {
    slug: "money-layer-for-ai-agents",
    title: "The money layer for AI agents",
    category: "Thoughts",
    description:
      "AI agents can research, compare and execute, then they stop at the payment step. Why controlled spending power is the missing infrastructure of the agentic economy.",
    date: "2026-09-20",
    tags: ["AI agents", "payments", "Payle"],
    keywords: [
      "AI agents payments",
      "agentic commerce",
      "AI spending",
      "Payle",
      "Mattia Ciuni",
    ],
    content: [
      {
        type: "p",
        text: "AI agents can already research, compare and execute entire tasks. Then they stop and ask you for a credit card. That handoff, from autonomous work to manual payment, is where most agentic workflows *die*.",
      },
      {
        type: "p",
        text: "I learned this building Celeste, an AI browser. Users completed the hard part of a task and abandoned everything at the payment step. The problem was never the agent's *intelligence*. It was spending power: agents have no wallet, no rules, no receipt. The trust half of that problem has its own note: [the agentic economy is a trust problem](/notes/the-agentic-economy-is-a-trust-problem/).",
      },
      { type: "h2", text: "What agents actually need" },
      {
        type: "list",
        items: [
          "A wallet with rules: per-agent budgets, merchant allowlists, amount caps.",
          "A deterministic authorization engine: every spend decision is explainable and reproducible.",
          "A verifiable receipt for every transaction: who spent, what, why, under which policy.",
        ],
      },
      { type: "h2", text: "Why this is financial infrastructure" },
      {
        type: "p",
        text: "Payments for humans assume a human clicks pay. Agentic commerce inverts that: the click happens inside a loop, at machine speed, across merchants. Card numbers pasted into prompts are not infrastructure; they are liability. The fix is controlled delegation: founders set policy once, agents spend within it, auditors verify after. Retries are the other half of the same problem: without [idempotency](/notes/idempotent-payments-for-ai-agents/) an agent that fails honestly charges the buyer twice.",
      },
      { type: "h2", text: "What we're building with Payle" },
      {
        type: "p",
        text: "Payle gives each AI agent controlled spending power. Define the rules, let the agent operate, keep a receipt for everything. No model in the authorization path, only rules that can be read, replayed and verified: [boring on purpose](/notes/on-boring-systems/). The short version of the rules is [above](#what-agents-actually-need). If you're building in the agentic economy, write to me: I read every email.",
      },
    ],
  },
  {
    slug: "artifact-based-hiring",
    title: "Artifact-based hiring: ship code before titles",
    category: "Thoughts",
    description:
      "Everyone who joins Payle shipped working code before we ever talked about roles. How artifact-first recruiting filters for builders.",
    date: "2026-09-20",
    tags: ["hiring", "building"],
    keywords: ["artifact-based hiring", "startup hiring", "Payle", "Mattia Ciuni"],
    content: [
      {
        type: "p",
        text: "Everyone who joins Payle shipped working code before we ever talked about roles. No exceptions, including me. Resumes describe the past; *artifacts predict the future*.",
      },
      { type: "h2", text: "How it works" },
      {
        type: "list",
        items: [
          "A small, real task from our backlog, not a puzzle, not a take-home theater piece.",
          "Strict acceptance tests: they fail before the fix and pass after.",
          "One review round on the artifact itself. Titles and comp come last.",
        ],
      },
      { type: "h2", text: "Why it works" },
      {
        type: "p",
        text: "It selects for people who finish. You see code quality, communication, and judgment under real constraints, the exact skills the job needs. It also respects candidates: their work is judged, not their pedigree. It is the same rule I use for software, [verification over vibes](/#principles), applied to hiring.",
      },
    ],
  },
];

export const posts: (Post & { readingMinutes: number })[] = raw
  .map((p) => ({ ...p, readingMinutes: minutesOf(p.content) }))
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug);
}
