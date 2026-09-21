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
  {
    slug: "finding-ghassen-the-co-founder-question-answered-in-three-weeks",
    title: "Finding Ghassen: the co-founder question, answered in three weeks",
    category: "Thoughts",
    description:
      "How a stranger challenged Payle's weakest assumption, became its co-founder and CTO, and turned three weeks of evidence into a partnership.",
    date: "2026-09-21",
    tags: ["founders", "fintech", "building in public", "Payle"],
    keywords: [
      "finding a co-founder",
      "co-founder CTO",
      "fintech startup",
      "building in public",
      "Ghassen Jemai",
      "Payle",
    ],
    content: [
      {
        type: "p",
        text: "Three weeks ago I posted Payle's architecture publicly in a builder community. A complete stranger could read exactly what I was building: the authorization engine, the policy evaluation, the hash-chained ledger, and the idea that AI agents should be able to pay for things under human-defined rules.",
      },
      {
        type: "p",
        text: "I was not looking for a co-founder. I want to be honest about that from the start, because most co-founder stories begin with \"we were looking for someone\" and end with a compromise that everyone regrets. I was looking for something else entirely: stress. I wanted smart people to attack the idea before I fell in love with it. If Payle was going to die, I wanted it to die in a comment section, not after eighteen months and someone's savings.",
      },
      {
        type: "p",
        text: "Most responses were compliments. Compliments are free and worthless.",
      },
      { type: "h2", text: "The message" },
      {
        type: "p",
        text: "Then a message arrived from Ghassen. No compliment in it. Instead, research he had done on his own, completely unprompted. He had found a competitor acquisition I did not even know about, Rye acquired by PayPal, and used it to map where the agentic commerce market was consolidating. Then he asked the hardest question anyone had asked me about Payle up to that point: our BNPL model, exactly as I had framed it, did not work for variable usage-based subscriptions.",
      },
      {
        type: "p",
        text: "You cannot split an unpredictable monthly API bill into three fixed installments and call it a product. The costs move with consumption, so the installments would be fiction. He was right. I remember reading it and feeling two things at the same time. Annoyance, because he was right about the weakest point of my model. Excitement, because he was right about the weakest point of my model, and instead of walking away from the broken thing, he was already talking about how to redesign it.",
      },
      {
        type: "p",
        text: "We redesigned around his objection. The aggregated spend budget, the credit line that covers variable consumption instead of fixed installments on imaginary amounts, is in Payle's architecture today because a stranger asked me a question I could not answer well. It is the same principle behind [the money layer for AI agents](/thoughts/money-layer-for-ai-agents/): controlled delegation has to work in the messy version of reality, not just in a pitch.",
      },
      { type: "h2", text: "The first week" },
      {
        type: "p",
        text: "We talked every day after that. Not \"we will keep in touch\". Actually every single day, about issuing partners, SCA, and how step-up authentication should route through an app approval instead of an OTP that an agent can never complete. We talked about what Klarna can and cannot become in a world where agents do the shopping, and about why [idempotent payments](/notes/idempotent-payments-for-ai-agents/) matter when the buyer is no longer the one pressing retry.",
      },
      {
        type: "p",
        text: "He has the half of this company that I do not have: real fintech depth, regulatory instincts, and an understanding of what card issuing actually requires. He has the patience for the compliance maze that eats fintech startups alive. I have the other half: the product, the architecture, the code, and the bias toward shipping. Complementary is not a personality adjective here. It is a description of the work that gets covered when the two of us sit at the same table.",
      },
      {
        type: "p",
        text: "His background is part of that evidence. Ghassen is completing a Master's Degree in Computer Science at the Università di Firenze, after an Engineering degree at SESAME and a Bachelor's Degree in Computer Science at the University of Tunis El Manar. Alongside that, he built ScopePilot, an AI platform that analyzes client requests for off-contract work and generates change orders with cost estimates. He defined Kavoo, a map-first social platform for discovering nearby experiences, and co-founded Northline Studio, a software agency focused on automation, payment integrations, and modernizing web applications for international clients.",
      },
      {
        type: "p",
        text: "One moment I keep coming back to. I sent him the YC application to review, mostly to get a second pair of eyes on the story. Ten minutes later it was complete. Every field thought through, every answer sharpened, no questions asked that the document itself did not already answer. Ten minutes. That is not eagerness, and it is not flattery. That is someone who had already been running the company in his head before anyone gave him permission to.",
      },
      {
        type: "p",
        text: "And that is the thing about titles: he never asked for one. The people I talked to before him wanted to know about equity first and delivered enthusiasm later. Ghassen wanted to argue about 3DS routing and idempotent payments. The title, **Co-founder and CTO**, became obvious along the way. Nobody negotiated it into existence. It was just what he already was, on paper now too.",
      },
      { type: "h2", text: "How it is going" },
      {
        type: "p",
        text: "Since then, the founder agreement was signed. Four-year vesting with a one-year cliff for both of us, because equal commitment deserves equal protection. Clear decision rights were written down before money and investors were involved: I have the final call on product and company direction, and he has it on technical and compliance architecture. The best time to test a partnership is before the term sheet, not after it, and we chose to test ours early on purpose.",
      },
      {
        type: "p",
        text: "The company moved faster with him in it, which is the only metric that matters for a co-founder decision. The BaaS conversations we are running for issuing and credit, the regulatory map, and the BNPL redesign all sit on his side of the table and move at a speed they did not have before. The objections he raised in week one became features by week three. The YC application we are submitting has two founders with genuinely complementary halves instead of one founder trying to cover everything alone.",
      },
      {
        type: "p",
        text: "We still have not met in person. We will, this month, in Milan. Three weeks of daily calls, shipped decisions, and one signed agreement came first. I think the order matters more than people assume: you learn more about someone from how they handle a disagreement about payment infrastructure than from how they behave across a dinner table. Coffee tells you if you like someone. Architecture tells you if you can build with them.",
      },
      { type: "h2", text: "What I learned" },
      {
        type: "p",
        text: "If I compress three weeks into one lesson, it is this: do not go looking for co-founders. Build in public, and watch who shows up with evidence instead of enthusiasm.",
      },
      {
        type: "p",
        text: "The right person does not arrive with a pitch about themselves. They arrive with a flaw in your work and cannot rest until it is fixed. They complete your application in ten minutes not because they are fast, but because they had already been thinking about your company as if it were theirs. The title is not something you hand out. It is something that becomes impossible to deny.",
      },
      {
        type: "p",
        text: "Three weeks ago Ghassen was a stranger in my comments. Today he is the **Co-founder and CTO of Payle**, and the company is objectively better than the one I was building alone: sharper model, deeper fintech coverage, faster decisions.",
      },
      {
        type: "p",
        text: "Between those two points there was no magic and no luck. There was a public post, a stranger who did his homework, and one question about subscription financing that I could not answer well.",
      },
      {
        type: "p",
        text: "Build in public. Watch who shows up. The rest is selection. You can find Ghassen on [his website](https://beamerboi.github.io/), on [LinkedIn](https://www.linkedin.com/in/ghassen-jemai/), or reach him at [ghassen@usepayle.com](mailto:ghassen@usepayle.com).",
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
