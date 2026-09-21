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
    slug: "what-a-security-audit-taught-me",
    title: "What a security audit taught me that no bootcamp will",
    description:
      "I paid strangers to attack my payments engine. The race conditions, the ledger that lied to itself, and the deletion that would have erased every customer.",
    date: "2026-10-12",
    keywords: [
      "security audit",
      "payments security",
      "fintech engineering",
      "race conditions",
      "Payle",
    ],
    content: [
      {
        type: "h2",
        text: "I shipped it, and then I paid strangers to attack it",
      },
      {
        type: "p",
        text: "Eight weeks into building Payle, I did something most pre-seed founders don't do: I hired someone to find everything wrong with my code.",
      },
      {
        type: "p",
        text: "Not a code review from a friend. Not a \"looks good to me\" from a cofounder. A full external audit of the money path: the authorization engine, the ledger, every place where a euro could move without a human understanding why.",
      },
      {
        type: "p",
        text: "I want to tell you what it found, because the list humbled me, taught me more than any tutorial ever has, and contains lessons that no bootcamp in the world includes in its curriculum.",
      },
      {
        type: "h2",
        text: "Finding one: the race that could double-charge",
      },
      {
        type: "p",
        text: "My authorization endpoint checked the budget, then wrote the decision, then recorded the idempotency key. Three steps. Linear. Obvious.",
      },
      {
        type: "p",
        text: "Except that HTTP doesn't care about my sense of order. Two identical requests arriving at the same millisecond, and agents retry aggressively because that is their nature, could both pass the check, both write a decision, and both authorize a payment. Double charge. Same user. Same second.",
      },
      {
        type: "p",
        text: "The fix sounds boring and is beautiful: the idempotency claim and the decision must live in the same database transaction. Insert the key first. If another request got there first, return its stored response. If not, this request owns the key and the decision. One transaction. One truth.",
      },
      {
        type: "p",
        text: "In payments, correctness isn't about what your code does. It is about what your code does when two copies of it run at the same time.",
      },
      {
        type: "p",
        text: "Concurrency is where junior code and production code diverge.",
      },
      {
        type: "h2",
        text: "Finding two: the ledger that lied to itself",
      },
      {
        type: "p",
        text: "I was proud of my hash-chained ledger. Every entry linked to the previous one with sha256. Tamper-evident, like a blockchain, but honest about being a database.",
      },
      {
        type: "p",
        text: "The audit found two holes in it. First: I read the previous hash outside the transaction that appended the new entry, meaning two concurrent writes could fork the chain. Second: one lifecycle path wrote a literal string as a hash instead of computing one. My own verification tool, pointed at my own healthy system, would have cried \"TAMPERED.\"",
      },
      {
        type: "p",
        text: "Both fixed. Both now covered by tests that fail if anyone ever regresses them.",
      },
      {
        type: "p",
        text: "A security property you haven't tested is a decoration, not a property.",
      },
      {
        type: "p",
        text: "\"The ledger is immutable\" is a sentence. \"This test proves the chain verifies after 10,000 mixed-lifecycle operations\" is a fact.",
      },
      {
        type: "h2",
        text: "Finding three: the deletion that would have erased everyone",
      },
      {
        type: "p",
        text: "This one still keeps me up at night, a little.",
      },
      {
        type: "p",
        text: "My account-deletion endpoint deleted ledger entries. With no WHERE clause. Meaning: one user tapping \"delete my account\" would have wiped the audit trail of every customer in the system. The audit called it what it was: a global data destruction bug hiding behind a routine feature.",
      },
      {
        type: "p",
        text: "The fix: the ledger is never deleted, ever. Account deletion pseudonymizes the user's identity while preserving the financial chain. Roles at the database level now enforce what the application used to promise.",
      },
      {
        type: "p",
        text: "Destructive operations need to be scoped at the database level, not by application discipline.",
      },
      {
        type: "p",
        text: "Application code changes. Privileges don't, unless you make them.",
      },
      {
        type: "h2",
        text: "Finding four: fail-safe vs fail-open",
      },
      {
        type: "p",
        text: "When the risk service is down, what should the payment system do? Block everything, or approve everything?",
      },
      {
        type: "p",
        text: "I had built neither, because I hadn't built the risk service yet, so the question was theoretical. The audit forced it to become practical: it wired the fail-safe path, made \"risk service unreachable\" a first-class state, and added the rule I now consider sacred: when uncertain, a human approves. Machines don't guess with money.",
      },
      {
        type: "h2",
        text: "The full list was longer",
      },
      {
        type: "p",
        text: "Missing rate limiting. PII in logs. A config that boots happy when malformed and dies on first request. An ID verification flow that a 2023-era attacker would laugh at. Each finding was a conversation between me and my own assumptions.",
      },
      {
        type: "p",
        text: "And the reason I'm writing this isn't humility. It's arithmetic: every one of these bugs, found after launch, costs ten times more, in money, in trust, in YC interviews where a partner asks \"how do you know your ledger doesn't fork?\" and you don't have an answer with a test in it.",
      },
      {
        type: "h2",
        text: "What I'd tell every builder now",
      },
      {
        type: "p",
        text: "If you're building anything that touches money, do this before your next feature:\n1. Get someone whose job is breaking your assumptions.\n2. Fix what they find with tests that fail before the fix.\n3. Keep those tests in CI forever, so the lesson can't be unlearned.",
      },
      {
        type: "p",
        text: "The audit didn't just find bugs. It taught me the difference between code that works and code that deserves to hold someone's money. That difference is the entire fintech industry, compressed.",
      },
      {
        type: "p",
        text: "No bootcamp covers it. You get it by paying strangers to attack the thing you love.",
      },
      {
        type: "p",
        text: "Worth every cent.",
      },
    ],
  },
  {
    slug: "the-moment-my-ai-agent-asked-for-my-credit-card",
    title: "The moment my AI agent asked for my credit card",
    description:
      "The scene that started Payle: an AI agent did 90% of the work, then stopped at a credit card form. On the wall between acting and paying.",
    date: "2026-10-05",
    keywords: [
      "AI agents payments",
      "agentic commerce",
      "Payle origin story",
      "money layer for AI agents",
      "founder story",
    ],
    content: [
      {
        type: "p",
        text: "I remember the exact moment I understood the problem I would spend the next years of my life on.",
      },
      {
        type: "h2",
        text: "The future was on my screen",
      },
      {
        type: "p",
        text: "I was building Celeste, an AI browser. It was good. The agent could open pages, follow instructions, do research, complete workflows. I gave it a task: find me this, compare these, set up that. And it worked through it like something alive. I sat there watching it think, and for the first time I felt like the future wasn't a video from a keynote. It was on my screen.",
      },
      {
        type: "p",
        text: "Then it stopped.",
      },
      {
        type: "p",
        text: "Not crashed. Not confused. It had done 90% of the job: found the option, compared the prices, made the decision. And then it turned around and asked me, in the politest possible way, for my credit card.",
      },
      {
        type: "p",
        text: "Please enter your payment details.",
      },
      {
        type: "h2",
        text: "Sixteen little boxes",
      },
      {
        type: "p",
        text: "I sat there staring at that field. Sixteen little boxes. And I realized I was watching something absurd happen in real time: the most capable software I had ever used, stopped by the same barrier my father faced buying a train ticket in 1995. A human has to hand over a card. A human has to type numbers. A human has to prove, again and again, that he exists and is allowed to spend his own money.",
      },
      {
        type: "p",
        text: "The agent did the thinking. The agent did the work. And then it needed me, not for judgment, not for taste, not for any decision that actually mattered. It needed me for the typing.",
      },
      {
        type: "h2",
        text: "The wall was never the browser",
      },
      {
        type: "p",
        text: "I tried to fix it inside the browser. I really did. Autofill, integrations, little workarounds. But the problem wasn't the browser. The problem was that the entire financial system was built for one specific creature: a human with a hand, a wallet, and a phone to receive an OTP on. Every payment flow on earth assumes that creature exists. And my agent wasn't one.",
      },
      {
        type: "p",
        text: "That's when it clicked, in the way where you can't unsee it: we gave machines eyes, ears, memory, reasoning. We gave them the ability to work, to create, to decide. And then we drew a line at the one thing every working thing in history has needed: the ability to be paid for what it does, and to pay for what it needs.",
      },
      {
        type: "p",
        text: "An intern can spend the company's money within limits. A contractor can. An API can. A piece of software with more judgment than all of them cannot, unless a human types sixteen digits first.",
      },
      {
        type: "h2",
        text: "Building the answer",
      },
      {
        type: "p",
        text: "So I stopped building the browser and started building [Payle](https://usepayle.com). Not because the browser failed, because it succeeded so well that the payment step became the only wall left standing.",
      },
      {
        type: "p",
        text: "Now every day I work on the same question, from the other side: what should it mean for a machine to spend money? Not a card handed over blindly. Not a human becoming the typing assistant of his own software. Something in between: rules, limits, a tap when it matters, a receipt you can verify, and an agent that finishes what it started. That is the whole idea behind [the money layer for AI agents](/thoughts/money-layer-for-ai-agents/), and it is why [trust, not technology, is the real problem](/notes/the-agentic-economy-is-a-trust-problem/) to solve first.",
      },
      {
        type: "p",
        text: "I don't think most people have noticed this wall yet, because most people haven't watched an agent work end to end. But they will. Everyone will, soon. And when they do, they'll hit the same sixteen boxes I did.",
      },
      {
        type: "p",
        text: "That moment asked me a question I'm still answering every day: if machines are going to act for us, who teaches them to spend?",
      },
      {
        type: "p",
        text: "I'm building the answer.",
      },
    ],
  },
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
  {
    slug: "what-interviews-teach-me-about-people-and-my-own-company",
    title: "What interviews teach me about people (and my own company)",
    description:
      "What written technical work reveals that a conversation can hide, and why every interview has become an audit of my own company.",
    date: "2026-09-21",
    keywords: [
      "technical interviews",
      "engineering hiring",
      "written assessment",
      "artifact-based hiring",
      "Payle",
    ],
    content: [
      {
        type: "p",
        text: "I've been running interviews differently this month. Not the usual \"tell me about yourself and your five-year plan.\" Every candidate gets a real technical task first, then a structured questionnaire with questions born from my own audit: how they'd fix an [idempotency race](/notes/idempotent-payments-for-ai-agents/), how they'd handle two concurrent payments against the same budget, what they validate at boot.",
      },
      {
        type: "p",
        text: "The questionnaire is written, not verbal. And that choice taught me more than I expected.",
      },
      {
        type: "p",
        text: "Same person, two formats: in a call, one candidate gave me shallow answers. In writing, with time to think, the same candidate handed me a floating-point analysis of 10.10 × 100, caught a race condition I had hidden in my own question, and mapped every possible shape of a double-charge incident before touching anything. The call undersold him. The text proved him.",
      },
      {
        type: "p",
        text: "That's now a principle in how I hire: measure people in the format where they think best. Voice-strong and write-strong are both valid engineers, but you'll only see it if you ask both ways.",
      },
      {
        type: "p",
        text: "The other thing interviews give me, which nobody talks about: my own questions get sharper with every candidate. Each answer shows me a gap in how I explain our architecture, or a new edge case I hadn't considered. I've redesigned parts of our onboarding and our docs from things candidates asked. The interview is not a filter. It's a mirror.",
      },
      {
        type: "p",
        text: "So yes, I'll keep interviewing. For the team, for the practice, for the mirror. If you're an engineer who does your best thinking in writing, my inbox is open. The first step is always the same: ship something real, then we talk.",
      },
    ],
  },
  {
    slug: "honestly-im-excited",
    title: "Honestly? I'm excited.",
    description:
      "Why every hard question about Payle has made me believe more in the problem, the solution and the timing.",
    date: "2026-09-21",
    keywords: [
      "founder excitement",
      "building in public",
      "AI agents payments",
      "Payle",
      "startup building",
    ],
    content: [
      {
        type: "p",
        text: "I've built things before. Small projects, experiments, the browser. But this is the first time I'm building something where every single week makes me believe more, not less. Let me explain, because it surprised me too.",
      },
      {
        type: "p",
        text: "A few weeks ago I posted Payle's architecture publicly and asked strangers to attack it. They did. Fintech engineers I'd never met tore into the BNPL model, questioned the delegation model, found the exact spot where my design was weakest. And instead of discouraging me, every objection made the product sharper. The best parts of Payle's architecture today exist because strangers took the time to argue with me.",
      },
      {
        type: "p",
        text: "That did something to me I didn't expect. When people who owe you nothing take your idea seriously enough to challenge it, it stops being \"your idea\" and starts being something real. Something worth defending with code, not words.",
      },
      {
        type: "p",
        text: "So now, every day, I believe more. In the problem: agents can do everything except pay, and that's genuinely broken. In the solution: controlled wallets, deterministic authorization, verifiable receipts. In the timing: every big player is announcing agentic commerce while the control layer is still unowned. The concrete version is [the money layer for AI agents](/thoughts/money-layer-for-ai-agents/).",
      },
      {
        type: "p",
        text: "I know excitement is cheap in this industry. Everyone is excited at the start. What I'm chasing is the version of excitement that survives the boring weeks, the failed deploys, the compliance emails. So far, three months in, it's not surviving. It's growing.",
      },
      {
        type: "p",
        text: "Building in public, as always. More soon.",
      },
    ],
  },
  {
    slug: "about-the-name",
    title: "About the name",
    description:
      "How Payle stopped feeling like a rough draft and became the name of the company we are building.",
    date: "2026-09-21",
    keywords: [
      "Payle",
      "startup naming",
      "founder story",
      "building a company",
      "company identity",
    ],
    content: [
      {
        type: "p",
        text: "Confession: when I first said \"Payle\" out loud, I didn't like it.",
      },
      {
        type: "p",
        text: "It felt awkward. Not fintech enough, not serious enough, not... anything enough. I kept comparing it to names like Stripe and Mercury, names that arrived perfect, like they'd been carved by a branding agency before the product even existed. Mine felt like a rough draft that had accidentally become real.",
      },
      {
        type: "p",
        text: "So I kept building. And something strange happened.",
      },
      {
        type: "p",
        text: "Somewhere between the first test passing and the first stranger using the name correctly in a sentence, \"are you the Payle guy?\" the name started to fit. Not because it changed. Because the thing behind it grew into it. Now when I say Payle, I don't hear an awkward draft. I hear the engine approving a payment. I hear the ledger. I hear the approval tap. I hear the company my co-founder and I just signed our names to.",
      },
      {
        type: "p",
        text: "There's a lesson in there I didn't expect: names don't make products. Products make names. Stripe probably sounded weird on day one too. Every name that now sounds inevitable once sounded strange to the person who chose it, right before the work gave it weight.",
      },
      {
        type: "p",
        text: "Today Payle is on my company documents, my app, my email address, and in the last message of every day when I close the laptop. It's no longer a name I picked. It's a name I earned the right to like.",
      },
      {
        type: "p",
        text: "And honestly? I love it now.",
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