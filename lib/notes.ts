export type NoteBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string };

export interface Note {
  slug: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  keywords: string[];
  content: NoteBlock[];
}

const raw: Note[] = [
  {
    slug: "idempotent-payments-for-ai-agents",
    title: "Why AI agents need idempotent payments",
    description:
      "An agent that does not retry loses money, but retries are exactly what breaks naive payment flows. Why the idempotency key is the memory of an agent's intentions.",
    date: "2026-09-12",
    keywords: [
      "idempotent payments",
      "idempotency key",
      "AI agents payments",
      "deterministic payments",
      "Payle",
    ],
    content: [
      {
        type: "p",
        text: "An agent that does not retry loses money. A network timeout or a half-open connection means the agent has no idea whether the payment went through, so the safe move is to try again. But retrying is precisely what breaks naive payment flows: the same request reaches the bank twice and the buyer is charged twice.",
      },
      {
        type: "p",
        text: "Idempotency is the discipline that makes one logical action safe to repeat. The client attaches a key: a string that means, *this is the same intention as before*. Every retry carries the same key; the server answers with the original result instead of charging again. Boring, undramatic, and absolutely required as soon as a machine, not a human, is the one pressing the button.",
      },
      {
        type: "h2",
        text: "Retry with memory is resilience",
      },
      {
        type: "p",
        text: "There is something philosophical here. A human's card decline is a question: it interrupts the act and asks for reflection. An agent cannot reflect in the moment; it can only try again. So we give the system a memory: the idempotency key is the memory that the request was already made, already handled, already answered. Retry with memory is resilience. Retry without memory is fraud.",
      },
      {
        type: "p",
        text: "At Payle every spend call carries an idempotency key, and the authorization engine answers the same key with the same result. Agents become free to fail honestly, and fail on purpose. It is one of the things [the money layer for AI agents](/thoughts/money-layer-for-ai-agents/) has to get right, together with [wallets with rules](/notes/the-agentic-economy-is-a-trust-problem/).",
      },
    ],
  },
  {
    slug: "the-agentic-economy-is-a-trust-problem",
    title: "The agentic economy is a trust problem, not a technology problem",
    description:
      "Agents can already research, compare and execute. The hard part is deciding what they may do with money, and proving what they did. A case for wallets with rules.",
    date: "2026-09-01",
    keywords: [
      "agentic economy",
      "AI agents trust",
      "AI spending rules",
      "wallets with rules",
      "verifiable receipts",
    ],
    content: [
      {
        type: "p",
        text: "Machines execute exactly what we tell them; the trouble is we rarely know, in advance, what to tell them. Delegate a shopping task and the agent will make a hundred small decisions no human reviewed. The question stops being *can it do the thing* and becomes *do we let it, and how do we know what it did*.",
      },
      {
        type: "p",
        text: "Trust, for humans, is a feeling built over time. Trust, for machines, can only be structure built in advance: budgets, merchant allowlists, amount caps, an authorization engine that answers the same way every time. Delegation without structure is not trust; it is a blank check.",
      },
      {
        type: "h2",
        text: "Autonomy for the machine, accountability for the human",
      },
      {
        type: "p",
        text: "The receipt is the quiet half of the deal. An agent that spends must leave an audit trail a human can read later: who spent, what, why, under which policy. Autonomy for the machine, accountability for the human. That pair is what turns *the agent did the thing* into *the agent did the thing correctly*.",
      },
      {
        type: "p",
        text: "This is why I think the agentic economy will be won by whoever builds the trust layer first, not by whoever ships the most convincing agent. Technology amplifies; trust permits. Without permission, even perfect technology stays idle. The concrete version of this is [the money layer for AI agents](/thoughts/money-layer-for-ai-agents/), and the discipline behind it is [on boring systems](/notes/on-boring-systems/).",
      },
    ],
  },
  {
    slug: "on-boring-systems",
    title: "On boring systems",
    description:
      "The most advanced thing you can build around an AI is often a system that is boring on purpose. A note on determinism, monotonicity and the craft of unremarkable software.",
    date: "2026-08-20",
    keywords: [
      "boring systems",
      "deterministic systems",
      "software craft",
      "reliable infrastructure",
      "Payle principles",
    ],
    content: [
      {
        type: "p",
        text: "There is software that is expensive because it is exciting, and software that is expensive because it is right. The second kind never makes the demo reel. It just keeps a promise, at 3 a.m., for the thousandth time, without anyone noticing.",
      },
      {
        type: "p",
        text: "I build money software, so I am biased toward the unremarkable. The money path is one place the machine must not improvise: no model in the authorization path, no probabilistic decision at the moment of truth, only rules that can be read, replayed and verified. Novelty is a feature in the product; in the money path it is a liability.",
      },
      {
        type: "h2",
        text: "Change that only makes things better",
      },
      {
        type: "p",
        text: "Monotonicity is the discipline I keep returning to: change that only makes things better, never differently. Better latency, better errors, better receipts. If you cannot replay a week of transactions and observe exactly the same decisions, you do not have a system; you have a performance. Retries are the classic test: [idempotency](/notes/idempotent-payments-for-ai-agents/) is what makes a repeat safe instead of a duplicate.",
      },
      {
        type: "p",
        text: "Boring is not the absence of ambition. It is ambition that learned where the risk is, and moved it somewhere safe.",
      },
    ],
  },
];

export const notes: Note[] = raw
  .slice()
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export function getNote(slug: string) {
  return notes.find((n) => n.slug === slug);
}