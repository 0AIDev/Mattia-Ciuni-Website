import { loadCmsCollection, mergeCmsCollection } from "./cms-content";

export type FeedbackBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] };

export interface FeedbackPost {
  slug: string;
  title: string;
  author: string; // come compare a video: il nome se accettato, altrimenti l'iniziale
  github?: string; // profilo dell'autore, quando lo rivendica (stile home: icona + nome)
  description: string;
  date: string; // YYYY-MM-DD
  keywords: string[];
  content: FeedbackBlock[];
}

function minutesOf(blocks: FeedbackBlock[]): number {
  const words = blocks
    .map((b) => (b.type === "list" ? b.items.join(" ") : b.text))
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function feedbackMinutes(post: FeedbackPost): string {
  return `${minutesOf(post.content)} min read`;
}

/**
 * Il numero dello scambio nella serie: `01`, `02`, …
 *
 * L'ordine è **cronologico** (la data, non la posizione in questo file):
 * aggiungere un feedback più vecchio in cima non deve rinumerare quelli già
 * pubblicati, perché il numero che compare in pagina è quello che resta in un
 * link condiviso.
 */
export function feedbackExchange(slug: string): string {
  const ordered = [...feedback].sort(
    (a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug),
  );
  const position = ordered.findIndex((post) => post.slug === slug);
  return String(position + 1).padStart(2, "0");
}

const raw: FeedbackPost[] = [
  {
    slug: "a-stranger-redesigned-my-pitch-in-one-comment",
    title: "A stranger redesigned my pitch in one comment",
    author: "Liam Murphy",
    github: "https://github.com/aka7880-721",
    description:
      "I posted Payle's architecture publicly. An engineer I'd never met corrected my language, found real gaps, and made the product sharper. This is the full exchange.",
    date: "2026-09-21",
    keywords: [
      "Payle feedback",
      "agent payments",
      "authorization",
      "build in public",
      "capabilities not wallets",
    ],
    content: [
      {
        type: "p",
        text: "This is the first post in a series I'm calling Feedback: public exchanges where engineers attacked Payle's architecture, and what their attacks changed. I'm publishing them because the build-in-public promise only means something if you show the corrections, not just the wins.",
      },
      { type: "h2", text: "The message" },
      {
        type: "p",
        text: "An engineer read my public post about Payle and replied with what he thought, with no introductions. At the time he hadn't even shared his name; he has since: he is Liam Murphy ([@aka7880-721](https://github.com/aka7880-721) on GitHub). His reply was this:",
      },
      {
        type: "quote",
        text: "The problem is real, but the payment API itself is only a small part of the problem. The harder problem is authorization and liability.",
      },
      {
        type: "p",
        text: "Then he listed eight requirements: per-agent and per-task spending limits, merchant and category allowlists, approval thresholds, short-lived authorization instead of persistent credentials, idempotency and replay protection, full audit trails from the agent's reasoning to the transaction, automatic handling of refunds and disputes and renewals, and instant revocation of an agent's spending authority.",
      },
      {
        type: "p",
        text: "Read that list slowly. It's not a feature request. It's the specification of an entire trust layer, written by someone who owed me nothing and wanted nothing, except for the thing to be built right.",
      },
      { type: "h2", text: "The correction that changed the pitch" },
      {
        type: "p",
        text: "Then came the sentence I keep re-reading:",
      },
      {
        type: "quote",
        text: "I'd want the agent to have capabilities, not unrestricted access to a wallet. Give it the minimum permission required for a specific task and make that permission expire.",
      },
      {
        type: "p",
        text: "He was correcting my vocabulary, and the vocabulary was hiding a real distinction. A \"controlled wallet\" sounds like the agent possesses money. Capabilities that expire mean the agent possesses nothing: it holds a temporary, minimal permission, and the money never leaves the user's side of the fence.",
      },
      {
        type: "p",
        text: "Here's the uncomfortable part: my architecture already worked this way. One-shot scoped intents. Expiry on every policy. Ephemeral credentials. But my language said \"wallet,\" and language is what merchants, regulators and users actually react to. A product can be safer than its pitch, and that mismatch is a bug: the most expensive kind, because you don't discover it in testing. You discover it when the wrong person reads your homepage.",
      },
      {
        type: "p",
        text: "I changed the pitch the same day. Payle gives agents scoped capabilities that expire, not wallets. Six words, and the pitch got safer than the product instead of scarier than it.",
      },
      { type: "h2", text: "The scorecard: what existed, what didn't" },
      {
        type: "p",
        text: "I answered him point by point, publicly, because a build-in-public claim deserves public verification. The honest scorecard on his eight requirements:",
      },
      {
        type: "list",
        items: [
          "Five were already built and proven: the limits, the allowlists, the thresholds, the idempotency under concurrent races (100 parallel identical requests, exactly one decision), and the hash-chained audit trail.",
          "Two were real gaps he caught: the agent's reasoning context, the why behind the payment, lived in the execution layer's evidence bundle but not in the receipt timeline. The why belongs in the audit, and it's being added.",
          "One needed proof, not presence: we had the kill switch, but \"instant\" revocation is a latency guarantee, and a guarantee without a test is an assumption. The revocation-latency test now exists.",
        ],
      },
      {
        type: "p",
        text: "Two gaps, publicly conceded, publicly scheduled. That's the exchange rate of build-in-public: you get sharp feedback in exchange for admitting what isn't done yet.",
      },
      { type: "h2", text: "The question behind his question" },
      {
        type: "p",
        text: "His deepest point wasn't on the list. It was this: \"can an AI agent pay?\" is solvable. The real question is how you make autonomous payments trustworthy enough that a company lets an agent spend real money, without becoming a new fraud and compliance surface.",
      },
      {
        type: "p",
        text: "My answer is the company's answer: deterministic policy instead of model judgment, capabilities that expire instead of credentials that persist, an audit trail that includes the why, and verification the merchant can run independently. Done right, the security surface for agent payments is smaller than it is for a human with a card, because every move is policy-checked and recorded, and humans don't come with audit trails.",
      },
      { type: "h2", text: "The selection effect" },
      {
        type: "p",
        text: "Liam ended his message with \"I can help you if you want.\" So I asked him where he'd want to own: the policy engine edge cases, the dispute automation, or the revocation-latency guarantees, the three places where a sharp engineer matters most right now.",
      },
      {
        type: "p",
        text: "That's how this company hires, and it's why these posts exist. I don't screen candidates on resumes; I screen them on what they notice. The engineers I want are the ones who read a public architecture and can't sleep until they've told you exactly where it will break.",
      },
      {
        type: "p",
        text: "If that's you: the architecture is still up. Attack it. The next Feedback post might be about your comment.",
      },
    ],
  },
];

const cmsFeedback = loadCmsCollection<FeedbackPost>("feedback");

export const feedback: FeedbackPost[] = mergeCmsCollection(raw, cmsFeedback)
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export function getFeedback(slug: string): FeedbackPost | undefined {
  return feedback.find((f) => f.slug === slug);
}
