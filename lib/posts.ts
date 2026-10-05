import { loadCmsCollection, mergeCmsCollection } from "./cms-content";
import { isPublished } from "./publication";

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; lang: string; code: string }
  | { type: "audio"; src: string; title: string };

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
          : b.type === "audio"
            ? b.title
            : b.text,
    )
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

const raw: Post[] = [
  {
    slug: "why-ai-agents-need-permission-systems",
    title: "Why AI agents need permission systems",
    category: "Thoughts",
    description:
      "AI agent permissions are not a settings screen. The three ways people handle agent spending today, why each one fails, and what has to exist instead.",
    date: "2026-10-05",
    tags: ["authorization", "AI agents", "payments", "Noesia"],
    keywords: [
      "AI agent permissions",
      "AI agent authorization",
      "agentic commerce",
      "Noesia",
      "Mattia Ciuni",
    ],
    content: [
      {
        type: "p",
        text: "Someone read Noesia's architecture and asked me the only question that mattered: *what stops the agent from buying something stupid?* I had an answer for the happy path and nothing for that one. It took me a week to find the honest version, and the honest version is not a settings screen.",
      },
      {
        type: "p",
        text: "Here is what I found. AI agent permissions are usually described as a limit: a maximum amount, a merchant allowlist, a monthly ceiling. Limits are necessary and they are not a permission system. A limit tells the agent where the wall is. It does not tell anyone who allowed the action, under which rule, or what happens when the rule turns out to be wrong.",
      },
      { type: "h2", text: "Three ways people handle agent spending today" },
      {
        type: "list",
        items: [
          "**The shared card.** The agent uses a company card with no boundary. Finance finds out from the statement, and nobody can reconstruct why the purchase happened.",
          "**The confirmation button.** The agent proposes, a human approves every single time. It is safe, and it turns the agent into an assistant that sends you invoices.",
          "**Declared autonomy.** The product executes and puts the outcome on the user. It is the most common position in this category, and it is the easiest one to write down.",
        ],
      },
      {
        type: "p",
        text: "None of the three is stupid. The first two are what people actually do today, and the third is a legitimate position I disagree with. What all three share is a missing record: in all three, the question *who authorised this, and under which boundary* has no answer that survives an argument.",
      },
      { type: "h2", text: "What a permission system actually is" },
      {
        type: "p",
        text: "A permission system has four parts, and a limit is only one of them.",
      },
      {
        type: "list",
        items: [
          "**A mandate.** The outcome you asked for, in your own words, written before the agent starts. Not an interface guessing what you will allow.",
          "**A perimeter.** Amount, period, payees, categories. What the mandate does not cover, the agent cannot do, even when doing it would be a good idea.",
          "**A decision.** Deterministic, explainable, replayable. The same input produces the same answer, and a human who was not in the room can read it.",
          "**A record.** Who acted, for which task, under which rule, with what evidence.",
        ],
      },
      {
        type: "p",
        text: "In Noesia's authorization engine the decision path has no model in it. It is a policy engine written in Go, and the ledger it appends to is hash-chained. That is not a detail about our stack. It is the only thing that makes the fourth part worth anything: a record nobody can quietly edit is the difference between an audit and a story.",
      },
      {
        type: "p",
        text: "The property I care about most is boring to write down and hard to get right: idempotency under concurrent retries. The authorization core is tested with 100 parallel identical requests, and exactly one decision comes out. That test exists because an agent that retries is normal, and an agent that charges twice because it retried is a bug with a bank account attached. I wrote about [the idempotent version of this problem](/notes/idempotent-payments-for-ai-agents/) before the buyer was an agent.",
      },
      {
        type: "h2",
        text: "The difference between an instruction and a permission",
      },
      {
        type: "p",
        text: "An instruction describes intent. A permission describes authority. The distinction looks academic until you put an agent in front of a web page, because an agent that reads can be told things. If the authority to spend came from the conversation, then whoever can write into the conversation can spend. That is not a hypothetical attack, it is the normal way the web works.",
      },
      {
        type: "p",
        text: "A mandate written before the conversation changes what a prompt injection can do. The injected text can still change what the agent tries. It cannot change what the agent is allowed to do, because the authority was never in the conversation. This is why I think the mandate has to be a document you sign rather than a form you fill in the moment the agent asks.",
      },
      { type: "h2", text: "The part we do not have yet" },
      {
        type: "p",
        text: "I would rather write this than have it found later. Agent identity and liability is the row of our own capability table marked as not answered. If an agent buys the wrong thing while doing exactly what it was told, who answers? Every platform in this category states a position. We do not have the final one, and it is not a paragraph to write: it is a product and a legal decision that has to survive a real dispute.",
      },
      {
        type: "p",
        text: "What we do have is the piece that makes the question answerable later: a stop. Pausing an agent and cancelling its pending requests from your device is designed and not shipped. The closest thing verified today lives in the prototype: an order came back at 163.00 euro as a request to confirm, and it left at 137.00. One number from a prototype run is worth more than the adjective I would otherwise have used in this paragraph, and it is why the prototype is labelled as one on every page that shows it.",
      },
      {
        type: "h2",
        text: "What I would tell someone shipping an agent this month",
      },
      {
        type: "list",
        items: [
          "Write the boundary before the agent runs, not after it fails. A boundary added later has no record of what already happened.",
          "Key the retry on the intent, not on the request. Two identical requests are one intention, and one charge.",
          "Make the decision readable by someone who was not there. If explaining a spend needs the conversation that produced it, you do not have an audit trail.",
          "Decide what happens when the agent is wrong before you decide how fast it can buy. The second number is easier to change.",
        ],
      },
      {
        type: "p",
        text: "The reason I keep coming back to permissions is that they are the only part of this that has to be decided before the money moves. Everything else can be added later. An authorization layer cannot be retrofitted onto a system that already spends, because by then the evidence of what it did is gone.",
      },
      {
        type: "p",
        text: "Agents do not need a bigger allowance. They need a boundary that can be read out loud, and a receipt that survives being questioned. I have been building this problem into [Noesia](https://withnoesia.com), the authorization layer for agents, and the [money layer argument](/thoughts/money-layer-for-ai-agents/) is where it started. If you are building an agent that spends, I would rather hear where this breaks than where it works.",
      },
    ],
  },
  {
    slug: "why-ai-agents-keep-stopping-at-checkout",
    title: "Why AI agents keep stopping at checkout",
    category: "Thoughts",
    description:
      "AI agents research, compare and decide, then they hand you a cart. The checkout step is where delegation breaks, and it is not a payments problem.",
    date: "2026-10-05",
    tags: ["AI agents", "payments", "checkout", "Noesia"],
    keywords: [
      "AI agents checkout",
      "AI agent payments",
      "agentic commerce",
      "Noesia",
      "Mattia Ciuni",
    ],
    content: [
      {
        type: "p",
        text: "An agent can research a product, compare twelve offers, read the reviews, decide, and put the right thing in a cart. Then it stops and asks you for a card. Every AI agents checkout flow ends in the same place: a human, in the middle of an automated process, doing the one step nobody automated.",
      },
      {
        type: "p",
        text: "I watched this happen hundreds of times. Not in a dashboard: on a screen, next to people who had just told me the thing worked.",
      },
      {
        type: "h2",
        text: "The day I understood it was not an intelligence problem",
      },
      {
        type: "p",
        text: "I was building Celeste, an AI browser. It was good: the agent could open pages, follow instructions, compare options, complete research. Then it reached the payment step, and the task ended. Not because the agent got the answer wrong. Because the last screen assumed a person.",
      },
      {
        type: "p",
        text: "That was the useful finding. The abandonment was not a failure of comprehension, it was a handoff. The agent had done the hard part and could not cross the last metre, and every workflow that ended there had been *technically* completed and *practically* abandoned. I wrote the first version of this argument in [the money layer for AI agents](/thoughts/money-layer-for-ai-agents/), and this piece is the part of it that is about checkout specifically.",
      },
      {
        type: "h2",
        text: "Three gaps, and only one of them is a payments problem",
      },
      {
        type: "list",
        items: [
          "**Identity.** Checkout is built for a person with a card: a name, an address, a device, a session. An agent has none of those in a form the page accepts, so it borrows a human's credentials and inherits all of that human's authority.",
          "**State.** A checkout is a small state machine with a step that is genuinely unknown for a while: the payment is authorised, or pending, or declined, and the page has to be asked again. Agents retry. Retrying something that was pending is how you get two orders.",
          "**Authority.** Whoever holds the card holds the authority. So you cannot give the card to the agent, which means the human comes back at the exact moment the automation was supposed to remove them.",
        ],
      },
      {
        type: "p",
        text: "The first two are engineering. The third is the reason adding a checkout API to your product does not fix the problem: it moves the handoff one layer down, and the layer below is still a card.",
      },
      { type: "h2", text: "The difference between a timeout and a decline" },
      {
        type: "p",
        text: "This is the detail I did not appreciate until I was inside it. A decline is an answer. A timeout is not an answer: it is the absence of one, and the difference matters more when the client is software that will retry.",
      },
      {
        type: "p",
        text: "An agent that treats a timeout as a failure retries. An agent that retries a payment whose state is unknown creates a duplicate, and duplicates are not a performance problem, they are a money problem. This is the same class of bug as [idempotency for autonomous agents](/notes/idempotent-payments-for-ai-agents/), with a worse blast radius because nobody is watching the second charge happen.",
      },
      {
        type: "p",
        text: "The answer in our engine is that the retry is keyed on the intention rather than the request. Same intention, same decision, one charge, and the second request returns the first decision instead of making a new one. It is tested with 100 parallel identical requests, and exactly one decision comes out. Boring, and the only version of this I would let near a real card.",
      },
      { type: "h2", text: "The merchant is looking at the wrong thing" },
      {
        type: "p",
        text: "There is a second checkout, and only one of the two parties has been thinking about it. The merchant's checkout is built to answer one question: is this a fraudster or a customer? The signals it uses are all human signals. A device fingerprint, a shipping address that has history, a typing rhythm, a browsing session that took four minutes instead of four milliseconds.",
      },
      {
        type: "p",
        text: "An agent fails all of those checks while being completely legitimate. So the merchant sees something that looks like fraud and is actually a customer who automated the boring part, and the honest options on the table are all bad: decline a real sale, or loosen the check that protects everyone else. A merchant verification layer is in build on our side for exactly this reason, and I would rather describe it as in build than imply it is answering questions it has not been asked yet.",
      },
      { type: "h2", text: "What has to exist instead" },
      {
        type: "list",
        items: [
          "**A mandate with a perimeter.** Amount, period, payees, categories, written before the agent starts.",
          "**A deterministic decision.** No model in the authorization path. The same input gives the same answer, every time, on any machine.",
          "**An idempotent execution.** The retry is part of the design, not an edge case handled by luck.",
          "**A receipt with the reasoning.** What was bought, under which rule, and why the decision came out that way.",
        ],
      },
      {
        type: "p",
        text: "I have been building this into [Noesia](https://withnoesia.com): scoped capabilities that expire instead of a wallet an agent holds, and an append-only ledger behind every decision. The audit that covers the authorization core is commissioned and its findings are fixed with regression tests in the suite, which is why the phrase about being safe with money is not one I use loosely here.",
      },
      { type: "h2", text: "What is still open" },
      {
        type: "p",
        text: "Revocation, honestly. Pausing an agent and cancelling the requests it already has in flight is designed, not shipped, and the hard part is not the button, it is what happens between the pause and the last decision already taken. Dispute handling is the same shape of problem and it is in the same state.",
      },
      {
        type: "p",
        text: "The other open thing is a number I refuse to publish: how long a revocation takes to reach an agent mid-flight. I have a target. A target is not a measurement, and the difference is exactly the thing this site is supposed to be careful about.",
      },
      {
        type: "p",
        text: "The end of a workflow is the whole workflow. An agent that stops one step before the outcome did not save you the task, it moved the task to you and added a conversation. Checkout is not the last screen of the product. It is the first place where the product has to answer for what it did.",
      },
    ],
  },
  {
    slug: "welcoming-raj-koli-founding-engineer-agent-experience",
    title:
      "Welcoming Raj Koli, Founding Engineer (Agent Experience): the interview",
    category: "Thoughts",
    description:
      "Raj Koli, 21, from India, is Noesia's Founding Engineer on the Agent Experience: the interview on agent evaluation, typed errors, and the pending state most demos skip.",
    date: "2026-10-01",
    tags: ["founders", "hiring", "engineering", "building in public", "Noesia"],
    keywords: [
      "Raj Koli",
      "founding engineer",
      "Noesia team",
      "agent evaluation",
      "TypeScript SDK",
      "AI agent payments",
      "Mattia Ciuni",
    ],
    content: [
      {
        type: "p",
        text: "**Founding Team series.** This is the second post in the series: introducing the people building Noesia, in their own words, with the honesty we use everywhere else on this site.",
      },
      {
        type: "p",
        text: "First up was [Alex Mwaniki, Founding Engineer on the core](/thoughts/welcoming-alex-mwaniki-founding-engineer-core/). Today: **Raj Koli**, Founding Engineer on the Agent Experience: the TypeScript SDK, the demo agent, and everything that makes the Noesia agent usable by developers and visible to the world.",
      },
      {
        type: "p",
        text: "Raj is 21, from India, and a full-time university student who committed to Noesia full-time anyway. Here is our conversation, edited for length but not for honesty.",
      },
      {
        type: "p",
        text: "**Describe in one sentence what you think about Noesia.**",
      },
      {
        type: "audio",
        src: "/thoughts/welcoming-raj-koli-founding-engineer-agent-experience/raj-audio.mp3",
        title: "Raj Koli: one sentence about Noesia",
      },
      { type: "h2", text: "A builder who was already watching agents fail" },
      {
        type: "p",
        text: "**Mattia: Take me back to the day you first saw Noesia. What made you reach out instead of just scrolling?**",
      },
      {
        type: "quote",
        text: "Honestly, what got me was the framing: agents that can actually do things instead of just generating answers. I had already been interested in agent evaluation and tool use, so when I saw your post, it felt like someone was building exactly the kind of thing I wanted to work on. I messaged you the same day because I wanted to learn more about it.",
      },
      {
        type: "p",
        text: '**Mattia: Your CV mentions Terminal-Bench and agent evaluation at Handshake AI. Where did that instinct come from, what made you think "I know how agents fail, and I want to build for them"?**',
      },
      {
        type: "quote",
        text: "Working on agent evaluation made me realize that agents can look very good in a simple demo but still fail badly on real tasks. I started becoming interested in what happens when an agent has to deal with tools, unexpected outputs, timeouts, wrong decisions, or incomplete information. That made me want to move from only evaluating agents to actually building the systems around them and making them more reliable.",
      },
      {
        type: "p",
        text: "This is the paragraph I read three times before offering him the role. \"Agents can look very good in a simple demo but still fail badly on real tasks\" is a sentence that only someone who has evaluated hundreds of agent runs would write. Most people building agents haven't watched them fail enough times to know where the failure lives: in the tools, the retries, the state management, not in the model. Raj has. It's why he's building the SDK. The same failure class lives on the money side too, where [idempotency](/notes/idempotent-payments-for-ai-agents/) decides whether an honest retry charges twice.",
      },
      { type: "h2", text: "The failure mode nobody talks about" },
      {
        type: "p",
        text: "**Mattia: What did evaluating agents at Handshake teach you about how they actually fail, not in theory, in practice?**",
      },
      {
        type: "quote",
        text: "One thing I learned is that agents often fail because of small mistakes in the middle of a task, not because they completely misunderstand the task. For example, an agent can make a wrong tool call, misunderstand the tool output, or get stuck after an error instead of recovering. I also saw cases where infrastructure issues like timeouts affected the result. That taught me that building a good agent is not only about the model. The tools, retries, state, and error handling matter a lot too.",
      },
      {
        type: "p",
        text: "This is the insight that shaped our SDK design. The demo agent doesn't fail because the model is dumb. It fails because a tool returned malformed output, a timeout broke the flow, or a retry created a duplicate. Those are the failures Raj has watched hundreds of times from the evaluation side, and they're the ones he's building the SDK to prevent.",
      },
      { type: "h2", text: "The schedule conversation" },
      {
        type: "p",
        text: "**Mattia: You're a full-time student and a full-time startup engineer. Be honest, what does a real week look like?**",
      },
      {
        type: "quote",
        text: "I build my week around university's fixed deadlines, but Noesia is a full-time commitment for me, around 40 hours a week. The hard part isn't really the hours themselves, it's making sure a university deadline doesn't suddenly affect the work. So I try to see conflicts coming weeks ahead instead of discovering them when they're already here.",
      },
      {
        type: "p",
        text: "**Mattia: There will be a week where a university exam collides with a Noesia deadline. Walk me through how you decide which one wins, and what you'd tell me before that week.**",
      },
      {
        type: "quote",
        text: "I tell the team as early as I possibly can. The moment I know an exam is landing on top of a deadline, that's a conversation I have with Mattia and the team right away, not the week it happens. I'd rather we figure out together what absolutely needs to ship before that week than have anyone find out I'm suddenly unavailable.",
      },
      {
        type: "p",
        text: "This answer is why I'm confident about Raj's commitment. He didn't promise it would never be hard. He promised to flag conflicts early, which is the only promise a student can honestly make. And he made it before I asked.",
      },
      { type: "h2", text: "Types are part of the product" },
      {
        type: "p",
        text: "**Mattia: What's the most TypeScript-specific thing you've learned building the SDK?**",
      },
      {
        type: "quote",
        text: "How much the types themselves are part of the product. If a developer can look at the request, response, and error shapes and immediately understand how the SDK behaves, they barely need to open the docs. The trap would be going overboard and typing everything just because you can. The goal isn't maximum type coverage, it's an API that's predictable and doesn't surprise anyone.",
      },
      {
        type: "p",
        text: "**Mattia: The SDK has typed errors for every declined reason. Why typed errors instead of generic exceptions?**",
      },
      {
        type: "quote",
        text: "Because \"something went wrong\" isn't an answer a developer can build on. With a generic exception, you're stuck parsing error strings and hoping the message doesn't change on you. With something like an OverLimitError or a MerchantNotAllowedError, the application can branch on exactly what happened and give its own user a real answer instead of a shrug. It just makes the SDK nicer to build against.",
      },
      { type: "h2", text: "The pending middle state" },
      {
        type: "p",
        text: "**Mattia: The demo agent needs to handle three states: approved, declined, and pending approval. Where do most agent demos get this wrong?**",
      },
      {
        type: "quote",
        text: "I keep the three states completely explicit and don't let the agent blur them together. Approved means go: move to the next step, like capturing payment. Declined means stop, and the agent has to surface why clearly enough that whoever's watching understands immediately: over budget, merchant not allowed, whatever it is. Pending approval is the one most demos skip: the agent pauses, full stop, and waits on a human. It doesn't get clever and route around the approval.",
      },
      {
        type: "p",
        text: "Most toy agent demos only model success and failure. The real world lives in that pending middle state.",
      },
      {
        type: "p",
        text: "That sentence is why Raj is building the Agent Experience. He's seen enough agent evaluations to know that the hardest state isn't success or failure, it's the pause where a human needs to decide. Most builders skip it because it's hard. Raj designs for it because he knows it's where the product lives. It is the human half of the rule Alex defends on his side of the engine: [no LLM in the authorization path](/thoughts/welcoming-alex-mwaniki-founding-engineer-core/), deterministic code decides, and when the policy says a person must approve, the agent waits.",
      },
      { type: "h2", text: "His version of the future" },
      {
        type: "p",
        text: "**Mattia: Noesia's bet is that agents will pay for things everywhere and nobody will think about it. Raj, the student from India who evaluated agents before most people knew what agents were, what does your version of that future look like?**",
      },
      {
        type: "quote",
        text: "Agents stop being something you ask questions to and start being something you hand a job to. You give it a budget and a set of rules, and it goes and finds the options, compares them, actually buys the thing, manages the subscription, pays the bill: the whole loop, not just the research part.",
      },
      {
        type: "quote",
        text: "Coming from India, I see a lot of value here specifically in the repetitive coordination work that eats people's time, for individuals and businesses both. But the part that matters most is that the agent can act, with real permissions and real limits, not just suggestions it hopes someone follows.",
      },
      { type: "h2", text: "Welcome to the team, Raj" },
      {
        type: "p",
        text: "Raj is now officially Founding Engineer (Agent Experience) at Noesia: full-time commitment, equity with 4-year vesting and a 1-year cliff. He owns the TypeScript SDK, the demo agent, and everything that makes the Noesia agent usable by developers. His first shipped artifact, the persistent idempotency SDK with FLAKY_MODE testing, is coming in a follow-up post.",
      },
      {
        type: "list",
        items: [
          "GitHub: [github.com/Rajkoli145](https://github.com/Rajkoli145)",
          "LinkedIn: [linkedin.com/in/raj-koli-626008318](https://www.linkedin.com/in/raj-koli-626008318)",
          "X: [x.com/koli_raj57974](https://x.com/koli_raj57974)",
          "Website: [rajkoli-27.vercel.app](https://rajkoli-27.vercel.app/)",
          "Research logs: [rajkoli-27.vercel.app/research](https://rajkoli-27.vercel.app/research)",
        ],
      },
    ],
  },
  {
    slug: "welcoming-alex-mwaniki-founding-engineer-core",
    title: "Welcoming Alex Mwaniki, Founding Engineer (Core): the interview",
    category: "Thoughts",
    description:
      "Alex Mwaniki, 21, from Kenya, is Noesia's Founding Engineer on the core: the interview on least privilege, Go, and why no LLM touches the money.",
    date: "2026-09-22",
    tags: ["founders", "hiring", "engineering", "building in public", "Noesia"],
    keywords: [
      "Alex Mwaniki",
      "founding engineer",
      "Noesia team",
      "artifact-based hiring",
      "AI agent payments",
      "Mattia Ciuni",
    ],
    content: [
      {
        type: "p",
        text: "**Founding Team series.** This is the first post in a series I've wanted to write since the day Noesia stopped being just me: introducing the people building this company, [in their own words](/work/), with the honesty we use everywhere else on this site.",
      },
      {
        type: "p",
        text: "First up: Alex Mwaniki, 21, from Kenya. Founding Engineer on the core: the Go authorization engine, the ledger, the money path. He joined after shipping a working proposal, survived a technical questionnaire built from our own audit findings, and now owns the most sensitive code in the product.",
      },
      {
        type: "p",
        text: "What follows is our conversation, edited for length but not for honesty.",
      },
      {
        type: "p",
        text: "**Describe in one sentence what you think about Noesia.**",
      },
      {
        type: "audio",
        src: "/thoughts/welcoming-alex-mwaniki-founding-engineer-core/alex-audio.m4a",
        title: "Alex Mwaniki: one sentence about Noesia",
      },
      { type: "h2", text: "A builder with nowhere to build" },
      {
        type: "p",
        text: "**Mattia: Take me back to the day you first saw Noesia. What made you reply instead of just scrolling?**",
      },
      {
        type: "quote",
        text: "Actually, it didn't start with a public post; it started on Discord. At that time I felt like a builder with nowhere to build. I had the drive, the certifications and the skills, but I was searching for real and ambitious projects where I could contribute. I crossed paths with Mattia while working on an earlier project. What caught my attention wasn't just the tech: it was his energy in building. I immediately wanted to build with him.",
      },
      {
        type: "p",
        text: "That \"energy in building\" line is why our hiring works the way it does, and it is the same idea as [artifact-based hiring](/thoughts/artifact-based-hiring/): judge the work, not the pitch. Alex didn't arrive with a CV and a cover letter about passion. He arrived with a complete technical proposal: ephemeral scoped credentials, ledger-first architecture. He wrote it before he'd ever seen our codebase. He attacked the problem before asking for anything.",
      },
      { type: "h2", text: "Least privilege, applied to AI agents" },
      {
        type: "p",
        text: "**Mattia: Where did that instinct come from? The proposal described our architecture almost exactly, before it existed.**",
      },
      {
        type: "quote",
        text: "It came directly from my background in Cloud Architecture and SRE. In cloud security, the foundational rule is the Principle of Least Privilege: you never grant a service excess access. You generate the minimal permissions needed to execute the task given, nothing more. When I looked at what Noesia was building, I applied the exact mental model to AI. We want autonomous agents to handle transactions, but can we blindly trust non-deterministic software with unrestricted access to our money? Giving an AI agent a static card number or a permanent API key is asking for a disaster; one hallucination could drain an entire account. The only safe model is treating the agent like an untrusted cloud process and giving it the least permissions required. Pairing that with an append-only ledger was the natural counterpart: every permission granted and every cent moved must be permanently recorded in an immutable trail.",
      },
      {
        type: "p",
        text: "This is the paragraph I read three times before offering him the role. He arrived at the core principle behind [the money layer for AI agents](/thoughts/money-layer-for-ai-agents/), capabilities instead of credentials and a record of everything, from a completely different discipline. Cloud security and agent payments converging on the same answer is either a coincidence or a sign the answer is right. We bet on the second.",
      },
      { type: "h2", text: "I told no one" },
      {
        type: "p",
        text: "**Mattia: You were 21 when you joined. What did the people around you say when you told them you were going full-time on a startup founded by someone you'd met on the internet?**",
      },
      {
        type: "quote",
        text: "I told no one. In tech, especially on social media, people love to celebrate announcements and titles before they've written a single line of production code. I didn't want premature congratulations or outside noise. I believe in execution first. I wanted 100% of my focus on the architecture and shipping real value alongside the team. My mindset is simple: keep your head down, build the system, and let the code do the talking.",
      },
      {
        type: "p",
        text: '"I told no one, let the code do the talking" is a level of discipline I didn\'t expect from a 21-year-old. Most people his age announce the title first. He announced nothing until the code existed.',
      },
      { type: "h2", text: "M-Pesa: where money taught him security" },
      {
        type: "p",
        text: "**Mattia: Your M-Pesa gateway started because API keys were leaking on the frontend. Tell that story properly.**",
      },
      {
        type: "quote",
        text: "I initially built it to understand how Daraja works under the hood, but I soon realized that client-to-payment integrations are broken by design. You can't handle money safely on a frontend. You need a backend to verify request authenticity, absorb duplicate callback bursts, and guarantee transaction state even during network failures. I built the Go gateway as a reusable, bulletproof bridge: deploy it once, configure environment variables, and any frontend can transact securely without leaking credentials. It taught me that client applications should never touch payment rails directly. Money always demands an authoritative, isolated backend.",
      },
      {
        type: "p",
        text: "For context: M-Pesa is the payment system that proved to the world money doesn't need bank branches; it can live as programmatic software. Alex cut his teeth building secure infrastructure on top of it. When he talks about money needing an \"authoritative, isolated backend,\" he's not repeating a tutorial. He's describing the exact gap he watched real developers fall into, which is the same class of problem as [duplicate callback bursts](/notes/idempotent-payments-for-ai-agents/) on our side.",
      },
      { type: "h2", text: "The honest part: the questionnaire and the gap" },
      {
        type: "p",
        text: "I run hiring differently. Every candidate gets real technical questions built from my own audit findings, and I publish the method. Alex's questionnaire didn't go perfectly, and I want this post to include that, because the honesty standard on this site applies to the team too.",
      },
      {
        type: "p",
        text: "The strongest moment of the review was our money test suite. Every change to the payment path passes through it. Alex's first mission was to study it end to end, walk me through the audit fixes that produced it, and then write the test he found missing: rate limiting under burst load against a budget. Owning the money path means owning its proofs first.",
      },
      {
        type: "p",
        text: "The result of that mission will be a follow-up to this post. That's the deal we made: the next time we write about Alex, it will include the test he shipped.",
      },
      { type: "h2", text: "Go, and what JavaScript hides from you" },
      {
        type: "p",
        text: "**Mattia: What's the most Go-specific thing you've learned here, something a JavaScript developer wouldn't naturally know?**",
      },
      {
        type: "quote",
        text: "How true multi-threaded concurrency behaves under load. In JavaScript, the single-threaded event loop hides memory safety issues from you. In Go, goroutines execute on real, concurrent OS threads across multiple CPU cores. You have to actively think about memory ownership so high-traffic bursts don't cause data corruption or crashes.",
      },
      {
        type: "p",
        text: "This is precisely why the engine is written in Go and why the questionnaire focused on races and locks. An agent fires 60 requests in 5 seconds: that's not a hypothetical, that's what agents do. In JavaScript, you hope you don't corrupt shared state. In Go, you must prove you didn't. Alex is now the person proving it.",
      },
      { type: "h2", text: "Relief, not resentment" },
      {
        type: "p",
        text: "**Mattia: Be honest: the structure changed. Ghassen arrived as CTO while you became Head of Engineering on the core. What was it really like?**",
      },
      {
        type: "quote",
        text: "Honestly? The main feeling was relief. I'm 21, and taking on an executive CTO role involves regulatory compliance and corporate management that would pull me completely away from the code. Having Ghassen own that side lets me focus 100% on what I do best: building the core engine, the ledger, and the infrastructure. The only uneasy part was the initial surprise of a sudden structural shift, but that passed immediately once I realized it protects my time to just build. I'm sure there's still a lot to learn before taking a managerial role like a CTO. I believe in the Noesia manifesto, and I'm grateful for this chance to be part of it at this early stage. The growth and networking from this team, different countries and different backgrounds, really makes me want to stay and build.",
      },
      {
        type: "p",
        text: "I'm including this answer unedited because it's the most mature response to the hardest question I ask any early team member. The title changed. The compensation didn't. And instead of ego, he saw the structure for what it is: protection of his time to build. That answer is why the path we wrote into his agreement, growth toward bigger technical ownership earned through shipped work, is one I'm confident we'll walk together. The other half of that story is [how Ghassen became my co-founder](/thoughts/finding-ghassen-the-co-founder-question-answered-in-three-weeks/).",
      },
      { type: "h2", text: "The principle he would defend" },
      {
        type: "p",
        text: '**Mattia: Our rule is "no LLM in the authorization path, deterministic code decides." A founder tells you "AI is smart enough now, why not let it decide?" Defend the principle.**',
      },
      {
        type: "quote",
        text: "AI is smart, but we're still in an early, experimental phase where models fundamentally hallucinate. In financial authorization, a hallucination isn't an awkward chatbot response: it's an unauthorized charge or a drained account. AI belongs at the planning layer, to figure out what an agent wants to do. But mathematical, deterministic code must guard the money.",
      },
      {
        type: "p",
        text: "One sentence in that answer is going on our docs page: AI belongs at the planning layer. Deterministic code guards the money.",
      },
      { type: "h2", text: "His version of the future" },
      {
        type: "p",
        text: "**Mattia: Noesia's bet is that one day agents pay for things everywhere and nobody thinks about it. Alex, the kid from Kenya who built an M-Pesa gateway, what does everyday money look like when your generation rebuilds it?**",
      },
      {
        type: "quote",
        text: "M-Pesa proved to the world that money doesn't need plastic cards or bank branches; it can live as programmatic software. My generation's version takes human friction out of transactions completely. Agents will negotiate, book, and pay for services autonomously in milliseconds, while humans sleep peacefully knowing that strict, programmatic policy limits set the boundaries. It's an economy where money moves seamlessly, but code guarantees safety.",
      },
      { type: "h2", text: "Welcome to the team, Alex" },
      {
        type: "p",
        text: "Alex is now officially Founding Engineer (Core) at Noesia: full-time, equity with vesting, San Francisco-bound with the team if we make the batch. He owns the authorization engine, the ledger, and the money test suite. His first shipped test, rate limiting under burst load, is coming in a follow-up post. Next in this series: [Raj Koli, Founding Engineer on the Agent Experience](/thoughts/welcoming-raj-koli-founding-engineer-agent-experience/).",
      },
      {
        type: "list",
        items: [
          "GitHub: [github.com/lxmwaniky](https://github.com/lxmwaniky)",
          "LinkedIn: [linkedin.com/in/lxmwaniky](https://www.linkedin.com/in/lxmwaniky)",
          "Blog: [lxmwaniky.hashnode.dev](https://lxmwaniky.hashnode.dev)",
          "Website: [lxmwaniky.vercel.app](https://lxmwaniky.vercel.app)",
          "X: [x.com/lxmwaniky](https://x.com/lxmwaniky)",
        ],
      },
    ],
  },
  {
    slug: "money-layer-for-ai-agents",
    title: "The money layer for AI agents",
    category: "Thoughts",
    description:
      "AI agents can research, compare and execute, then they stop at the payment step. Why controlled spending power is the missing infrastructure of the agentic economy.",
    date: "2026-09-20",
    tags: ["AI agents", "payments", "Noesia"],
    keywords: [
      "AI agents payments",
      "agentic commerce",
      "AI spending",
      "Noesia",
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
      { type: "h2", text: "What we're building with Noesia" },
      {
        type: "p",
        text: "Noesia gives each AI agent controlled spending power. Define the rules, let the agent operate, keep a receipt for everything. No model in the authorization path, only rules that can be read, replayed and verified: [boring on purpose](/notes/on-boring-systems/). The short version of the rules is [above](#what-agents-actually-need). If you're building in the agentic economy, write to me: I read every email.",
      },
    ],
  },
  {
    slug: "artifact-based-hiring",
    title: "Artifact-based hiring: ship code before titles",
    category: "Thoughts",
    description:
      "Everyone who joins Noesia shipped working code before we ever talked about roles. How artifact-first recruiting filters for builders.",
    date: "2026-09-20",
    tags: ["hiring", "building"],
    keywords: [
      "artifact-based hiring",
      "startup hiring",
      "Noesia",
      "Mattia Ciuni",
    ],
    content: [
      {
        type: "p",
        text: "Everyone who joins Noesia shipped working code before we ever talked about roles. No exceptions, including me. Resumes describe the past; *artifacts predict the future*.",
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
      "How a stranger challenged Noesia's weakest assumption, became its co-founder and CTO, and turned three weeks of evidence into a partnership.",
    date: "2026-09-21",
    tags: ["founders", "fintech", "building in public", "Noesia"],
    keywords: [
      "finding a co-founder",
      "co-founder CTO",
      "fintech startup",
      "building in public",
      "Ghassen Jemai",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "Three weeks ago I posted Noesia's architecture publicly in a builder community. A complete stranger could read exactly what I was building: the authorization engine, the policy evaluation, the hash-chained ledger, and the idea that AI agents should be able to pay for things under human-defined rules.",
      },
      {
        type: "p",
        text: 'I was not looking for a co-founder. I want to be honest about that from the start, because most co-founder stories begin with "we were looking for someone" and end with a compromise that everyone regrets. I was looking for something else entirely: stress. I wanted smart people to attack the idea before I fell in love with it. If Noesia was going to die, I wanted it to die in a comment section, not after eighteen months and someone\'s savings.',
      },
      {
        type: "p",
        text: "Most responses were compliments. Compliments are free and worthless.",
      },
      { type: "h2", text: "The message" },
      {
        type: "p",
        text: "Then a message arrived from Ghassen. No compliment in it. Instead, research he had done on his own, completely unprompted. He had found a competitor acquisition I did not even know about, Rye acquired by PayPal, and used it to map where the agentic commerce market was consolidating. Then he asked the hardest question anyone had asked me about Noesia up to that point: our BNPL model, exactly as I had framed it, did not work for variable usage-based subscriptions.",
      },
      {
        type: "p",
        text: "You cannot split an unpredictable monthly API bill into three fixed installments and call it a product. The costs move with consumption, so the installments would be fiction. He was right. I remember reading it and feeling two things at the same time. Annoyance, because he was right about the weakest point of my model. Excitement, because he was right about the weakest point of my model, and instead of walking away from the broken thing, he was already talking about how to redesign it.",
      },
      {
        type: "p",
        text: "We redesigned around his objection. The aggregated spend budget, the credit line that covers variable consumption instead of fixed installments on imaginary amounts, is in Noesia's architecture today because a stranger asked me a question I could not answer well. It is the same principle behind [the money layer for AI agents](/thoughts/money-layer-for-ai-agents/): controlled delegation has to work in the messy version of reality, not just in a pitch.",
      },
      { type: "h2", text: "The first week" },
      {
        type: "p",
        text: 'We talked every day after that. Not "we will keep in touch". Actually every single day, about issuing partners, SCA, and how step-up authentication should route through an app approval instead of an OTP that an agent can never complete. We talked about what Klarna can and cannot become in a world where agents do the shopping, and about why [idempotent payments](/notes/idempotent-payments-for-ai-agents/) matter when the buyer is no longer the one pressing retry.',
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
        text: "Three weeks ago Ghassen was a stranger in my comments. Today he is the **Co-founder and CTO of Noesia**, and the company is objectively better than the one I was building alone: sharper model, deeper fintech coverage, faster decisions.",
      },
      {
        type: "p",
        text: "Between those two points there was no magic and no luck. There was a public post, a stranger who did his homework, and one question about subscription financing that I could not answer well.",
      },
      {
        type: "p",
        text: "Build in public. Watch who shows up. The rest is selection. You can find Ghassen on [his website](https://beamerboi.github.io/), on [LinkedIn](https://www.linkedin.com/in/ghassen-jemai/), or reach him at [g@withnoesia.com](mailto:g@withnoesia.com).",
      },
    ],
  },
  {
    slug: "who-is-responsible-when-an-ai-agent-buys-the-wrong-thing",
    title: "Who is responsible when an AI agent buys the wrong thing",
    category: "Thoughts",
    description:
      "AI agent liability is still an open question: the networks shipped frameworks, the rules for who carries the loss in a dispute are not written, and the side that can prove what was authorised will set the terms.",
    date: "2026-10-12",
    tags: ["AI agents", "liability", "payments", "authorization", "Noesia"],
    keywords: [
      "AI agent liability",
      "AI agent accountability",
      "agentic commerce disputes",
      "agent authorization",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "You send an agent to book a flight. It comes back with a twelve-hour layover on a non-refundable fare. You would have taken the direct one. The agent executed the instruction you gave it, with the money you gave it, and you lost a day and two hundred euros.",
      },
      {
        type: "p",
        text: "Now the merchant says that was the fare. You say nobody should have bought it. The agent says you asked for the best value. All three statements are defensible, and none of them answers the question. That question is **AI agent liability**, and it is the part of agentic commerce that everyone ships around rather than through.",
      },
      {
        type: "h2",
        text: "Nobody has decided, and the people who would decide say so",
      },
      {
        type: "p",
        text: "Start with what the incumbents say in public, because it is more honest than the marketing above it. Reshmi Suresh runs agentic commerce at Worldpay, which now sits inside Global Payments: Visa, Mastercard and American Express have all launched frameworks for agent transactions, and **who bears the loss in a dispute remains largely undecided**. That is a payment infrastructure company, in its own words, conceding the gap after naming the three networks.",
      },
      {
        type: "p",
        text: "Visa says the same thing in its own research. Its report on agentic payments states that disputes lack established resolution mechanisms, and that chargeback windows and evidence requirements were designed for human-speed commerce with clear buyer intent. Read that sentence twice. The instrument that settles card disputes was built for a person clicking buy on a page they could see, at a speed a person can produce.",
      },
      {
        type: "p",
        text: "In January 2026 the Consumer Bankers Association published a white paper with the payments law firm Davis Wright Tremaine, and it is the banking industry's own trade body publishing a document whose sections map where the existing consumer protection frameworks reach agent initiated commerce, and where they stop. A banking association is not a natural advocate for a new entrant's argument. That is what makes the document useful.",
      },
      { type: "h2", text: "The three answers people actually use" },
      {
        type: "list",
        items: [
          "**The shared card.** The agent spends on a card with no boundary. Finance finds out from the statement, and nobody can reconstruct why the purchase happened.",
          "**The confirmation button.** The agent proposes, a human approves every purchase. It is safe, and it makes the agent an inbox.",
          "**Declared autonomy.** The product executes and puts the outcome on the user. It is the most common position in this category, and the easiest one to write down.",
        ],
      },
      {
        type: "p",
        text: "I have written before that the third position is legitimate and that I disagree with it, and I want to be precise about why. It is not wrong because it is unfair. It is wrong because it is unprovable in the only room where it matters. When a dispute arrives, nobody is arguing about intent. They are arguing about the record.",
      },
      {
        type: "h2",
        text: "Liability follows the evidence, and that is a product decision",
      },
      {
        type: "p",
        text: "The clearest writing on this is not from a vendor. It is from the payments practice of a law firm, in a five part series published between April and May 2026. The part on disputes makes two sentences that I have not been able to improve on since I read them.",
      },
      {
        type: "quote",
        text: "Operational logs are not sufficient. Evidence-quality records are.",
      },
      {
        type: "quote",
        text: "The party with the better record will not merely win. It will control how the dispute is framed, which doctrinal category it lands in, and whether the fight even gets to a court.",
      },
      {
        type: "p",
        text: "The same series separates agent purchases into buckets, and the separation is the useful part. In their **plainly authorised** bucket, the agent did exactly as instructed and the principal regrets it. They call that commercially and legally ordinary. Cases like the flight live there, and buyers tend to lose them, because the instruction was followed.",
      },
      {
        type: "p",
        text: "In the middle is **misauthorised commerce**: the agent stayed inside the general category of what it was allowed to do but stepped outside the specific boundary. That is where the category lines are not self executing, and it is where every real product will live. A procurement agent that buys from a vendor outside policy but inside the system's general rules is the example the lawyers wrote down. That is my buyer, described by someone with no stake in my product.",
      },
      {
        type: "p",
        text: "The same series also opens with a line that should end an argument I keep having. Network rules and the EMV 3DS specification already govern agentic commerce in part. The ambiguity is not an absence of applicable rules. The rules exist. The fight is about which rule applies, and the record decides that.",
      },
      { type: "h2", text: "What I am willing to answer for" },
      {
        type: "p",
        text: "So here is the position I will defend: we answer for what we were asked to do, and we prove it. We do not promise the agent will choose well. Nobody can promise that, and anyone who does is selling a model, not a system. We promise that when it chooses badly, there is a row in the record that says which instruction it was given, which rule was in force, which decision was taken, and what the agent was allowed to do at that second.",
      },
      {
        type: "p",
        text: "It is an uncomfortable position, because it exposes us. It also implies something almost nobody writes down: **the mandate has to be written by you, in your own words, before the agent runs.** Not an interface guessing what you will allow later. A boundary you set while you still know what you meant.",
      },
      {
        type: "p",
        text: "The alternative is the one the industry has quietly chosen. Every network now ships credentialing for agents, and every network that ships it also documents that the product is in the process of deployment. Visa's own developer page says the depiction is a representation of potential features, and that the final version may not contain all of them. That sentence is not a scandal. It is the honest state of a category that is building the rails before writing the rules that will run on them.",
      },
      {
        type: "p",
        text: "Agent identity and liability is the row of our own capability table that we mark as not answered. I would rather publish that than have it found later: it is a legal and product decision that has to survive a real dispute, not a paragraph. What we do have is the mechanism that makes the question answerable at all, which is a boundary set before the money moves and a receipt that survives being read by someone who was not there.",
      },
      {
        type: "p",
        text: "If you are building an agent that spends, the useful test is not whether it can buy. It is whether you can reconstruct one bad purchase six weeks later, from the record alone, without the conversation that produced it. I am building that record into [Noesia](https://withnoesia.com), and the argument it sits on is the [money layer for AI agents](/thoughts/money-layer-for-ai-agents/). The next piece in this thread is [why there should be no LLM in the authorization path](/thoughts/no-llm-in-the-authorization-path/). If that reconstruction is impossible in your system, I would rather hear where it breaks than where it works. The trust argument in one page is [the agentic economy is a trust problem](/notes/the-agentic-economy-is-a-trust-problem/).",
      },
    ],
  },
  {
    slug: "no-llm-in-the-authorization-path",
    title: "Why there should be no LLM in the authorization path",
    category: "Thoughts",
    description:
      "Deterministic AI systems put the model where it belongs and keep it out of the decision. Google ships that instinct in its own checkout, the AP2 spec names the reason, and the test is whether the same request twice gives the same answer.",
    date: "2026-10-15",
    tags: [
      "AI agents",
      "deterministic authorization",
      "engineering",
      "authorization",
      "Noesia",
    ],
    keywords: [
      "deterministic AI systems",
      "AI authorization",
      "deterministic authorization",
      "AI agent permissions",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "An authorization decision has one job: given the same request and the same state, answer the same thing. A language model cannot promise that. This is not a philosophical complaint about **deterministic AI systems**. It is the ordinary engineering reason you would not let a model decide whether a transfer leaves your account, and it is the reason the biggest companies in this category keep shipping the model away from the decision.",
      },
      {
        type: "h2",
        text: "Google built its own checkout to keep the model out of the last step",
      },
      {
        type: "p",
        text: "In January 2026 Google launched the Universal Commerce Protocol at the National Retail Federation keynote, with Shopify, Etsy, Wayfair, Target and Walmart involved in building it. On stage, Sundar Pichai said it was available starting that day. The interesting part is not the launch. It is one sentence in the developer documentation, describing what happens when the user reaches payment.",
      },
      {
        type: "quote",
        text: "Manual checkout: The user now interacts only with the Google UI to fill in sensitive fulfillment and payment details and submit the order. The Agent is not involved in this part, ensuring determinism.",
      },
      {
        type: "p",
        text: "A company with every commercial incentive to let the agent finish the purchase wrote, in its own documentation, that it takes the agent out of the flow **to ensure determinism**. The page adds that initially Google renders the interface for the buyer, with more agentic experiences planned later, and the merchant help page says the feature uses the card numbers users already stored in Google Wallet.",
      },
      {
        type: "p",
        text: "That is the trade written down in public: autonomy stops where determinism starts, and the human is the mechanism that guarantees it. It works. It is also, at scale, a confirmation button with better typography. The product question my company exists to answer is what has to exist for the agent to be allowed to finish, and the answer cannot be a model's opinion of your intent.",
      },
      { type: "h2", text: "The spec says it in one line" },
      {
        type: "p",
        text: "Google's Agent Payments Protocol, published in September 2025 and donated to the FIDO Alliance in April 2026, defines what it calls mandates: tamper proof, cryptographically signed digital contracts that serve as verifiable proof of a user's instructions. The core concepts documentation states the design principle in six words.",
      },
      {
        type: "quote",
        text: "Verifiable Intent, Not Inferred Action: Trust in payments is anchored to deterministic, non-repudiable proof of intent from the user, directly addressing the risk of agent error or hallucination.",
      },
      {
        type: "p",
        text: "Inferred action is what a model does. It reads a context and produces a plausible completion. Proof of intent is what a signature does. It binds a specific instruction to a specific principal, and it can be checked by a third party who was not present. When a protocol designed by a company that sells models writes **directly addressing the risk of agent error or hallucination** into its spec, the industry has already agreed with the premise of this article. The disagreement is only about where the line falls.",
      },
      { type: "h2", text: "Where I put the line" },
      {
        type: "list",
        items: [
          "The model interprets. It reads the request, argues with itself, picks a merchant, builds a cart. This is where a model is genuinely better than a rule and where it should be allowed to be wrong.",
          "The engine decides. It takes the action the model proposes, evaluates it against the boundary that was written before the run, and returns allow, deny, or escalate. Same input, same state, same answer.",
          "The ledger records. Every decision leaves a row that a person who was not there can read later.",
        ],
      },
      {
        type: "p",
        text: "Note what this does not do. It does not make the agent smart. It does not remove human judgement from the boundary. It removes human judgement from the millisecond, which is where it was never going to be anyway, and puts it in the document, which is where it can be argued about properly.",
      },
      { type: "h2", text: "How you know it is deterministic" },
      {
        type: "p",
        text: "You do not know it because the architecture diagram says so. You know it because you tried to break it. Here is the test I actually run, and I have written this loosely enough that it should be reproducible by anyone who owns an engine: hold the state still, send one hundred identical authorization requests for the same intent in parallel, and read the ledger afterwards.",
      },
      {
        type: "code",
        lang: "text",
        code: "100 requests, same intent, same key\n  expected: 1 allow, 99 identical replays, 1 ledger row, 1 charge\n  observed: 1 allow, 99 replays with the identical decision id\n\nrestart the engine, replay 20 decisions from the ledger\n  expected: byte-identical decisions, same policy version\n  observed: identical",
      },
      {
        type: "p",
        text: "Two things make that pass. The decision is a pure function of the request plus the policy version plus the ledger state, so restarting the process changes nothing. And idempotency is keyed on the intent, not on the HTTP request, because an agent retries aggressively by nature. Two identical requests are one intention. One intention is one charge.",
      },
      {
        type: "p",
        text: "That test is in the suite, which is why I am comfortable calling the engine deterministic rather than robust. **Verified by test** is a phrase I only use about things that run in the pipeline on every commit. Everything else is a design note, and design notes get the label they deserve.",
      },
      { type: "h2", text: "The uncomfortable part of this position" },
      {
        type: "p",
        text: "If the engine is deterministic and the boundary was wrong, the failure is legible. That is the point, and it is also the cost. A system that can prove what it was asked to do can also prove that it was asked badly. Autonomy sold as magic disappears; what remains is a clear line between the part that runs and the part that thinks, and a receipt that says which one produced the outcome.",
      },
      {
        type: "p",
        text: "I would rather ship the legible version. The alternative is the one the industry is currently testing: let the model decide, describe the result as intent, and settle the argument later with whatever log happens to exist.",
      },
      {
        type: "p",
        text: "I am building this authorization path into [Noesia](https://withnoesia.com), and the argument started in [the money layer for AI agents](/thoughts/money-layer-for-ai-agents/). The pieces closest to this one are [how the authorization layer works](/thoughts/the-authorization-layer-for-autonomous-agents/) and [deterministic authorization for AI agents](/thoughts/deterministic-authorization-for-ai-agents/). If you have a system where the model makes the final call, I would rather hear how you handle the retry than be told the model is reliable. The retry half of the same problem is [idempotent payments for AI agents](/notes/idempotent-payments-for-ai-agents/).",
      },
    ],
  },
  {
    slug: "the-authorization-layer-for-autonomous-agents",
    title: "The authorization layer for autonomous agents",
    category: "Thoughts",
    description:
      "AI agent authorization is the phrase everyone uses. Five of the largest companies shipped a piece of it in twelve months, and what is still missing is the part that survives crossing between them.",
    date: "2026-10-19",
    tags: [
      "AI agents",
      "authorization",
      "payments",
      "agentic commerce",
      "Noesia",
    ],
    keywords: [
      "AI agent authorization",
      "authorization layer",
      "agentic commerce",
      "AI agent permissions",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "Sixteen months ago **AI agent authorization** was a slide. As of this month it is a set of shipped frameworks, each with a name, a launch date and a partner list. If you are building in this category, the first useful thing you can do is read what the five largest players actually wrote, because the gap that survives their announcements is much smaller and much sharper than the one the marketing describes.",
      },
      { type: "h2", text: "What shipped, in order, from the primary sources" },
      {
        type: "list",
        items: [
          "**Visa Intelligent Commerce, April 2025.** Agent specific pass through tokens, payment instructions set by the consumer, and validation that the authorisation request matches the original authenticated instruction. Visa's own line: only the consumer can instruct the agent on what to do and when to activate a payment credential.",
          "**Mastercard Agent Pay, April 2025, and Agent Pay for Machines, June 2026.** Every agent is credentialed, authorization rules and spending limits are programmatically enforced, participants transact across providers, and settlement spans cards, accounts and stablecoins.",
          "**Google's Agent Payments Protocol, September 2025, donated to the FIDO Alliance in April 2026.** Mandates are cryptographically signed proof of a user's instructions, shared with the credential provider, the networks and the merchant payment processor, and explicitly payment agnostic.",
          "**OpenAI's Agentic Commerce Protocol, September 2025, built with Stripe.** Open sourced, with the merchant accepting or declining the order and processing payment through its existing provider.",
          "**Stripe's Agentic Commerce Suite, December 2025.** Shared Payment Tokens, where the credential is bound to a mandate rather than to a card number, plus a single integration for merchants reachable by many agents.",
        ],
      },
      {
        type: "p",
        text: "Read that list as an engineer and one thing stands out. Every one of these is an excellent answer to the question inside its own boundary. Visa's control plane matches a transaction against an instruction inside Visa's rails. Mastercard's permissioning is enforced by Mastercard. Stripe makes one integration reach many agents, and the authority still lives in Stripe's token. Google's mandate is the most portable object in the list, and it is a specification that the industry agreed to standardise, which is not the same thing as a merchant, an issuer and a processor accepting it in production with the loss allocated when it goes wrong.",
      },
      { type: "h2", text: "The narrower claim that still holds" },
      {
        type: "p",
        text: "I had to cut a sentence from my own writing last month because it had stopped being true. The version I can defend is this: no one currently accepts a signed authority object at production scale, outside a pilot, when the rail changes and the parties do not share a balance sheet, with the question of who pays for a mistake written down in advance. That is the claim I will put in front of anyone. It is smaller than the one I started with, and it is the one that survives a payments lawyer reading it.",
      },
      {
        type: "p",
        text: "It also happens to be the only version that matters commercially. The hard part of agent commerce is not getting one network to recognise an agent. Five companies solved that, and they solved it well. The hard part is a boundary that means the same thing to a merchant, an issuer, a processor and a regulator who are not on the same infrastructure, at the moment a purchase is disputed.",
      },
      {
        type: "h2",
        text: "What an authorization layer has to do, in three jobs",
      },
      {
        type: "list",
        items: [
          "**Say who is acting.** Not a key, not a session, not a card number. An identity for the agent, owned by a person or a company, with a history attached.",
          "**Say what it is allowed to do.** A boundary written before the run, in the form of scoped capabilities that expire, evaluated on every proposed action with an answer of allow, deny or escalate.",
          "**Say what happened.** A record that a third party who was not present can read, and that recomputes the decision it describes.",
        ],
      },
      {
        type: "p",
        text: "Notice that none of the three is a checkout. This is where most of the category accidentally converges, including people with good intentions. Making an agent able to pay is a different problem from making it authorised to pay, and the first one is much easier, which is why there is so much of it. Google's own buying surface shows the split cleanly. The protocol unifies the cart across merchants, and then the checkout still resolves per shop, per merchant of record, per integration. The cart is portable. The authority is not.",
      },
      { type: "h2", text: "Why this is worth building as its own layer" },
      {
        type: "p",
        text: "It is worth being precise about what portability would have to mean, because the word is doing a lot of work in the pitch decks. A portable authority object is not a file. It has to be accepted by four parties who do not share infrastructure: the agent has to present it, the merchant has to be able to read it without an integration, the issuer has to be able to honour it inside a network it controls, and whoever adjudicates a failure has to be able to say, from the object alone, what was permitted. Every one of those four is a separate negotiation. The specifications that exist today solve the first one and the technical half of the second.",
      },
      {
        type: "p",
        text: "The reason is mechanical rather than strategic. The moment authority is tied to the rail that supplied the credential, every new rail is a new integration, a new boundary and a new dispute process. Companies in this category already describe the consequence. Stripe's own launch post says that while the protocol provides shared technical language, real world fragmentation remains, because every agent has its own integration requirements and onboarding flows. That is the merchant side of fragmentation. The authority side is worse, because it is invisible until something goes wrong.",
      },
      {
        type: "p",
        text: "I am not arguing that networks should not do this. They should, and the version where the credential never leaves the network is genuinely safer than the version where it does. I am arguing that a boundary which only exists inside one operator's system is a permission, not an authorization layer. The difference is what happens on the day two of them disagree about the same purchase.",
      },
      {
        type: "p",
        text: "I am building that layer at [Noesia](https://withnoesia.com), and the argument it serves is the [money layer for AI agents](/thoughts/money-layer-for-ai-agents/). The two pieces that go deeper into the mechanics are [why there should be no LLM in the authorization path](/thoughts/no-llm-in-the-authorization-path/) and [what an agent authorization record should contain](/thoughts/what-an-agent-authorization-record-should-contain/). If you have read these five frameworks and reached the opposite conclusion, I would like to read your version of it. The short version of the same argument is [the agentic economy is a trust problem](/notes/the-agentic-economy-is-a-trust-problem/).",
      },
    ],
  },
  {
    slug: "what-should-an-ai-agent-be-allowed-to-do",
    title: "What should an AI agent be allowed to do",
    category: "Thoughts",
    description:
      "AI agent controls are a design problem with a fixed shape: an action, its conditions, its limits and its expiry. The best documentation of that shape is already public, and none of it is a settings screen.",
    date: "2026-10-22",
    tags: ["AI agents", "permissions", "authorization", "policy", "Noesia"],
    keywords: [
      "AI agent controls",
      "AI agent permissions",
      "agent policy",
      "AI agent authorization",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "Whenever I ask this question in public, someone answers with an amount. Five hundred euros a month, a merchant allowlist, a category list. Those are answers, and they are not the shape of the answer. **AI agent controls** are a design problem with a structure, and once you see the structure you notice that most products implement one third of it and call it done.",
      },
      {
        type: "h2",
        text: "The structure, as written by people who had to specify it",
      },
      {
        type: "p",
        text: "Google's Agent Payments Protocol describes the delegated case, the one where the human is not present, and it names the pieces a mandate has to carry: the rules of engagement, price limits, timing, and other conditions. The same specification makes a recommendation that I think is the most useful line in the whole document, about the expiry claim on an autonomous payment mandate: set it to the smallest value that will allow the task to be completed.",
      },
      {
        type: "p",
        text: "Mastercard's Agent Pay for Machines describes the same idea from the network side. Organizations set authorization rules and spending limits that are programmatically enforced, so that transactions stay inside defined parameters. Visa describes payment instructions that a consumer sets and changes, with validation to confirm that the authorisation request matches the original authenticated instruction. Three companies, three vocabularies, one shape.",
      },
      {
        type: "p",
        text: "The shape is: **an action, the conditions under which it is allowed, the limits it cannot cross, and the moment it stops being allowed.** Four fields. If a permission system cannot express all four about a single proposed purchase, it is a limit, not a permission.",
      },
      { type: "h2", text: "The four fields, in the version I implement" },
      {
        type: "list",
        items: [
          "**Action.** A verb with a target: pay this merchant, subscribe to this service, top up this balance. Not a category, which is a library of verbs pretending to be one.",
          "**Conditions.** The circumstances that must hold at the moment of the decision: the merchant is the one named, the amount is inside the band, the thing being bought is in the permitted list, the price did not move since the agent quoted it.",
          "**Limits.** A per transaction cap, a cumulative cap, a count cap, and the window each of them resets in.",
          "**Expiry.** The date and time after which the authority is gone whether or not it was used, plus the condition that removes it earlier.",
        ],
      },
      {
        type: "p",
        text: "Two design rules survive contact with real users. First, every capability expires. A permanent permission is a configuration mistake waiting to be discovered by an incident. Second, the boundary is written before the run. It is the difference between telling someone the rules of a game and explaining the rules to them after they lost.",
      },
      { type: "h2", text: "The two ways this goes wrong" },
      {
        type: "p",
        text: "The first failure is too broad. A card with a monthly cap is a permission to spend the cap anywhere, with anyone, for anything. It is the most common setup in the market today, and its real content is not a boundary. Its content is that a human will read a statement later. Everything that involves reading a statement later is accounting, not authorization.",
      },
      {
        type: "p",
        text: "The second failure is too granular. If every purchase needs a human approval, you have built a very good assistant and no autonomy at all. This is not a hypothetical: it is what the largest buying surface currently ships, in its own words, by keeping the agent out of the payment step to ensure determinism. It is a legitimate product. It is also a permanent ceiling for anyone whose problem is that they do not want to be in the loop at 2am for a fifty euro purchase.",
      },
      {
        type: "p",
        text: "The way out is not a middle setting on a slider. It is different boundaries for different classes of decision: an allowance for the routine, a written mandate for the delegated, and a requirement of evidence for the irreversible. The user should be able to state which is which in their own words, once, and then stop thinking about it.",
      },
      { type: "h2", text: "The decisions nobody puts on the label" },
      {
        type: "p",
        text: "A boundary that cannot answer these three questions is not finished. **What happens at the edge:** the purchase is for 149 euro with a 150 cap, do you allow it because of rounding, or deny it because the number is the number. There is no correct answer, which means the answer has to be written down and tested, not discovered by a user at 2am. **What happens when the rules conflict:** the user has one mandate for all travel and another for software, and the purchase is a flight that includes a seat fee. The engine needs a defined precedence, and the precedence needs to be explainable in the receipt.",
      },
      {
        type: "p",
        text: "And **what happens to the record when the answer is deny.** This is the one I would argue about hardest with a new engineer. A denial is still a decision. Someone asked for something, the boundary said no, and three months later that request is the most interesting line in the ledger, because it is where a bad instruction would have become a real loss. Systems that throw denials away are throwing away their own evidence.",
      },
      { type: "h2", text: "The test I use before shipping a rule" },
      {
        type: "p",
        text: "Can I read this boundary out loud to the person who wrote it, in one breath, and have them recognise it as what they meant? If the answer requires an interface tour, the boundary is wrong. If it requires an explanation of the escalation logic, the boundary is wrong. The version that passes sounds like a sentence a person would say: spend up to four hundred a month at these three suppliers, nothing that renews, ask me above a hundred and fifty, and it all stops on the last day of November.",
      },
      {
        type: "p",
        text: "That sentence is the product, and every field in it is a place where a system can be wrong in a way someone can point at later. The engineering behind it, a policy document that compiles to a decision and a ledger that records it, is in [designing an agent policy engine](/thoughts/designing-an-agent-policy-engine/). The category argument sits in [the money layer for AI agents](/thoughts/money-layer-for-ai-agents/). I am building it at [Noesia](https://withnoesia.com), and I would rather be told where that sentence breaks than be told that limits are enough. Why I care about this more than the money is [on boring systems](/notes/on-boring-systems/).",
      },
    ],
  },
  {
    slug: "an-ai-agent-should-never-have-your-credit-card",
    title: "An AI agent should never have your credit card",
    category: "Thoughts",
    description:
      "The card is the only credential in the economy built for a human at a checkout. Here is what the networks have changed, what tokenization did not fix, and what to hand an agent instead.",
    date: "2026-10-26",
    tags: ["AI agents", "payments", "security", "credentials", "Noesia"],
    keywords: [
      "AI agent credit card",
      "AI agent payments",
      "agent payment credentials",
      "scoped capabilities that expire",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "**An AI agent credit card** is the first thing every team builds and the last thing any of them should ship. The card is the only credential in the economy that was designed around a human being present at a checkout, and we are handing it to something that is not present, cannot be asked, and does not remember yesterday. That is not a risk to be managed with a limit. It is a category error.",
      },
      { type: "h2", text: "What the networks already changed" },
      {
        type: "p",
        text: "I would be writing something dishonest if I said nothing had moved, because the last eighteen months moved a lot. Visa describes agent specific pass through payment tokens, credentials bound to that agent, with a pass through structure that keeps the relationship with the merchant and the user intact. Mastercard launched Agent Pay with Mastercard Agentic Tokens built on the tokenisation already used for contactless and stored credentials, and a year later shipped Agent Pay for Machines.",
      },
      {
        type: "p",
        text: "Stripe documents a Shared Payment Token as a credential bound to a mandate rather than to a card number. That is the correct direction of travel and it is genuinely new: the thing being passed around carries the permission inside it. Google went a different way, and this is the detail I keep coming back to. When it describes its own agentic checkout, the merchant help page says the feature uses **standard funding primary account numbers that users have already stored in Google Wallet**. The largest commerce platform on earth, shipping agentic checkout in January 2026, starts from the card the user already has.",
      },
      {
        type: "p",
        text: "That is not a criticism of Google, who has more reasons than anyone to be conservative with credentials. It is a measurement of where the industry is. The token got safer. The instruction did not travel with it.",
      },
      {
        type: "h2",
        text: "Three things go wrong when the card is the credential",
      },
      {
        type: "list",
        items: [
          "**Reach.** A card number is not scoped to anything. It works anywhere it is accepted, for any amount the issuer allows, at any hour. The only description of its authority is the issuer's default.",
          "**Absence of instruction.** Nothing inside the credential says what it was given for. If the agent buys a subscription at a hosting provider, the receipt will contain a merchant name and an amount, and no record anywhere will contain the sentence that justified it.",
          "**Liability with no address.** When something goes wrong, the dispute framework looks for a customer who authorised a payment. The customer did not instruct it. The agent did not have a mandate. The merchant sees a valid credential. Everyone is looking for a person who does not exist.",
        ],
      },
      {
        type: "p",
        text: "The third one is the expensive one, and it is the reason this is not only a security argument. Tokenisation solved the storage problem. It did not solve the authorisation problem, because a token that is safe to hand around is exactly a token that says nothing about why it was handed over.",
      },
      { type: "h2", text: "What to hand an agent instead" },
      {
        type: "p",
        text: "A credential whose authority does not outlive the instruction. Three companies currently ship something in this direction and I want to describe them precisely, because two of them are competitors to my company and describing them well is more useful than dismissing them.",
      },
      {
        type: "p",
        text: "**Nekuda**, which raised five million dollars in May 2025 led by Madrona with Amex Ventures and Visa Ventures, documents a flow of collection, then mandate, then reveal. Single use reveal tokens, a card verification value valid for sixty minutes, idempotency keys on the request. Its own documentation carries one line that decides my opinion of the product: **one mandate per purchase**. Every purchase requires a new mandate and a new reveal token, and you cannot reuse either across purchases. That is a per transaction authorisation record rather than a standing delegation with a policy attached. Both are useful. They are not the same thing.",
      },
      {
        type: "p",
        text: "**Reap** describes itself as a licensed Visa issuer and publishes the mechanics of the credential on its own product page: a per agent card token minted at the moment a payment intent is created, in roughly one hundred and twenty milliseconds, capped to the approved amount and restricted to the merchant, scoped by merchant, amount and time to live, and bound to a passkey. Their own framing is that other issuers bolt agent support onto legacy card processing while they earned the licences afterwards, and that the order matters.",
      },
      {
        type: "p",
        text: "**Nevermined** sells a mandate layer and states the problem in the sentence I have borrowed more than once: there is no standard way to express *this software may spend up to fifty dollars on my behalf, for this purpose, until Friday*, and no way to withdraw it. Their product claims hard enforced limits, an amount cap, a transaction count and an expiry, checked atomically at authorisation, where a single revocation invalidates every credential derived from that mandate. That is a vendor describing its own product, so treat it as a claim rather than a measurement. The design is what interests me, and it is the design I agree with.",
      },
      { type: "h2", text: "Where I would draw the line" },
      {
        type: "p",
        text: "Never the card number, and never a credential whose authority outlives the instruction that justified it. The first is hygiene and should have been true before this year. The second is the actual design problem, and it is the one I have spent the last months on: a purchase of forty euro, authorised at 14:03 by an agent acting for a person, inside a mandate that expires on Friday, recorded in a row that can be read by someone who was not there. Everything outside that is either a card with a limit or a promise.",
      },
      {
        type: "p",
        text: "I have been building this at [Noesia](https://withnoesia.com), where the credential is scoped, expires, and leaves a record. The wider argument is in [the money layer for AI agents](/thoughts/money-layer-for-ai-agents/), the credential question in [what an agent authorization record should contain](/thoughts/what-an-agent-authorization-record-should-contain/), and the budget side in [what it means to give an AI agent a budget](/thoughts/what-it-means-to-give-an-ai-agent-a-budget/). If you have shipped an agent with a card and think the boundary is enough, I would genuinely like to read the argument. The moment it started for me is [the moment my AI agent asked for my credit card](/notes/the-moment-my-ai-agent-asked-for-my-credit-card/).",
      },
    ],
  },
  {
    slug: "what-it-means-to-give-an-ai-agent-a-budget",
    title: "What it means to give an AI agent a budget",
    category: "Thoughts",
    description:
      "An AI agent spending limit is a number, and a number is not a budget. What a real budget has to answer, what people say they would tolerate, and why the tolerance is falling.",
    date: "2026-10-29",
    tags: ["AI agents", "budgets", "payments", "delegation", "Noesia"],
    keywords: [
      "AI agent spending limit",
      "AI agent budget",
      "agent spending policy",
      "delegated authority",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "Every product demo in this category has a slider. The number on the slider is called a budget, and I have come to think the word is doing too much work. **An AI agent spending limit** answers one question, which is how much. A budget answers five, and four of them are about the moment the answer is no.",
      },
      { type: "h2", text: "Five questions a budget has to answer" },
      {
        type: "list",
        items: [
          "**Per transaction.** The largest single purchase the agent may make without asking, in a currency, at a merchant, inside a category.",
          "**In a window.** The cumulative amount over a period that resets, and the number of transactions inside it. This is the limit that actually protects a balance.",
          "**Under what authority.** Which merchant, which category, which kind of action. A budget without a destination is a spending cap for a stranger.",
          "**What happens at the edge.** Allow, deny, or stop and ask. And the rounding case, because 149 is not 150 and someone has to decide before the user finds out.",
          "**When it stops being true.** The date the budget expires, and the condition that kills it earlier. Scoped capabilities that expire, not a standing permission with no end.",
        ],
      },
      {
        type: "p",
        text: "Every one of these exists in somebody's product, and almost no product has all of them. The slider is number one. The other four are the difference between a limit and a boundary.",
      },
      { type: "h2", text: "What people say they would tolerate" },
      {
        type: "p",
        text: "The useful thing about this market is that the numbers are being surveyed while it is still small, and the survey answers are not the numbers the pitch decks assume. Checkout.com ran a study across six markets in June 2026 and found an average delegation tolerance of one hundred and seventy seven pounds per purchase, against a merchant side assumption of two hundred. So the merchants already overestimate by about a tenth. It is a vendor survey and I am treating it as direction, not as truth, but the direction is consistent with everything else.",
      },
      {
        type: "p",
        text: "The same study asked what people would not give up, and the top answer was spend caps at thirty per cent, then instant revocation at twenty nine, then easy cancellation at twenty eight. Read that ordering carefully. Nobody put model quality anywhere near the list. They put **control** first, immediacy second, and an exit third.",
      },
      {
        type: "p",
        text: "Now the harder number. Gartner surveyed 322 United States consumers in May 2026 and found that eleven per cent would let an AI make a purchase decision on their behalf, rising to around thirty one per cent if it only narrows the choice for household supplies. Visa's 2026 Global Digital Shopping Index found that forty eight per cent used AI to research their last purchase while thirty five per cent would grant an agent access to saved payment credentials. There is a twenty point drop between letting a tool help me choose and letting it spend.",
      },
      {
        type: "p",
        text: "And sentiment moved the wrong way in a single quarter. Riskified reported that fifty five per cent of respondents were not comfortable with agents completing purchases, down from seventy per cent in the previous quarter. Twenty year old reasoning says autonomy is about to explode. The surveys say the room is getting colder while the demos are getting better.",
      },
      { type: "h2", text: "Why the number is the easy part" },
      {
        type: "p",
        text: "A budget is a promise about the future made by someone who will not be present. The interesting engineering is not the comparison, it is the bookkeeping around it: concurrent requests that all check the same remaining amount, a retry that looks like a second purchase, a partial refund that has to give the money back to the right window, and a ledger that has to be able to reconstruct the remaining amount a year later without trusting the database that computed it.",
      },
      {
        type: "p",
        text: "That is why my budgets are evaluated in the same transaction that records the decision. If the check and the write are two steps, an agent that retries aggressively can pass the check twice. This is the same race that an external audit found in my authorization endpoint when it checked the budget, wrote the decision, then recorded the idempotency key, in that order and convinced of its own linearity. The budget you can explain on a slider is the easy half. The budget that survives a hundred parallel requests is the one worth having.",
      },
      {
        type: "p",
        text: "Two more cases break naive budget arithmetic, and both are ordinary. A **partial refund** has to return the money to the window it came out of, not to the current one, otherwise a subscription that cancels halfway through the month silently restores spend capacity. And a **currency change** has to be handled at a stated rate and a stated time, because an agent spending euros against a limit written in dollars is either guessing or using a rate that will change tomorrow.",
      },
      {
        type: "p",
        text: "Neither is exotic. Both are the reason I stopped treating a budget as a comparison. A comparison is one line of code. A budget is a small accounting system, and it should be built like one, because the moment someone asks where the remaining two hundred went, the answer has to be reconstructable rather than recalculated.",
      },
      {
        type: "h2",
        text: "What I would write on the boundary, before shipping it",
      },
      {
        type: "p",
        text: "Spend up to four hundred a month at these three suppliers for tools and hosting. Nothing that renews automatically, and nothing I have to cancel. Ask me above a hundred and fifty, in the moment, and I do not have to be awake. It all ends on the last day of the month, and I can pull all of it from my phone in one action. Anything outside that, the agent tells me and stops.",
      },
      {
        type: "p",
        text: "That sentence is five answers to the five questions, it is a sentence a person would actually say, and it is what a policy document should compile into. The engine that evaluates it is in [designing an agent policy engine](/thoughts/designing-an-agent-policy-engine/), the credential question in [an AI agent should never have your credit card](/thoughts/an-ai-agent-should-never-have-your-credit-card/), and the record it leaves in [what an agent authorization record should contain](/thoughts/what-an-agent-authorization-record-should-contain/). I am building it at [Noesia](https://withnoesia.com), and the argument it serves is [the money layer for AI agents](/thoughts/money-layer-for-ai-agents/). The short version of the trust argument is [the agentic economy is a trust problem](/notes/the-agentic-economy-is-a-trust-problem/).",
      },
    ],
  },
  {
    slug: "deterministic-authorization-for-ai-agents",
    title: "Deterministic authorization for AI agents",
    category: "Thoughts",
    description:
      "Deterministic authorization is not the absence of a model. It is a property you can lose in four places, only one of which is intelligence, and a second property that matters more: the decision must be recomputable.",
    date: "2026-11-02",
    tags: [
      "engineering",
      "deterministic authorization",
      "AI agents",
      "ledger",
      "Noesia",
    ],
    keywords: [
      "deterministic authorization",
      "deterministic AI systems",
      "agent idempotency",
      "AI agent permissions",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "Everyone agrees that **deterministic authorization** should mean the same input gets the same answer. That definition is correct and it is half of the requirement. The half people skip is worse: the decision has to stay recomputable for as long as anyone might ask about it. A system that answers consistently but cannot explain itself a year later is deterministic in the way a wall is deterministic.",
      },
      {
        type: "h2",
        text: "The four places an authorization path stops being deterministic",
      },
      {
        type: "p",
        text: "Only the first one is a model, and it is the one everybody argues about.",
      },
      {
        type: "list",
        items: [
          "**The model.** A plausible completion is not a decision. Nobody disagrees with this in a design review and everybody disagrees with it in a launch.",
          "**The clock.** A rule that reads the current time changes its answer at midnight, at a renewal window, at the moment a limit resets. That is not a bug, it is a policy, and it has to be written as one.",
          "**Concurrency.** Two requests that both read a remaining balance of one hundred euro and both allow a ninety euro purchase are deterministic individually and wrong together. The order of operations, not the arithmetic, is the problem.",
          "**External state.** A feature flag, a remote config, a third party call inside the decision path. The moment the answer depends on something outside the boundary, the boundary is not the boundary.",
        ],
      },
      {
        type: "p",
        text: "I lost the third one myself. My authorization endpoint checked the budget, wrote the decision, then recorded the idempotency key. Linear, obviously correct, and a race, because agents retry by nature and two identical requests arriving in the same millisecond both pass the check. An external audit found it. A bootcamp would not have.",
      },
      { type: "h2", text: "The second property: a decision you can replay" },
      {
        type: "p",
        text: "Stability is about the next request. Recomputability is about the one you did six months ago. For an agent payment, that is the whole game, because six months ago is when the dispute arrives, and the person asking is not the person who built the engine.",
      },
      {
        type: "p",
        text: "Three things make a decision recomputable, and all three are cheap if you do them on day one and expensive if you do them later.",
      },
      {
        type: "list",
        items: [
          "**Freeze the policy version in the record.** A rule changed in April cannot explain a purchase from March. The record names the version of the boundary that was in force, not just the outcome.",
          "**Freeze the inputs that produced it.** The mandate, the amount, the merchant, the normalised request. If the record has to read live state to be understood, it will be understood wrong.",
          "**Keep the hash chain.** Each record carries the hash of the previous one, so a deletion or an edit is visible without trusting the database that stored it.",
        ],
      },
      {
        type: "p",
        text: "That third one sounds ceremonial until you meet it. A ledger that can be edited silently is a ledger that will be edited silently, and the person who edits it may not be malicious. They may be a migration, a retention policy, or a support engineer cleaning up a test row.",
      },
      { type: "h2", text: "Idempotency has to be keyed on the intent" },
      {
        type: "p",
        text: "The other half of determinism is the retry. An agent that tries, fails to see a response, and tries again is behaving correctly. If your key is the request, you have two charges. If your key is the intention, you have one decision, one row, and one charge, and the retry returns the original answer.",
      },
      {
        type: "code",
        lang: "text",
        code: "100 concurrent requests, same intent, same idempotency key\n  ledger rows written ...... 1\n  charges created ........... 1\n  decisions returned ........ 100 identical\n\nreplay the recorded decision against the frozen policy\n  recomputed decision ....... identical\n  recomputed hash ........... identical",
      },
      {
        type: "p",
        text: "This runs in the suite on every commit, which is the only reason I use the phrase verified by test about it. Everything else in this article is a design argument, and design arguments get the weaker label.",
      },
      {
        type: "p",
        text: "There is a version of this that sounds like process rather than engineering, and I want to be explicit about it, because it is the part that actually keeps the property. The test suite **is** the specification. If a behaviour is not asserted somewhere, it is not a behaviour, it is a hope, and it will be changed by a well meaning pull request six weeks from now. Every rule in my policy language has a test that says what it does at the boundary, because a rule engine without boundary tests is a rule engine with surprises.",
      },
      {
        type: "p",
        text: "The second half of the discipline is refusing new inputs to the decision path. It is always easier to add a lookup, a call, a flag. Every one of them makes the answer depend on something outside the boundary, and the boundary is what the record reconstructs months later. The rule I follow is that the decision function reads the request, the policy version, and the ledger, and nothing else. It is a constraint that feels arbitrary until the first incident, and then it is the only reason the incident can be explained.",
      },
      { type: "h2", text: "What determinism does not buy you" },
      {
        type: "p",
        text: "A deterministic engine with a wrong policy is wrong faster and more consistently. Determinism does not make the boundary sensible, does not make the agent's choice good, and does not help you if the instruction the agent followed was the wrong instruction. It buys you one thing: when the dispute arrives, there is an answer that is the same answer as last time.",
      },
      {
        type: "p",
        text: "In a category where every product page ends with the same sentence about a better future, that is not a small thing. It is the difference between a claim you can check and one you have to believe.",
      },
      {
        type: "p",
        text: "I am building this at [Noesia](https://withnoesia.com). The reasoning about where the model belongs is in [why there should be no LLM in the authorization path](/thoughts/no-llm-in-the-authorization-path/), the category argument in [the authorization layer for autonomous agents](/thoughts/the-authorization-layer-for-autonomous-agents/), and the record this all serves in [why agent payments need an append-only audit trail](/thoughts/why-agent-payments-need-an-append-only-audit-trail/). If you have a system where you can replay a decision from a year ago, I want to read how you did it, because I have not found another. The retry half of this is [idempotent payments for AI agents](/notes/idempotent-payments-for-ai-agents/).",
      },
    ],
  },
  {
    slug: "the-credit-card-is-the-wrong-interface-for-ai-agents",
    title: "The credit card is the wrong interface for AI agents",
    category: "Thoughts",
    description:
      "AI agent payment infrastructure does not need a better card. It needs a different shape of interface, because every field on the card assumes a human with a device, a session and an OTP.",
    date: "2026-11-05",
    tags: ["AI agents", "payments", "infrastructure", "interfaces", "Noesia"],
    keywords: [
      "AI agent payment infrastructure",
      "AI agent payments",
      "agent payment interface",
      "agentic commerce",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "Take a credit card apart as an interface and count the human assumptions. A sixteen digit number typed by a person. An expiry date read off plastic. A three digit code from a physical card. A redirect to a bank page where a person answers a challenge. An address chosen from a dropdown. **AI agent payment infrastructure** inherits every one of those assumptions, and each of them is a place where an agent stops or lies.",
      },
      { type: "h2", text: "The three steps an agent cannot take" },
      {
        type: "list",
        items: [
          "**Reading a code from a message.** Strong customer authentication is designed around a human who can receive and type a one time password. An agent can neither receive it nor ask a user to type it without becoming an inbox. Where this has to work, the answer is issuer configured: the issuer decides whether the transaction gets a challenge, a re-route, or neither, and that decision lives on their side, not in the agent's.",
          "**Answering a challenge.** Mastercard's description of agent payments mentions strong customer authentication leveraging on device biometrics. Visa's developer documentation describes tokens bound to user devices, secured with passkeys, with every user instruction authenticated. Both assume a person who is present and holding something.",
          "**Choosing from a form.** An address, a shipping option, a saved cart. Every one is a dropdown, and every dropdown is a point where the agent has to guess or ask, and asking is the thing we are trying to stop doing.",
        ],
      },
      {
        type: "p",
        text: "None of this is an argument against the card. For a person buying something, this interface is thirty years of optimisation and it works. The argument is narrower: an agent cannot use it as designed, so the parts of the flow that have to be automated end up being automated by pretending there is a person.",
      },
      { type: "h2", text: "What is being built instead" },
      {
        type: "p",
        text: "The direction is visible in the primary documents, and it is the same direction every time: bind the credential to something other than the account. Visa describes agent specific pass through payment tokens, bound to the agent making the purchase. Stripe documents a Shared Payment Token as a credential bound to a mandate rather than to a card number. Reap publishes a credential minted at the moment a payment intent is created, capped to the approved amount and restricted to the merchant, with the claim that it needs no one time password, no phone tap and no human.",
      },
      {
        type: "p",
        text: "Google's protocol work is the clearest statement of the shape. The payment mandate in the Agent Payments Protocol authorises a payment against a specific instrument and is shared with the credential provider, the networks and the merchant payment processor. That is an interface contract between four parties, written down before the transaction, which is the opposite of what a card number is.",
      },
      {
        type: "p",
        text: "It is worth noticing how unsettled this area still is. Visa's own developer page for these services says the product is in the process of development and deployment, that the depictions are representations of potential features, and that the final version may not contain all of the features described. A solutions page adds that it is a representation of the potential features of the fully deployed product. Nobody in this category can tell you what the final interface is, including the people building it.",
      },
      { type: "h2", text: "The interface should carry intent, not instrument" },
      {
        type: "p",
        text: "Here is the distinction I keep testing my own designs against. A card interface asks which instrument to charge. An agent interface asks what was authorised. The instrument is then chosen, in the last possible moment, by something that can change without breaking anybody's expectations, which is exactly the property you want from a layer that has to survive a change of provider.",
      },
      {
        type: "p",
        text: "Concretely, the request that crosses the boundary should say: this agent, acting for this principal, under this mandate version, is asking to pay this merchant this amount for this purpose, and here is the evidence that the instruction existed. Everything else, which credential, which rail, which token, which network, is an implementation detail below that line. Every product in this category that puts the instrument in the request and the intent somewhere else is going to rewrite the request the first time a provider changes.",
      },
      {
        type: "p",
        text: "A working version of this interface looks like four agreements instead of one form. The agent presents an authorisation, signed, with a mandate reference and an amount and a merchant. The merchant accepts an authorisation and gets a promise of settlement. The issuer honours a token that carries the authorisation inside it. The processor moves money and returns a reference that lands back in the same record. Four parties, one object, and no step where a person's attention is required to translate between them.",
      },
      {
        type: "p",
        text: "The reason this is hard is not the cryptography. Every piece of it exists in production somewhere. The hard part is that it requires four companies to agree, and the only reason they will agree is if one of them is unwilling to do the work alone. That is the entire commercial strategy of this category, and it explains why the interesting companies are the ones building a mandate rather than a checkout.",
      },
      { type: "h2", text: "The part I am still arguing about" },
      {
        type: "p",
        text: "There is a version of this argument that becomes an argument for rebuilding payments, and I do not support it. The rails are excellent, the tokenisation is excellent, and the failure above the card is a failure of authority, not of pipes. The right amount of work is a layer that reads like a mandate and settles like a card, not a new network. Two of the mandate layer companies I have written about publicly make the same bet from opposite directions: one mints a licensed card credential per payment intent, the other refuses to be a processor at all and sells the mandate instead.",
      },
      {
        type: "p",
        text: "I am building the middle of that at [Noesia](https://withnoesia.com): not a network, not a licence, an authorization layer that an existing processor can sit behind. The credential argument is in [an AI agent should never have your credit card](/thoughts/an-ai-agent-should-never-have-your-credit-card/), the record that makes the interface auditable in [what an agent authorization record should contain](/thoughts/what-an-agent-authorization-record-should-contain/), and the wider case in [the money layer for AI agents](/thoughts/money-layer-for-ai-agents/). If you have built the interface the other way and it works, write to me. That is the argument I want. The moment it started for me is [the moment my AI agent asked for my credit card](/notes/the-moment-my-ai-agent-asked-for-my-credit-card/).",
      },
    ],
  },
  {
    slug: "what-an-agent-authorization-record-should-contain",
    title: "What an agent authorization record should contain",
    category: "Thoughts",
    description:
      "An AI agent transaction receipt is not a payment confirmation. It is the answer to four questions asked months later by someone who was not there, and a payments lawyer has already said which evidence wins.",
    date: "2026-11-09",
    tags: ["AI agents", "audit", "receipts", "disputes", "Noesia"],
    keywords: [
      "AI agent transaction receipt",
      "agent authorization record",
      "AI agent audit",
      "evidence in disputes",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "A payment receipt tells you money moved. **An AI agent transaction receipt** has to tell you something much harder: whether it should have. Those are different products and only one of them is what a card terminal prints.",
      },
      { type: "h2", text: "The question that decides the dispute" },
      {
        type: "p",
        text: "A payments practice published a five part series between April and May 2026 on what happens when an AI purchase goes wrong. Two sentences from it shaped how I build this. The first: **operational logs are not sufficient, evidence quality records are.** The second: the party with the better record will not merely win, it will control how the dispute is framed, which category it lands in, and whether the fight reaches a court at all.",
      },
      {
        type: "p",
        text: "That is the whole commercial argument for a record, and it is stronger than anything I could invent. If the quality of the record decides the framing, then the record is not documentation. It is the product's position in a room it will be dragged into later.",
      },
      {
        type: "h2",
        text: "The four questions, and the fields that answer them",
      },
      {
        type: "p",
        text: "They will ask: who acted, what were they allowed to do, what did they actually do, and what happened next. Every field below exists to answer one of those without going back to a log.",
      },
      {
        type: "list",
        items: [
          "**The principal.** The person or company the money belongs to, identified by something more durable than an account. `who`",
          "**The agent.** The identity that acted, and the deployment it belongs to. Not a session token. `what`",
          "**The mandate.** Its version, its scope, its expiry, and a reference to the instruction the user wrote when they granted it. `under which authority`",
          "**The proposed action.** What was asked for, normalised before evaluation, so the record shows the request that was judged and not a summary written afterwards. `what was requested`",
          "**The decision.** Allow, deny or escalate, with the rule that produced it, named by version. `what was decided`",
          "**The evaluation.** The conditions that held at the moment of the decision: amount after the running total, count inside the window, price unchanged from the quote, clock. `what was true when it decided`",
          "**The chain.** The hash of this record and the hash before it. `what came before`",
          "**The consequence.** The charge, the refusal, the confirmation that followed, and the time it took. `what happened next`",
        ],
      },
      {
        type: "p",
        text: "Notice that four of those eight are about state at the instant of the decision, not about the outcome. The most common mistake in this area is recording that a purchase was allowed. The useful record says what the boundary was, what the running total was, and which rule turned those two into an answer.",
      },
      {
        type: "p",
        text: "One more structural point, which is the difference between an audit trail and a receipt archive. A receipt archive is written for one reader at one moment. An audit trail is written for a reader who arrives later with a different question, and often with adversarial intent. That means the same row has to serve a user who wants a friendly sentence on a phone and a lawyer who wants the raw decision, the rule, and the state. I build the friendly sentence from the row rather than storing it separately, so the two can never disagree.",
      },
      { type: "h2", text: "Retention is not a detail" },
      {
        type: "p",
        text: "Card networks already set the floor. Visa's Acceptance Risk Standards require acquirers to investigate and retain dispute investigation details, including the event description and analysis, for a minimum of two years. Two years is the minimum for a human initiated transaction in a closed loop. Agent initiated transactions generate disputes about what an agent was told, so the window in which that question can be asked has to be at least as long, and the record has to survive export.",
      },
      {
        type: "p",
        text: "My ledger is append only for exactly this reason. Rows are hashed into each other at write time. Nothing rewrites history; corrections are new rows that reference the row they correct. Deletion is not available as an operation on a decision, and when retention requires removal, it removes the payload and leaves the chain intact, so a reader can see that something was removed and when.",
      },
      {
        type: "p",
        text: "It is worth being concrete about who reads this, because the four readers want different things and the format has to serve all of them. The **user** wants to know what the agent bought and why, in one sentence, on a phone. The **support team** wants the decision, the rule, and the state at the time. The **auditor** wants the chain and the ability to recompute. The **regulator** wants all three plus the identity of the principal, in a form that does not depend on our database being online.",
      },
      {
        type: "p",
        text: "The second structural point is that there are two events and one row. An authorization decision and the charge that follows it are not the same fact. They happen at different times, they can diverge, and when they do the divergence is the interesting part. So the row records the decision, and the consequence is either in that row or in a row that points at it, and a reconciler compares the two series. A record that only logs successful charges cannot answer the question a dispute actually asks, which is what was attempted and refused.",
      },
      { type: "h2", text: "Denials are records too" },
      {
        type: "p",
        text: "This is the design choice I would defend in a code review. A denied authorization leaves the same row as an allowed one, with the same fields, because the denial is often the more interesting document three months later. It shows what the agent was trying to do, what the boundary was at the time, and how close it came. Systems that discard denials are discarding the only free early warning they will ever get about a bad instruction.",
      },
      {
        type: "p",
        text: "One vendor's documentation puts the intent neatly: the audit trail exists before the dispute does. That is a product claim about their own system, but the sentence is the right one, and it is the standard I measure myself against.",
      },
      {
        type: "p",
        text: "I am building this at [Noesia](https://withnoesia.com). The property that makes it recomputable is in [deterministic authorization for AI agents](/thoughts/deterministic-authorization-for-ai-agents/), the reason it has to be tamper evident rather than tamper proof is in [why agent payments need an append-only audit trail](/thoughts/why-agent-payments-need-an-append-only-audit-trail/), and the commercial consequence is in [who is responsible when an AI agent buys the wrong thing](/thoughts/who-is-responsible-when-an-ai-agent-buys-the-wrong-thing/). If you have been in a dispute where the logs were not enough, I would like to hear what was missing. What an external audit found in mine is [what a security audit taught me](/notes/what-a-security-audit-taught-me/).",
      },
    ],
  },
  {
    slug: "least-privilege-for-ai-agents",
    title: "Least privilege for AI agents",
    category: "Thoughts",
    description:
      "Least privilege for AI agents means the agent gets the narrowest useful authority, not the narrowest authority. The traditional model was built for people and roles, and it does not transfer.",
    date: "2026-11-12",
    tags: ["AI agents", "security", "permissions", "engineering", "Noesia"],
    keywords: [
      "least privilege AI agents",
      "AI agent permissions",
      "agent least privilege",
      "scoped capabilities that expire",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "Every engineer who has worked on permissions knows the phrase **least privilege**. Applied to an agent it is almost always applied wrongly, and the reason is that the model we inherited was built for people joining a company and inheriting a role. An agent does not join a company. It gets a task.",
      },
      { type: "h2", text: "Why the role model does not transfer" },
      {
        type: "list",
        items: [
          "**Roles are long.** A person in a finance team keeps permissions for years, and each year the role is reviewed. An agent's authority should last for the length of one task and then expire.",
          "**Roles are broad.** The finance role can do most finance things because the human behind it accumulates judgement over time. An agent has no accumulation. Its judgement is whatever the model produces this second.",
          "**Roles are attributed to a person.** Every access log ends at a human. An agent's action has to end at an identity that is not a person, or the log is a false account.",
          "**Roles are reviewed by a human who knows the person.** Nobody knows what an agent was doing at 3am last Tuesday, so the review has to come from the record instead of from familiarity.",
        ],
      },
      {
        type: "p",
        text: "Give an agent a role and you get the worst of both worlds: broad authority with a weak justification. I would rather it have no standing authority at all and a scoped capability that expires when the task ends.",
      },
      { type: "h2", text: "The unit of delegation is a task" },
      {
        type: "p",
        text: "The authorisation should be written per task, in the language of the task, and it should be derived from a standing mandate rather than replacing it. A standing mandate is the small, signed document a person grants: an amount, a period, recipients, categories. A task authorisation is one use of that mandate, and it dies when the task is done.",
      },
      {
        type: "p",
        text: "This gives the two properties I actually want. Revocation becomes trivial, because revoking the mandate kills every task authorisation derived from it. And the record becomes readable, because each row names the task, and a reader can reconstruct the whole run by reading the tasks in order.",
      },
      {
        type: "p",
        text: "There is a real design detail in here that I learned from reading someone else's protocol rather than from a principle. Google's payment protocol recommends setting the expiry on an autonomous mandate to the smallest value that will let the task complete. Smallest, not convenient. If the task needs four hours, the capability lives four hours, and then it is gone.",
      },
      {
        type: "p",
        text: "There is one place where least privilege stops being an infrastructure question and becomes a product one, and it is the interaction with the model. The model decides what to propose, and the more capable the model, the more it will propose outside the shape you anticipated. Narrowing the authority is therefore not a way to compensate for a weak planner, it is a way to bound what a strong planner can do to you. The tighter the boundary, the less the planner's ambition matters, and that inversion is worth sitting with: in this category, capability and safety are not the same axis.",
      },
      { type: "h2", text: "The narrowest useful authority" },
      {
        type: "p",
        text: "The second half of least privilege is that the authority must still be useful. Over restriction is the failure mode people do not talk about, because it looks like safety. An agent authorised to spend only at one merchant and only up to five euro is safe and useless, and the user's response is to widen it manually, at the moment they are busiest, which is how you end up back at the shared card.",
      },
      {
        type: "p",
        text: "The way I set the boundary is to write it as a sentence the user would recognise as their own intention, then let the engine find the narrowest version of that sentence that the task actually needs. Not narrower than the sentence. Narrower than the task.",
      },
      {
        type: "h2",
        text: "The four questions I ask before shipping a permission",
      },
      {
        type: "list",
        items: [
          "Does this authority outlive the task? If yes, it is too broad, whatever the amount says.",
          "Could the same result be reached with a smaller capability? A single merchant is smaller than a category. A cap on this order is smaller than a monthly cap.",
          "If this leaked into a public log, would it read as something the principal would recognise?",
          "Does it expire on its own? A permission that survives until someone revokes it is a standing permission wearing a task's clothes.",
        ],
      },
      {
        type: "p",
        text: "The third question is the one that catches me. If the row in the log would surprise the person it belongs to, the permission is wrong, no matter how small the amount is. Surprise is the signal. An amount is just a number.",
      },
      {
        type: "p",
        text: "The same principle has a version in the infrastructure, and it is the one I would copy into any agent system. No long lived shared secret that an agent can hold for weeks. A task authorisation produces a credential with the narrowest scope the task needs and an expiry that matches the task, and the credential dies with the task. Revocation stops being an operation that has to reach every component, because there is no component holding anything to revoke. This is the least privilege argument made in a language engineers already accept, which is the only language it survives in.",
      },
      {
        type: "p",
        text: "It also makes the record cleaner. When every credential is short lived and named after the task that produced it, the audit trail stops being a reconstruction and becomes a by product. You do not go looking for what the agent was allowed to do, because the thing that let it do anything is in the same row as the thing it did.",
      },
      { type: "h2", text: "Why this is the boring part of the product" },
      {
        type: "p",
        text: "Nobody demos least privilege, because the demo of least privilege is an agent correctly not doing something, and that is a hard thing to put on a landing page. It is also the feature that decides whether the other features are safe to switch on. I have spent this year on a system whose most important behaviour is refusing, and I am not going to pretend that is exciting. It is the reason the exciting parts are allowed.",
      },
      {
        type: "p",
        text: "I am building it at [Noesia](https://withnoesia.com). The mandate layer that the task authorisations derive from is in [what should an AI agent be allowed to do](/thoughts/what-should-an-ai-agent-be-allowed-to-do/), the credential that carries the scope is in [an AI agent should never have your credit card](/thoughts/an-ai-agent-should-never-have-your-credit-card/), and the mechanics are in [designing an agent policy engine](/thoughts/designing-an-agent-policy-engine/). Why I think the boring version wins is [on boring systems](/notes/on-boring-systems/).",
      },
    ],
  },
  {
    slug: "why-agent-payments-need-an-append-only-audit-trail",
    title: "Why agent payments need an append-only audit trail",
    category: "Thoughts",
    description:
      "An AI agent audit trail has to be checkable by someone who does not trust you. That makes it tamper evident rather than tamper proof, and it is a different product from a log.",
    date: "2026-11-16",
    tags: ["engineering", "audit", "AI agents", "ledger", "Noesia"],
    keywords: [
      "AI agent audit",
      "append-only audit trail",
      "agent payment audit",
      "tamper evident ledger",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "An **AI agent audit trail** has one job that a log cannot do: let a party who does not trust you check it. That single requirement changes the design, because a log is written for the operator and an audit trail is written for a stranger.",
      },
      { type: "h2", text: "Tamper evident, not tamper proof" },
      {
        type: "p",
        text: "Google and Mastercard have been co developing a standard called Verifiable Intent, described as a tamper proof log of user authorised agent actions, and both donated their work to the FIDO Alliance in 2026. The phrase is doing a lot of work. Nothing in software is tamper proof. A database administrator can drop a table. An operator can edit a row. A migration can rewrite a partition. The honest engineering claim is narrower and stronger: **tamper evident**, meaning the evidence of an edit is detectable by anyone holding the chain.",
      },
      {
        type: "p",
        text: "That is the standard I hold myself to. Each record carries the hash of the record before it. Change one row in the middle and every hash after it no longer matches. You do not need to prevent the edit to get value from it, you need the edit to be impossible to hide from someone who was not part of it.",
      },
      { type: "h2", text: "Why append only, specifically" },
      {
        type: "p",
        text: "Because the alternative is a history that can be revised, and a revised history cannot answer a question about what was true at the time. Append only is not a moral preference, it is the only structure that lets a record keep meaning after the facts around it have moved on. A correction is a new row that references the row it corrects. The old row stays, with the same hash it had, and the reader sees both.",
      },
      {
        type: "p",
        text: "The payment networks already require something in this direction. Visa's Acceptance Risk Standards oblige acquirers to retain dispute investigation detail for a minimum of two years, including the event description and analysis. Two years of retained investigation means two years during which somebody may ask what the system knew. An append only structure is what makes that answer possible.",
      },
      { type: "h2", text: "What the audit trail is actually for" },
      {
        type: "list",
        items: [
          "**Disputes.** The clearest writing on this comes from a payments law firm: the party with the better record does not merely win, it controls the framing and whether the fight reaches a court.",
          "**Reconciliation.** Every decision has to tie to a real charge or a real refusal, and the mismatch has to be findable by comparing two systems rather than one.",
          "**Errors.** A bad instruction produces a pattern across rows long before it produces a complaint. Append only is what lets you query the past at all.",
          "**Obligation.** If a regulator asks who authorised a payment, the answer should not require your cooperation to produce.",
        ],
      },
      {
        type: "p",
        text: "The fourth is the one that changes how you build. If the regulator is a plausible future reader, then the record is not an internal artefact and the chain has to survive export. A trail that only exists in your database is a log with extra steps.",
      },
      {
        type: "p",
        text: "The verification is a procedure, and it should be written down as one, because a property nobody can check is a slogan. Take any row. Recompute its hash from the fields it claims to contain, including the hash of the previous row. Compare it with the stored hash. Then walk the chain backwards from the newest row and confirm every link. Three steps, no access required beyond the export, no permission from us. That is the test I would want a third party to run against me, which is why I publish the chain in a form that can be exported without asking.",
      },
      {
        type: "p",
        text: "The same procedure runs in the suite on every commit, so a change that breaks the chain fails the build rather than a customer's dispute. That is the only sense in which I would use the phrase verified by test, and it is deliberately a small sense. It does not mean the ledger cannot be wrong. It means a specific, checkable property holds, and I can tell you exactly which one.",
      },
      { type: "h2", text: "The part that is hard: deletion" },
      {
        type: "p",
        text: "European data protection law gives people a right to erasure, and append only looks like its opposite. The resolution is to separate the payload from the chain. The row keeps its position, its timestamp, its hash and its links. The personal payload is removed. A reader sees that a row existed, that it was redacted, when, and under what instruction. The chain stays intact and the history stays honest.",
      },
      {
        type: "p",
        text: "I would rather have that argument with a regulator than have a silent gap in a chain. A gap is indistinguishable from tampering to exactly the person who is looking for tampering.",
      },
      { type: "h2", text: "What I got wrong, and what the audit found" },
      {
        type: "p",
        text: "I commissioned an external audit of the money path earlier this year, and one of the findings was a ledger that could lie to itself: a read path that trusted a cached total instead of recomputing from the entries, which meant a bug in the cache would produce a number that looked authoritative and was not. The fix was unglamorous. The read path recomputes, or it says it does not know. An audit trail that can be wrong in a way nobody can detect is not an audit trail, it is a source of confidence.",
      },
      {
        type: "p",
        text: "So the claims I make about this are narrow on purpose. The chain is verifiable, and the verification is a procedure anyone can repeat. That is not the same as saying the record is perfect, and I would rather make the smaller claim.",
      },
      {
        type: "p",
        text: "I am building it at [Noesia](https://withnoesia.com). The fields that go into each row are in [what an agent authorization record should contain](/thoughts/what-an-agent-authorization-record-should-contain/), the property that makes the chain recomputable is in [deterministic authorization for AI agents](/thoughts/deterministic-authorization-for-ai-agents/), and the reason the dispute is the forcing function is in [who is responsible when an AI agent buys the wrong thing](/thoughts/who-is-responsible-when-an-ai-agent-buys-the-wrong-thing/). What an external audit found in my ledger is [what a security audit taught me](/notes/what-a-security-audit-taught-me/).",
      },
    ],
  },
  {
    slug: "the-difference-between-an-ai-assistant-and-an-autonomous-agent",
    title: "The difference between an AI assistant and an autonomous agent",
    category: "Thoughts",
    description:
      "AI assistant vs autonomous agent is not a question about capability. It is a question about who is present when the irreversible thing happens, and you can answer it in one sentence by pulling the network.",
    date: "2026-11-19",
    tags: ["AI agents", "autonomous agents", "thinking", "checkout", "Noesia"],
    keywords: [
      "AI assistant vs autonomous agent",
      "autonomous AI agents",
      "AI agents that act",
      "agentic commerce",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "Most of the argument about **AI assistant vs autonomous agent** is conducted with adjectives. I want to replace it with one sentence: an assistant stops when the human is absent, an agent does not. Everything else follows from that.",
      },
      { type: "h2", text: "The sentence, applied to things that shipped" },
      {
        type: "p",
        text: "Google's buying surface, launched in January 2026, is the clearest example. The agent builds the cart, negotiates, fills in what it can, and then the documentation says the user interacts only with the interface to submit the order, with the agent not involved in that part. Single item, human at the end. That is an assistant, and it is a very good one, and it is shipping at enormous scale.",
      },
      {
        type: "p",
        text: "OpenAI's Instant Checkout, announced in September 2025, is described the same way: users explicitly confirm each step, payment tokens are authorised only for specific amounts and specific merchants, and the merchant still accepts or declines. Also an assistant. Notably, the announcement said single item purchases only, with multi item carts to follow, which is a detail that tells you the hard part was the last step, not the first one.",
      },
      {
        type: "p",
        text: "Google's Agent Payments Protocol, in the version donated to the FIDO Alliance in April 2026, added something the buying surface does not yet use. It calls it Human Not Present payments: the agent executes autonomously on the basis of pre authorised user instructions. That is the definition of the other thing. It is also, notably, a protocol feature rather than a checkout feature, from the same company, in the same year.",
      },
      {
        type: "p",
        text: "I find that pairing more interesting than any forecast. The protocol and the buying surface are the same organisation. One of them puts the human back in at the moment of payment to ensure determinism. The other specifies fully delegated payment. The industry is shipping the capability faster than it is willing to use it, and the reason is written in their own documentation.",
      },
      { type: "h2", text: "The test: pull the network" },
      {
        type: "p",
        text: "If the user is asleep, an assistant does nothing and the morning contains a notification. An agent does the permitted thing and the morning contains a record. You do not need a definition from anyone. Break the connection at the moment of the purchase and see what the system does with the pending request.",
      },
      {
        type: "p",
        text: "I have been on both sides of this. My own prototype currently stops and asks: an order came back as a request to confirm at 163 euro, and it left at 137 after I intervened. That is an assistant, and I label it as one. The version I am building is the one where the request does not stop, and the honest thing about writing this piece is that the difference between the two is not intelligence. It is a document I write before the run.",
      },
      {
        type: "p",
        text: "The word is doing marketing work, and I would like to name how. Autonomous is used as a synonym for impressive, the way a product that asks permission on every step can still call itself autonomous because it plans the steps itself. Once you separate the two claims, most of the category resolves into something much more ordinary: an agent with a good planner and a strict rule about when to ask. That is a good product. It is not the thing the word is selling.",
      },
      { type: "h2", text: "Why the distinction is economic, not semantic" },
      {
        type: "list",
        items: [
          "**Assistants scale with human attention.** Every delegated action consumes a minute of someone's time, so the ceiling on autonomy is the user's calendar.",
          "**Agents scale with the quality of the boundary.** If the boundary is written, signed and narrow, the number of actions a user can delegate is limited by how much they trust the boundary, not by how often they can click.",
          "**Assistants need a good model.** Agents need a good record. The scarce resource changes, and it is not the one the industry is optimising.",
        ],
      },
      {
        type: "p",
        text: "This is why the same product can be an assistant on Monday and an agent on Tuesday. Nothing about the intelligence changed. What changed is that a person sat down and decided what the agent may do without them. The transition is not technical. It is a document, and it happens at a desk.",
      },
      {
        type: "p",
        text: "You can also tell from the outside, without reading the code, by looking for three things a serious implementation has and a demo does not. A **policy** the user can read before they grant anything, in language they wrote or approved. A **revocation** control that is described in terms of what happens to pending requests, not only to future ones. And a **receipt that explains the reason**, not just the amount. A product with none of the three is asking for trust it has not built the record to earn, whatever its marketing says about being autonomous.",
      },
      {
        type: "p",
        text: "None of this is a compliment to the assistants. A confirmation step is a legitimate product and for a lot of purchases it is the correct one. My argument is only about where the line gets drawn and who draws it, because the current market has an odd habit of describing the assistant as the agent and charging for the difference in vocabulary.",
      },
      { type: "h2", text: "The uncomfortable middle" },
      {
        type: "p",
        text: "Most systems marketed as autonomous are assistants with better marketing, and the evidence is always the same: look at what happens at the boundary. If every action can be turned into a confirmation, it is an assistant. If some actions can be turned off and others cannot, then there is a boundary in the product and the product is worth having, whatever it calls itself.",
      },
      {
        type: "p",
        text: "So the useful question for anyone evaluating one of these is not whether the agent can act. It is: which actions did you decide are safe without me, and who signed that decision. The answer, when it exists, is the real product. The rest is a demo.",
      },
      {
        type: "p",
        text: "I am building the agent side of that line at [Noesia](https://withnoesia.com). The document on the desk is [what should an AI agent be allowed to do](/thoughts/what-should-an-ai-agent-be-allowed-to-do/), why the payment step is where assistants stop is in [why AI agents keep stopping at checkout](/thoughts/why-ai-agents-keep-stopping-at-checkout/), and the record that proves it acted rather than asked is in [what an agent authorization record should contain](/thoughts/what-an-agent-authorization-record-should-contain/). The short version of the trust argument is [the agentic economy is a trust problem](/notes/the-agentic-economy-is-a-trust-problem/).",
      },
    ],
  },
  {
    slug: "designing-an-agent-policy-engine",
    title: "Designing an agent policy engine",
    category: "Thoughts",
    description:
      "An agent policy engine is a compiler and a ledger, not a settings screen. Five design decisions that decide whether it can explain itself six months later, and one that decides whether it can be trusted at all.",
    date: "2026-11-23",
    tags: ["engineering", "policy", "AI agents", "authorization", "Noesia"],
    keywords: [
      "agent policy engine",
      "AI agent spending policy",
      "policy as code",
      "AI agent controls",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "Most **agent policy engine** designs I read are settings screens with a database behind them. A screen collects a number, the database stores it, and something in the middle compares the number to the number in the request. That is not a policy engine. It is a threshold with a user interface, and it will work until the first time somebody has to explain a decision.",
      },
      { type: "h2", text: "What the engine actually has to do" },
      {
        type: "list",
        items: [
          "Compile a document a person wrote into something a machine can evaluate, without changing what they meant.",
          "Evaluate one proposed action against that document, atomically with the record of the evaluation.",
          "Answer the question why, for every decision, months later, in language a non engineer can check.",
          "Refuse cleanly when it does not understand, including when the document is malformed, the clock is wrong, or a dependency is down.",
          "Let the document change over time without rewriting the past.",
        ],
      },
      {
        type: "p",
        text: "Only the third of those is where the design fights happen. Everything else is engineering. The ability to answer why is what forces the shape of everything else.",
      },
      { type: "h2", text: "The five decisions" },
      {
        type: "p",
        text: "**One: the language has no escape hatch.** A rule cannot call a remote service, cannot read the clock unless the clock is passed in as part of the request, and cannot contain an arbitrary expression evaluated at decision time. The moment you allow one, determinism is gone, and the record can no longer be recomputed. My policy language is a small declarative structure on purpose. It is less powerful than a scripting language and it is the reason the why is always answerable.",
      },
      {
        type: "p",
        text: "**Two: unknown means denied.** If the request does not parse, if the mandate version is missing, if the amount is not a number, if the merchant is not identified, the answer is deny. Fail closed is unfashionable because it produces support tickets, and I would take the tickets. An engine that fails open is an engine whose worst day is its quietest.",
      },
      {
        type: "p",
        text: "**Three: policies are immutable once used.** A version that has been evaluated against a live decision is never edited. Changing a policy creates a new version with an effective date, and the record names the version it was judged against. Retroactive change is how an audit trail becomes fiction, and it is always done with a good reason by someone who has not thought about the reason yet.",
      },
      {
        type: "p",
        text: "**Four: simulate before you ship a rule.** Every candidate version runs against a sample of past decisions in dry run, and the output is a diff: which past requests would now allow, which would now deny, which would now escalate. This is the cheapest safety tool I know of and almost nobody builds it, because the happy path of a policy engine is a number that goes down and nobody celebrates a number that goes down.",
      },
      {
        type: "p",
        text: "**Five: the engine is not allowed to learn.** Not from behaviour, not from outcomes, not from the shape of the requests. A policy that adapts is a policy nobody signed. Some products in this category infer what you will allow and ask afterwards, which is a reasonable product, and it is a different one from the one described in the paragraph above. Mine asks first.",
      },
      { type: "h2", text: "Where the user's sentence goes" },
      {
        type: "p",
        text: "The user should write the boundary in their own words and the system should compile it. This is the part of the design I feel most strongly about, because it decides whether the record will mean anything. If the boundary is expressed in the system's vocabulary, the user is approving a translation they cannot check. If it is expressed in theirs, the compiled document and the sentence can sit next to each other in the record, and a reader months later can compare the two.",
      },
      {
        type: "p",
        text: "The test is recognition, not comprehension. The user does not need to understand the document. They need to recognise it as the thing they meant, which is a much lower bar and the only one that scales to people who will never read a policy language.",
      },
      {
        type: "p",
        text: "**What I would not build.** A user interface first. The temptation is to collect the settings, because settings are easy to demo and easy to sell, and the engine is downstream of them. The result is an engine that can only express what the interface could think of, and every new capability becomes an interface change rather than a rule change. I built the decision function and the record first and treated the interface as a compiler front end for a language that already existed. It is less comfortable to demo and much cheaper to extend.",
      },
      {
        type: "p",
        text: "**A marketplace of rules, or anything that learns.** Both appeared on my list of tempting ideas and both are out. Rules that arrive from outside the trust boundary are code that runs inside a decision about money, and rules that adapt are rules nobody signed. If the boundary is wrong, the user has to be able to read it, argue with it, and replace it, and that only works if it is short, local and stable.",
      },
      {
        type: "p",
        text: "**The error messages.** This is the unglamorous part that I would defend hardest in a design review. When a policy document fails to compile, the message should say which line, which field, and what was expected, in the user's vocabulary rather than the parser's. A boundary the user cannot fix themselves is a boundary that will be abandoned, and an abandoned boundary is worse than a strict one because it stays in place with nobody reading it.",
      },
      { type: "h2", text: "What it costs to run" },
      {
        type: "p",
        text: "Less than people expect. A decision is a handful of comparisons against a compiled structure, and the expensive part is not the evaluation, it is the record write, because the chain has to be serialised. That is also the constraint that makes concurrency correct: one writer for the chain means the budget check and the decision row are in the same transaction, and the race I found with an external auditor stops being possible rather than being handled.",
      },
      {
        type: "p",
        text: "I am building this at [Noesia](https://withnoesia.com). What the document contains is in [what should an AI agent be allowed to do](/thoughts/what-should-an-ai-agent-be-allowed-to-do/), the property that makes the evaluation replayable is in [deterministic authorization for AI agents](/thoughts/deterministic-authorization-for-ai-agents/), and the why that the engine is built around is in [what an agent authorization record should contain](/thoughts/what-an-agent-authorization-record-should-contain/). If you have built one of these and made different calls, particularly on learning and on dry run, I would like to read the argument. Why I care about the boring version is [on boring systems](/notes/on-boring-systems/).",
      },
    ],
  },
  {
    slug: "the-moment-ai-agents-stop-being-assistants",
    title: "The moment AI agents stop being assistants",
    category: "Thoughts",
    description:
      "Autonomous agents do not arrive on a date. The moment is a threshold, and three things have to be true at once: a boundary exists, the user is absent, and the outcome arrives as a record instead of a request.",
    date: "2026-11-26",
    tags: [
      "AI agents",
      "autonomous agents",
      "thinking",
      "delegation",
      "Noesia",
    ],
    keywords: [
      "autonomous agents",
      "AI agents",
      "agentic AI",
      "delegated authority",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "I am not going to tell you the date. Forecasts in this category are worth less than the shipping logs, and the shipping logs are ambiguous in an interesting way. What I can do is describe the threshold, because knowing what it looks like is more useful than a quarter that will be wrong.",
      },
      { type: "h2", text: "Three things have to be true at once" },
      {
        type: "list",
        items: [
          "**A boundary exists.** Not a limit, a document. Something the user wrote or approved, in their own words, that says what the agent may do without them.",
          "**The user is absent.** Not distracted. Absent, in the way you are absent from a process you trust to run. This is the part that makes it autonomy rather than delegation.",
          "**The outcome arrives as a record.** Not a request to approve. A receipt that says what happened, which rule was in force, and what it cost.",
        ],
      },
      {
        type: "p",
        text: "Any two of the three and you have something else. Two without a boundary is an assistant with a fast loop. A boundary and an absence without a record is a risk with good marketing. A boundary and a record without an absence is an approval flow. All three, once, for one purchase, and the user does not intervene. That is the moment.",
      },
      {
        type: "h2",
        text: "The rails are already there, and they are shipping in order",
      },
      {
        type: "p",
        text: "Visa Intelligent Commerce in April 2025. Mastercard Agent Pay in April 2025. Google's Agent Payments Protocol in September 2025, donated to a standards body in April 2026. OpenAI's Agentic Commerce Protocol in September 2025, built with Stripe and opened. Stripe's Agentic Commerce Suite in December 2025. Google Universal Commerce in January 2026. Mastercard Agent Pay for Machines in June 2026, with authorization rules and spending limits described as programmatically enforced.",
      },
      {
        type: "p",
        text: "Every one of those is real and every one of them is a piece of the third condition. What none of them is, on its own, is the first condition applied to a person rather than to a company. The standards are written for institutions that can afford counsel. A boundary for a person has to be writable without a lawyer, which is a design problem, not a legal one, and it is the one I spend my time on.",
      },
      {
        type: "p",
        text: "One detail in the rollout is worth keeping. OpenAI's Instant Checkout announcement described single item purchases only, with multi item carts to follow, and said over a million Shopify merchants were coming soon. That page is from September 2025. Whether the rollout state has changed is exactly the kind of figure that has to be re checked rather than copied, and I would rather flag the date than repeat the number as if it were current.",
      },
      {
        type: "p",
        text: "There is a second moment after that, and it is the one that decides whether any of this works. The first delegation happens while the user is watching, more or less, in the way you watch a new employee make their first purchase. The real moment is the first time they are not watching at all: a week away, the mandate in place, nothing to do. If the record is good, that week is boring. If it is not, the user comes back to a problem they cannot reconstruct, and the boundary gets narrowed rather than widened, permanently.",
      },
      {
        type: "p",
        text: "Nothing in the current tooling is built for that week. The protocols describe credentials and mandates; the demos describe the first purchase. The week away is where a system is judged, by a person who is not in a position to be impressed by anything the system did.",
      },
      { type: "h2", text: "The first delegation will be small and boring" },
      {
        type: "p",
        text: "Everyone imagines the first autonomous purchase as consequential. A flight, a laptop, something you would think twice about. I think the first one is a hosting bill or a coffee subscription, and the reason is reversibility rather than importance.",
      },
      {
        type: "p",
        text: "The user's actual decision is not about this purchase. It is about whether to widen the boundary next time. A cheap mistake teaches the boundary; an expensive one ends the experiment. The survey numbers point the same way. Across six markets, Checkout.com measured an average delegation tolerance of about one hundred and seventy seven pounds per purchase, with spend caps as the most common non negotiable, ahead of instant revocation and easy cancellation.",
      },
      {
        type: "p",
        text: "So the autonomy arrives from below, on small recurring amounts, and it looks from the outside like nothing is happening. That is the correct shape for the thing to arrive in, and it is the opposite of the demos.",
      },
      {
        type: "p",
        text: "Worth saying plainly: none of this requires a breakthrough. The rails exist, the protocols exist, the tokens exist. What does not exist is a habit, and habits need a first time that is small enough not to matter and a record good enough to survive it. That is a distribution problem wearing an engineering costume, and I would rather name it than pretend the hard part is technical.",
      },
      {
        type: "h2",
        text: "The moment the agent is wrong is not the moment it changes",
      },
      {
        type: "p",
        text: "It changes the first time the user does not stop it. Not because the agent was right, and not because it was careful. Because the boundary was narrow enough that the wrong thing was small, and the record was good enough that the wrong thing was explainable. Trust in an agent is not a feeling about its intelligence. It is an accounting of how many surprises you have had and what each of them cost.",
      },
      {
        type: "p",
        text: "That is why I care about denials being recorded, and why I think revocation latency will turn out to matter more than purchase latency. The system that stops an agent quickly is not the one the user trusts most. The one that explains itself fastest after a mistake is.",
      },
      {
        type: "p",
        text: "I am building for that threshold at [Noesia](https://withnoesia.com). The document on the desk is [what should an AI agent be allowed to do](/thoughts/what-should-an-ai-agent-be-allowed-to-do/), the difference between the two sides of it is [the difference between an AI assistant and an autonomous agent](/thoughts/the-difference-between-an-ai-assistant-and-an-autonomous-agent/), and the record that arrives instead of a request is [what an agent authorization record should contain](/thoughts/what-an-agent-authorization-record-should-contain/). The other reason I care is [honestly, I'm excited](/notes/honestly-im-excited/).",
      },
    ],
  },
  {
    slug: "ai-agents-need-more-authority-not-more-intelligence",
    title: "AI agents don't need more intelligence. They need more authority.",
    category: "Thoughts",
    description:
      "AI agent authority, not a better model, is the binding constraint. The networks say it, the acquirers say it, and the consumer surveys say it, and none of the three is talking about benchmarks.",
    date: "2026-11-30",
    tags: ["AI agents", "authority", "thinking", "delegation", "Noesia"],
    keywords: [
      "AI agent authority",
      "AI agent autonomy",
      "delegated authority",
      "agentic commerce",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "Every time an agent fails in public, the explanation is the same and it is almost never the truth. It needed a better model. Sometimes it did. But the failures I am worried about are not the ones where the agent chose badly. They are the ones where the agent chose something perfectly reasonable and was not allowed to do it, or was allowed to do it in a way nobody can justify afterwards. That is a question of **AI agent authority**, not of intelligence.",
      },
      { type: "h2", text: "The networks have already said it" },
      {
        type: "p",
        text: "Jack Forestell is Visa's chief product and strategy officer. On the announcement of Visa Intelligent Commerce in April 2025 he said these agents will need to be trusted with payments, not only by users, but by banks and sellers as well. Read the sentence carefully. Trust is being extended sideways, from one principal to a chain of parties, and none of the work in that sentence is about a model.",
      },
      {
        type: "p",
        text: "His other line from the same announcement is the one I would put on a wall: each consumer sets the limits, and Visa helps manage the rest. A network with four point eight billion credentials and more than three hundred billion transactions a year is saying, in public, that its role in agent commerce is administering boundaries written by people. That is an authority business.",
      },
      {
        type: "p",
        text: "Mastercard's language for its machines product is the same in a different vocabulary: authorization rules and spending limits that are programmatically enforced, so that transactions stay inside defined parameters. Enforcing a boundary written by someone else, on every transaction, at scale. Again not a benchmark.",
      },
      { type: "h2", text: "The acquirers say it with numbers" },
      {
        type: "p",
        text: "Visa's 2026 Global Digital Shopping Index found that ninety six per cent of acquirers rate agent governance and permissions as important, and fifty five per cent expect to need new payment authorisation capability. Read those two together. The institutions that already move the money are telling you that the work ahead is authorisation work, and that more than half of them believe they will have to build it.",
      },
      {
        type: "p",
        text: "The same index found that twenty three per cent of merchants can clearly distinguish AI driven traffic and fifteen per cent have structured data ready for agents. So the acceptance side is not the constraint either. The constraint is in the middle, in the part where a permission has to exist and be provable.",
      },
      {
        type: "p",
        text: "It is worth being precise about the mechanism, because it is easy to misread. This is not a capability ceiling and it is not a trust deficit in the sense of people disliking agents. It is a specific, articulable worry that keeps surfacing in the same surveys: who was watching. The eleven per cent are not refusing because the agent is stupid. They are refusing because nobody has yet shown them who answers when it is wrong, and they are right to wait, because the people who have answered that question so far have mostly answered it by pointing at them.",
      },
      { type: "h2", text: "The consumers say it by refusing" },
      {
        type: "p",
        text: "Gartner surveyed 322 United States consumers in May 2026: eleven per cent would let an AI make a purchase decision, about thirty one per cent if it only narrows choices for household supplies. Visa's index found thirty five per cent would grant access to saved credentials, against forty eight per cent who used AI to research a purchase. There is a cliff between helping me choose and spending my money, and it is not a capability cliff. It is a consent cliff.",
      },
      {
        type: "p",
        text: "Meanwhile forecasts project a fifth of digital commerce transactions being agent initiated within a few years. The distance between those two numbers is the entire opportunity, and it does not close by shipping a better model. It closes by making the authority legible enough that a person can widen it deliberately.",
      },
      {
        type: "p",
        text: "I want to be fair to the intelligence argument before I disagree with it, because there is a real version of it. A better model genuinely does fix a class of problems: it picks better suppliers, it negotiates better, it stops proposing nonsense. Users will grant authority faster to an agent that is not wasting their time, and that is a legitimate route to more autonomy.",
      },
      {
        type: "p",
        text: "What it does not fix is the part that fails loudly. A better model makes fewer stupid proposals. It does not make the twentieth purchase in a month auditable, it does not make a revoked mandate stop a queued request, and it does not give a finance lead a row to hand to an acquirer. Those are not intelligence problems and no benchmark will move them. They are the reason the interesting work in this category is happening in payments infrastructure rather than in model labs, and it is also why the companies that are furthest ahead are not the ones with the best model.",
      },
      { type: "h2", text: "The trade I would make" },
      {
        type: "p",
        text: "Every unit of authority an agent gets should buy a unit of reversibility or a unit of evidence. That is the rule I design against. More authority, faster reversal: fine, the user can undo it. More authority, permanent record: fine, the decision can be read back. More authority with neither, and the combination is a liability that will be discovered by somebody else.",
      },
      {
        type: "p",
        text: "The same rule is why a smarter agent is not automatically a better product. Intelligence raises the rate at which an agent exercises whatever authority it has, including the authority it should not have had. In a system where the boundary is vague, better models make the outcomes less predictable. That is not an argument against improving the model. It is an argument about which side of the system you are working on.",
      },
      {
        type: "p",
        text: "I am building the authority side at [Noesia](https://withnoesia.com). The mechanism is [the authorization layer for autonomous agents](/thoughts/the-authorization-layer-for-autonomous-agents/), the constraint I keep the model out of is [why there should be no LLM in the authorization path](/thoughts/no-llm-in-the-authorization-path/), and the ceiling nobody in this category writes down is [who is responsible when an AI agent buys the wrong thing](/thoughts/who-is-responsible-when-an-ai-agent-buys-the-wrong-thing/). The short version of the trust argument is [the agentic economy is a trust problem](/notes/the-agentic-economy-is-a-trust-problem/).",
      },
    ],
  },
  {
    slug: "revocation-how-to-stop-an-agent-mid-flight",
    title: "Revocation: how to stop an agent mid-flight",
    category: "Thoughts",
    description:
      "AI agent revocation has three different jobs, not one. Instant revocation is a non negotiable for a lot of people, which makes the latency the number that matters, and the honest state of ours is designed, not measured.",
    date: "2026-12-03",
    tags: ["AI agents", "revocation", "safety", "engineering", "Noesia"],
    keywords: [
      "AI agent revocation",
      "instant revocation",
      "agent kill switch",
      "scoped capabilities that expire",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "Everything in this category talks about what an agent may spend. Very little talks about the two seconds after the user decides it should stop. That gap is where the product lives, and **AI agent revocation** is a harder engineering problem than the permission system, because the permission system can be wrong in a file and revocation has to be wrong in a network.",
      },
      { type: "h2", text: "Three jobs people call one word" },
      {
        type: "list",
        items: [
          "**Stop.** Nothing new starts. Every future request is denied. This is the easy one, and it is what most revoke buttons do.",
          "**Cancel what is in flight.** Requests already submitted, awaiting a response, sitting in a queue or a retry loop. This is the one users actually mean when they say stop, and it is the one that requires the boundary to have a handle on in flight state.",
          "**Recall what already went out.** A payment that has been authorised, or worse, settled. That is a refund, and it belongs to a different industry with different latency and different odds.",
        ],
      },
      {
        type: "p",
        text: "Most products implement the first, describe it as the second, and are silent about the third. A user who believes they got the second and got the first will stop trusting the button, and a user who believes they got the third will be right to be angry.",
      },
      { type: "h2", text: "Why latency is the real product number" },
      {
        type: "p",
        text: "In Checkout.com's study across six markets, spend caps came first among consumer non negotiables and instant revocation came second, at twenty nine per cent. People do not care about the average latency of a purchase. They care about the worst case of a stop, and they feel it in the gap between pressing the button and knowing.",
      },
      {
        type: "p",
        text: "That number is the one I would publish if I had it, and I do not have it yet, so this article has a limit in it that I would rather state than hide. Our stop is designed and not shipped. Revocation latency is a number I have not measured, and I am not going to estimate it in a paragraph that reads like a product page. The closest verified thing I have is from the prototype, and it is about a different behaviour: an order came back as a request to confirm at 163 euro and it left at 137 after I intervened. One number from a prototype run, and it is labelled as one everywhere it appears.",
      },
      { type: "h2", text: "The design answer: make revocation rare" },
      {
        type: "p",
        text: "The best revocation is the one that was never needed, and the way to get there is expiry. Every capability in my system is scoped and expires, and the expiry is set to the smallest value that lets the task complete, which is a rule I took from Google's payment protocol rather than invented. If every capability dies on its own, then the emergency stop is an exception rather than the normal control, and exceptions are where you can spend engineering effort.",
      },
      {
        type: "p",
        text: "That is also the honest answer to the security argument. A long lived credential held by an agent can be used right up to the moment someone notices. A short lived one can only be used inside a window that was already small. You still need revocation, and you should not pretend otherwise, but you have turned an unbounded problem into a bounded one.",
      },
      {
        type: "p",
        text: "One vendor makes the stronger claim in its documentation, that a single revocation invalidates every credential derived from that mandate immediately. That is a statement about their product and I am not measuring it. The design is the part I agree with, because the alternative is a system where you have to enumerate the things you are revoking, and enumeration is where revocation implementations fail.",
      },
      {
        type: "p",
        text: "The stop control is an interface problem before it is an engineering problem, and engineers tend to get this backwards because the engineering is the interesting part. A user who presses stop needs to know one thing in the first two seconds: is it stopped, or is it stopping. A spinner that resolves when the queue is drained is honest. A spinner that resolves when the request was cancelled is a lie that will be discovered later, at the worst possible moment, and it will cost more trust than the feature ever earned.",
      },
      {
        type: "p",
        text: "The second interface decision is what the screen shows afterwards. The list of things that were in flight, what happened to each of them, and, where relevant, that the money has already gone and this is now a refund rather than a cancellation. That last sentence is the one most products omit, and it is the one that converts an annoyed user into a user who can still be trusted with a wider boundary next month.",
      },
      { type: "h2", text: "The four failure modes I design against" },
      {
        type: "list",
        items: [
          "**The retry that outlives the stop.** An agent retries aggressively. A stop that denies new requests but does not cancel the queue will be undone by the retry loop, and the user will watch it happen.",
          "**The cached permission.** A boundary read from a cache that has not been invalidated is the classic version of this. The decision reads the cache, so the cache is part of the boundary.",
          "**The partial stop.** Revoking the mandate but not the task authorisations derived from it, or the other way round. If the derivation is explicit, the revocation is a graph walk, and it is testable.",
          "**The honest report.** A stop that returns before it has finished has to say so, in the interface, in words. Otherwise the latency is invisible and the user assumes the worst case every time.",
        ],
      },
      {
        type: "p",
        text: "Visa's framing of its own agent credentials contains the constraint in one line: only the consumer can instruct the agent on what to do and when to activate a payment credential. Activation is in the consumer's hands. Deactivation should be in exactly the same hands, at the same speed, and that symmetry is the whole product requirement.",
      },
      {
        type: "p",
        text: "I am building this at [Noesia](https://withnoesia.com), where it is designed and not yet measured. The expiry model is in [least privilege for AI agents](/thoughts/least-privilege-for-ai-agents/), the record that makes a stop reconstructable is in [what an agent authorization record should contain](/thoughts/what-an-agent-authorization-record-should-contain/), and the argument for limits rather than walls is in [what it means to give an AI agent a budget](/thoughts/what-it-means-to-give-an-ai-agent-a-budget/). When I have a measured number I will publish it here, including if it is embarrassing. What an external audit taught me about my own limits is [what a security audit taught me](/notes/what-a-security-audit-taught-me/).",
      },
    ],
  },
  {
    slug: "the-agentic-economy-will-start-with-small-decisions",
    title: "The agentic economy will start with small decisions",
    category: "Thoughts",
    description:
      "The agentic economy will not arrive as agents buying laptops. It will arrive as a hosting bill nobody checked, and the volume will be small amounts that add up to a reconciliation problem.",
    date: "2026-12-07",
    tags: ["agentic economy", "AI agents", "payments", "market", "Noesia"],
    keywords: [
      "agentic economy",
      "AI agents economy",
      "agentic commerce volume",
      "AI agent spending",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "The **agentic economy** is being described, almost everywhere, as if it were a new kind of purchase. Big objects, big decisions, big money moving in new directions. I think that is the wrong end of the distribution, and I think the first real volume will be small enough to look like nothing.",
      },
      { type: "h2", text: "What the numbers actually support" },
      {
        type: "p",
        text: "There is a machine payments protocol that publishes its own activity, and in April 2026 that figure was in the low tens of millions of dollars across thirty days, with third party analysis of the wider on chain agent economy landing in a similar order of magnitude across tens of thousands of agents. Small. And it is worth remembering that much of the reported volume in that category has been read, by independent analysts, as infrastructure testing rather than commerce.",
      },
      {
        type: "p",
        text: "So the honest conclusion is not that machine payments are unimportant. It is that if you build a business model on agent to agent micropayments, the arithmetic will surprise you. The money that is actually moving today is card and account volume authorised under a mandate, in ordinary currencies, by people and companies buying ordinary things.",
      },
      {
        type: "p",
        text: "The other number that matters is on the other side of the transaction. Across six markets, Checkout.com measured an average delegation tolerance of about one hundred and seventy seven pounds per purchase. Whatever the ceiling is, it is not the price of the thing that most people would call an important decision.",
      },
      { type: "h2", text: "The shape of the real workload" },
      {
        type: "p",
        text: "A hosting provider. A design tool. A model API. Three subscriptions that renew, none of which anyone looks at, all of which are increasingly bought by something that is not a person. Multiply that across a company with a hundred tools and you get a recurring spend that nobody reconciles, because reconciling it requires a human to remember why each line exists.",
      },
      {
        type: "p",
        text: "That is the workload. It is not a purchase, it is a subscription stream with an author. And it explains why the enterprise spend control category is the one shipping agent cards first: the budgets are already there, the categories are already there, and the missing piece is exactly the one I have been writing about, which is a boundary and a reason attached to each line.",
      },
      {
        type: "p",
        text: "One more piece of evidence for the shape, and it comes from the least glamorous corner of the market. The enterprise spend control category, the one that sells cards with policy attached to finance teams, is the category shipping agent cards first. That is not a market sizing argument. It is a telling: the money is in budgets that already exist, in categories that are already coded, in approvals that already have a workflow. Autonomy gets adopted where the budget already has an owner.",
      },
      { type: "h2", text: "Why small decisions are the right place to start" },
      {
        type: "list",
        items: [
          "**The authority is narrow, so the boundary can be simple.** A standing mandate for recurring software spend is a paragraph. A mandate for buying a laptop is a policy.",
          "**The error is cheap, so the habit can form.** The user's real decision is whether to widen the boundary next time, and that decision is better made after a small mistake than after a large one.",
          "**The frequency is what makes it an economy.** One purchase is a demo. Eleven recurring decisions a month is a budget, a ledger, and a relationship with a supplier.",
        ],
      },
      {
        type: "p",
        text: "The third point is the one that gets skipped. The value of an agentic economy is not the transaction, it is the accumulation of decisions that somebody has to account for at the end of the month. That is a finance problem, and finance problems are won by whoever makes the reconciliation boring.",
      },
      {
        type: "p",
        text: "The reconciliation tax is the real product, and it arrives one month after the autonomy. Until then the agent's purchases look like progress. At month end somebody has to answer four questions for every line: was this inside the boundary, why was this supplier chosen, does this match the invoice, and is it still needed. A human answering those four questions for forty subscriptions has not saved time, they have invented a job. The only version that saves anything is the one where the record answers all four without them, and that is a much higher bar than it sounds, because two of the four questions need the original instruction rather than the amount.",
      },
      {
        type: "p",
        text: "This is also where the smallness of the amounts becomes an advantage rather than a limitation. A hundred and seventy seven pounds of tolerance is small enough that the error budget is small, the mistakes are recoverable, and the blast radius of a bad boundary is a person being annoyed rather than a company being exposed. Categories that scale through small, frequent, reversible transactions tend to be the ones that compound. Categories that wait for a large first transaction tend to be the ones that get a pilot and then nothing.",
      },
      {
        type: "p",
        text: "There is a second market hiding in the same place, and it is the one I would actually build for. Not the purchase, which someone else's system will do better, but the standing authority around a category of spend. Every company with recurring software spend already has a person whose unofficial job is noticing it. That person is the user. They are not waiting for an agent to shop for them; they are waiting to stop being the last line of defence on forty euros a month.",
      },
      { type: "h2", text: "The part that will surprise incumbents" },
      {
        type: "p",
        text: "Nothing about this looks like a payments disruption from the outside. No new checkout, no new currency, no new merchant. It looks like a slightly better procurement process, and it will be adopted by the person who owns the spend rather than by the person who owns innovation. That is a slow, boring, extremely large channel, and it is not where the demos are.",
      },
      {
        type: "p",
        text: "I am building for that shape at [Noesia](https://withnoesia.com). The budget that makes it possible is in [what it means to give an AI agent a budget](/thoughts/what-it-means-to-give-an-ai-agent-a-budget/), the line that makes it survive month end is in [what an agent authorization record should contain](/thoughts/what-an-agent-authorization-record-should-contain/), and the wider argument is [the money layer for AI agents](/thoughts/money-layer-for-ai-agents/). I wrote the short version of this a while ago in [the agentic economy is a trust problem](/notes/the-agentic-economy-is-a-trust-problem/).",
      },
    ],
  },
  {
    slug: "why-autonomous-purchasing-needs-a-control-layer",
    title: "Why autonomous purchasing needs a control layer",
    category: "Thoughts",
    description:
      "Every rail shipped a control surface inside itself. The case nobody has closed is the one where the loop is closed by somebody else, which is where the undecided loss actually lands.",
    date: "2026-12-10",
    tags: ["AI agents", "payments", "controls", "disputes", "Noesia"],
    keywords: [
      "AI agent purchasing",
      "agent spend controls",
      "agentic commerce",
      "dispute liability",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "Here is the hardest version of the argument against my company, and I would rather put it in my own words than have an investor find it. The rules already exist. Visa, Mastercard, the networks and the EMV specification have been extended for agent transactions, and a payments practice published a series arguing exactly that: **the ambiguity is not an absence of applicable rules, the rules exist.** If that is true, an **AI agent purchasing** control layer is a documentation project.",
      },
      { type: "h2", text: "Where that argument is right" },
      {
        type: "p",
        text: "It is right, and it is more right than I assumed when I started. Mastercard has issued agent text in its operating regulations. Visa's developer documentation describes validation that an authorisation request matches the original authenticated instruction. EMVCo has a shared state proposal in public discussion. The rulebook is being written, and the people writing it are the networks, who have every incentive to write rules that keep the loss inside their own loop.",
      },
      {
        type: "p",
        text: "If you are building inside one loop, that is genuinely enough. A merchant on a single network with a single processor, checking the agent's authority inside their own authorisation request, can run on network rules. That is most of the market, probably, for the next several years.",
      },
      { type: "h2", text: "Where it stops working" },
      {
        type: "p",
        text: "The rules allocate liability **inside a closed loop**, which is exactly why they cannot answer the question that is actually open. Consider a purchase where the agent negotiated with one merchant, settled through a processor, and the counterparty's bank sits in a different scheme with different dispute windows and different evidence requirements. Every rule applies. No rule says who answers.",
      },
      {
        type: "p",
        text: "And this is not my invention. The head of agentic commerce at Worldpay, a payment infrastructure provider that participates in the same standards everyone else does, put it plainly: Visa, Mastercard and American Express have all launched frameworks for agent transactions, and who bears the loss in a dispute remains largely undecided. The concession and the gap are in the same sentence, from an incumbent with a reason to be sceptical of us.",
      },
      {
        type: "p",
        text: "The same gap appears in the documentation of the standards themselves. One of the design goals listed for the payment protocol is accountability, defined as determining accountability if a fraudulent or incorrect transaction occurs. A protocol that lists accountability among the problems it is solving is a protocol that has not solved it.",
      },
      {
        type: "p",
        text: "Before I list the pieces, it is worth being clear about what a control layer is not, because the phrase is used loosely enough to mean anything from a dashboard to a firewall. It is not fraud detection, which is the acquirer's and the network's job and which works well on card traffic. It is not a checkout, which is the merchant's. It is not a wallet, which is the issuer's. It sits above all three and below the user, and its only subject is the question of whether a particular action was permitted, by whom, under which instruction, with the evidence to answer that question later.",
      },
      {
        type: "p",
        text: "That is a narrow description and I think it is correct, because a narrow description is the only kind that survives a contact with a payments lawyer. Anything broader and I would be claiming to solve fraud, which I cannot, or disputes, which I am explicitly not trying to adjudicate.",
      },
      { type: "h2", text: "So what is a control layer, concretely" },
      {
        type: "list",
        items: [
          "**A boundary that does not belong to the rail.** Written by the principal, evaluated by an engine the principal controls, portable enough to be presented to a counterparty that is not a customer.",
          "**A record that survives the crossing.** Fields that each party can read without our database, with the chain intact, exportable without asking us for permission.",
          "**A reconciliation between the decision and the money.** Every allow has to tie to a charge or a refusal, and the mismatches have to be findable by comparing two systems rather than one.",
          "**An answer to why, produced at the time.** Not reconstructed later from logs, which a payments lawyer has already said is not enough.",
        ],
      },
      {
        type: "p",
        text: "Notice that none of these are payments. They are the things payments need around them when the payment is not the only party. That is the layer, and it is smaller than the networks and larger than a dashboard.",
      },
      {
        type: "p",
        text: "The test I would apply to any claim in this area, including my own, is what happens when the loop is closed by somebody else. If the answer is that the rules already cover it, the answer should name the rule, the forum it applies in, and the party it allocates the loss to. I have asked that question of the network rules and the honest answer is that they allocate loss inside a closed loop and stay silent across one. Everything I have built is the part that stays silent, and I would stop building it the day somebody wrote that paragraph down.",
      },
      {
        type: "h2",
        text: "The part where the incumbents are converging, and what it means",
      },
      {
        type: "p",
        text: "Two mandate layer companies have raised real money, and one of them was funded by two of the networks whose rules I have just described. One documents a mandate per purchase with single use reveal tokens and a short lived verification value. The other sells enforced limits, expiry and revocation of derived credentials, and states the merchant side as no new integration work on their existing rails. An identity company raised a Series A and then partnered with the second of those to associate spending authority with registered agents.",
      },
      {
        type: "p",
        text: "The direction is unmistakable and it is not towards a network. It is towards a mandate that sits between the credential and the decision, sold by someone who is not the issuer and not the processor. That is the same position I am taking, from a smaller base, and I would rather say so plainly than pretend the field is empty.",
      },
      {
        type: "p",
        text: "I am building it at [Noesia](https://withnoesia.com). The category map is [the authorization layer for autonomous agents](/thoughts/the-authorization-layer-for-autonomous-agents/), the evidence argument is [who is responsible when an AI agent buys the wrong thing](/thoughts/who-is-responsible-when-an-ai-agent-buys-the-wrong-thing/), and the record that has to survive the crossing is [what an agent authorization record should contain](/thoughts/what-an-agent-authorization-record-should-contain/). If you think the existing network rules close the gap, write the paragraph. I have tried and I could not. The short version of the trust argument is [the agentic economy is a trust problem](/notes/the-agentic-economy-is-a-trust-problem/).",
      },
    ],
  },
  {
    slug: "what-happens-when-software-can-act-for-you",
    title: "What happens when you let software actually do the job",
    category: "Thoughts",
    description:
      "When software acts for you, the person who used to know why each purchase happened stops existing. That is the real cost of agentic commerce, and it is bigger than the fraud one.",
    date: "2026-12-14",
    tags: ["AI agents", "thinking", "founders", "agentic commerce", "Noesia"],
    keywords: [
      "autonomous AI agents",
      "AI agents that act",
      "agentic commerce",
      "delegated authority",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "The discussions about letting **autonomous AI agents** act are usually about risk: the wrong purchase, the fraud, the amount. Those are real and they are the easy half. The half nobody prices is that the person who used to know why each purchase happened stops existing, and nobody notices until the knowledge is gone.",
      },
      { type: "h2", text: "The person who knew" },
      {
        type: "p",
        text: "In every company I have been in, somebody knew why the tool costs forty euros a month. Not officially. They knew because they cancelled it once, saw what broke, and re-subscribed. That knowledge lived in a person, it was never written down, and it was load bearing for every renewal.",
      },
      {
        type: "p",
        text: "Now imagine the renewal is decided by something that cannot remember the cancellation. It sees a recurring charge, a category, a price inside a limit, and a boundary that permits it. It renews. Nothing is wrong. And the reason that existed in a person is now nowhere at all.",
      },
      {
        type: "p",
        text: "I have felt this in my own company. Decisions about tools and services used to be a conversation, and the conversation was the record. Now they have to become a document, and the document is worse than the conversation because it is thinner. I do not enjoy that trade and I do not see an alternative.",
      },
      { type: "h2", text: "The statement was doing more work than we thought" },
      {
        type: "p",
        text: "A monthly statement is a control mechanism that nobody designed as one. Somebody reads it. Something looks wrong. It gets cancelled. The whole loop runs on a human noticing something in a list, and the loop is slow, and it works, and everyone believes it is not really a system.",
      },
      {
        type: "p",
        text: "Once an agent decides the recurring spend, that loop has to be rebuilt somewhere else, because the agent will not read the statement. Whatever replaces it is the real control, and it is usually a set of limits. Limits catch the catastrophic and miss the pointless. Catching the pointless is most of the value of a human reading a statement.",
      },
      {
        type: "p",
        text: "There is a transition cost that nobody prices, and it lands on the smaller party in every transaction. Today a supplier knows who they are dealing with, can recognise a returning customer, can extend terms to somebody they have done business with for years. The first agent purchases arrive from a counterparty with no history, no relationship and a credential that looks like a new customer every time. For a supplier used to reading behaviour as trust, that reads as risk, and risk gets priced.",
      },
      {
        type: "p",
        text: "The obvious response is for the supplier to require a human, which pushes the whole chain back to a confirmation button and undoes the autonomy. The response that works is a record the supplier can read: who the agent acted for, under which instruction, inside which boundary. That is a small request, and it is exactly the artefact this category has been missing, and it is why I think the first real winners here will sell to the supplier side rather than to the buyer side.",
      },
      { type: "h2", text: "The other side of the table" },
      {
        type: "p",
        text: "The merchant and the supplier now have a counterparty they have never had. Mastercard's description of its agent programme says that every player in the value chain, from consumers to issuers and merchants, will be able to recognise the transactions that are facilitated by intelligent agents. Recognisable is not the same as familiar. A support agent looking at a purchase made by software has no context, no conversation, and a customer who will not remember authorising it.",
      },
      {
        type: "p",
        text: "This is a real cost that lands on someone else's balance sheet, which is why it does not get discussed at product meetings. Every agent purchase is a support ticket that has not happened yet, unless the supplier is given something to read. Which is, of course, the record, and the record is the product, and I have made this argument enough times that I can hear how repetitive it sounds. It is still the argument.",
      },
      { type: "h2", text: "What you actually gain" },
      {
        type: "p",
        text: "I do not want this to read as an argument against autonomy, because I am building it. The gain is real. A person who cannot check eleven subscriptions a month is not doing oversight, they are doing a chore, and the chore is exactly the kind of work that gets skipped the week something else goes wrong. Automation here is not replacing judgement. It is removing the task where judgement was never applied anyway.",
      },
      {
        type: "p",
        text: "The trade is that you exchange a slow, remembered, human loop for a fast, written, machine one. That is a genuine improvement in reliability and a genuine loss in texture. The losses show up months later as a policy that nobody remembers writing and everybody is afraid to change.",
      },
      { type: "h2", text: "The obligation you did not sign" },
      {
        type: "p",
        text: "Here is the part I would put on a poster if I had one. When software acts for you, you stop being the person who decides. You become the person who wrote the rule, and the rule runs without you, at times you are not awake, in situations you did not predict, against vendors you have never met. Most of us are not ready for that and the tools are arriving anyway.",
      },
      {
        type: "p",
        text: "My conclusion is not that we should slow down. It is that the author of the rule should be the one who has to live with it, which is why every boundary in this category ought to be written by the person it belongs to, in their own words, and dated. That is the argument I have been making all year, and it started from a bookkeeping problem rather than from a payments one.",
      },
      {
        type: "p",
        text: "I am building the version where that loop is rebuilt at [Noesia](https://withnoesia.com). The document is [what should an AI agent be allowed to do](/thoughts/what-should-an-ai-agent-be-allowed-to-do/), the volume argument is [the agentic economy will start with small decisions](/thoughts/the-agentic-economy-will-start-with-small-decisions/), and the record that has to carry the knowledge out of the person is [what an agent authorization record should contain](/thoughts/what-an-agent-authorization-record-should-contain/). The other half of this is [honestly, I'm excited](/notes/honestly-im-excited/).",
      },
    ],
  },
  {
    slug: "only-23-percent-of-merchants-can-tell-an-agent-from-a-human",
    title: "Only 23% of merchants can tell an agent from a human",
    category: "Thoughts",
    description:
      "Merchants cannot separate agent traffic from human traffic, so their dispute ratios mix two different populations, and the only lever left is the pre-dispute window. Here are the published numbers, region by region.",
    date: "2026-12-17",
    tags: ["payments", "merchants", "disputes", "risk", "Noesia"],
    keywords: [
      "AI agent traffic",
      "agent dispute rate",
      "merchant fraud rules",
      "pre-dispute resolution",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "There is one statistic in this category that I keep coming back to, because it is the one that describes the actual state of the industry rather than the direction of travel. Visa's 2026 Global Digital Shopping Index found that **23% of merchants can clearly distinguish AI driven traffic**, and 15% have structured data ready for agents. Roughly four merchants in five cannot tell an agent from a person.",
      },
      { type: "h2", text: "Why that number has consequences" },
      {
        type: "p",
        text: "Risk systems are calibrated on populations. Every threshold in every fraud engine assumes a distribution of behaviour, and a distribution that now contains two different kinds of buyer is a distribution whose thresholds are wrong in both directions at once. You cannot tune what you cannot separate.",
      },
      {
        type: "p",
        text: "And the separation is not trivial in the technical sense either. Agent purchases have a different shape: different device handling, different session behaviour, different amounts, different geography, and a different relationship with the person who authorised them. None of that is a signature. It is a population shift that arrives gradually enough to look like noise for months.",
      },
      { type: "h2", text: "The number I looked for and did not find" },
      {
        type: "p",
        text: "I went looking for an agent initiated dispute rate, the figure that would make this measurable rather than anecdotal. It does not exist. A dispute resolution practitioner with fifteen years in the field wrote in March 2026 that no documented public cases from AI agent purchases have been confirmed yet. Visa's own research on agentic payments contains no such statistic and says something more useful instead: disputes lack established resolution mechanisms, and chargeback windows and evidence requirements were designed for human speed commerce with clear buyer intent.",
      },
      {
        type: "p",
        text: "There is a widely repeated multiplier claiming agent disputes run about two and a half times the comparable human rate. I traced it, and the honest answer is that it does not survive tracing. No network, issuer or acquirer has published it. Three outlets carry it with wording identical down to the supporting detail, which is how one unsourced assertion propagates. It is not a conservative estimate, it is an unsourced one, and I have deleted it from anything I write.",
      },
      { type: "h2", text: "What the thresholds actually say" },
      {
        type: "p",
        text: "The published programme that governs this is worth reading closely, because it turns the problem into a finance conversation. Visa's monitoring programme defines its ratio as the count of fraud reports plus dispute records divided by the count of settled transactions. It is **count based, not value based**, and it spans domestic and cross border card not present traffic. Acquirers are held below thirty basis points, and a merchant is excessive above one hundred and fifty in Asia Pacific, Canada, Europe and the United States, after a reduction that took effect on the first of April 2026. Latin America and Central America, the Middle East and Africa sit at two hundred and twenty. A merchant also has to clear a floor of fifteen hundred transactions a month to enter the programme at all.",
      },
      {
        type: "p",
        text: "Two details in that matter more than the headline number. The ratio **excludes disputes resolved through pre-dispute solutions**, which makes the pre-dispute window the only lever a merchant controls without changing their traffic. And the excess threshold is a cliff, not a slope: crossing it changes the problem from fraud engineering into finance, reconciliation and evidence.",
      },
      {
        type: "p",
        text: "Now put the two facts together. The merchant cannot separate agent traffic from human traffic, which means their ratio mixes two populations, and the resolution mechanism for that mixed population is the window before it becomes a dispute. That window requires evidence: what the agent was authorised to do, by whom, under which instruction. A merchant who cannot produce that has one option, and it is to deny the transaction or absorb it.",
      },
      { type: "h2", text: "The banks are not waiting either" },
      {
        type: "p",
        text: "In the same Visa index, ninety six per cent of acquirers rated agent governance and permissions as important and fifty five per cent said they expect to need new payment authorisation capability. When merchants were asked what would make them participate, fraud protection came first at forty four per cent and agent rule setting second at thirty seven. So the acceptance side, the acquiring side and the cardholder side all point at the same missing artefact: not a payment method, a description of who was allowed to spend.",
      },
      {
        type: "p",
        text: "And the networks agree. Mastercard's programme describes a process to help clarify agentic transactions that may be unfamiliar or unrecognised, and a push for strong authentication using on device biometrics. Both are attempts to put the agent back into a framework built around a person holding a device. Neither is optional if the population is mixed, and the population is going to be mixed.",
      },
      {
        type: "p",
        text: "So what would a merchant actually need, in the order I would build it. First, a way to mark a transaction as agent initiated at the point of authorisation, which is a small change to a request they already send. Second, the ability to read what the agent was authorised to do, without an integration, at the moment the dispute arrives rather than after it. Third, an export that survives their acquirer's retention requirements. None of the three requires the merchant to change how they take payments, which is the only reason I think any of it will get adopted.",
      },
      { type: "h2", text: "What I take from it" },
      {
        type: "p",
        text: "The merchant side is where this category gets decided, and it gets decided on a balance sheet rather than on a demo. A threshold expressed in basis points, applied to counts, with a hard edge and a floor, is a different kind of conversation from a vision of autonomous commerce. It is also a conversation where the person who is under pressure is a finance lead, not an engineer, and the thing they need to be shown is a row that explains a charge.",
      },
      {
        type: "p",
        text: "I am building that row at [Noesia](https://withnoesia.com). What it has to contain is in [what an agent authorization record should contain](/thoughts/what-an-agent-authorization-record-should-contain/), the retention and export requirements are in [why agent payments need an append-only audit trail](/thoughts/why-agent-payments-need-an-append-only-audit-trail/), and the commercial consequence of not having one is in [who is responsible when an AI agent buys the wrong thing](/thoughts/who-is-responsible-when-an-ai-agent-buys-the-wrong-thing/). The short version of the trust argument is [the agentic economy is a trust problem](/notes/the-agentic-economy-is-a-trust-problem/).",
      },
    ],
  },
  {
    slug: "the-mandate-has-to-be-written-before-the-agent-runs",
    title: "The mandate has to be written before the agent runs",
    category: "Thoughts",
    description:
      "An instruction that was inferred from your behaviour is a prediction, and a prediction cannot be enforced. What has to exist before an agent spends is a document you wrote, signed, and dated.",
    date: "2026-12-21",
    tags: ["AI agents", "mandates", "authorization", "thinking", "Noesia"],
    keywords: [
      "agent mandate",
      "delegated authority",
      "AI agent authorization",
      "agent spending policy",
      "Noesia",
    ],
    content: [
      {
        type: "p",
        text: "I have written in a memo of mine that **the mandate must be written by you, in your own words, beforehand**, and that an interface guessing what you will allow is not the same thing. It is the sentence I believe most strongly in this whole area, and I have also spent months working out whether I actually believe it. Here is the case.",
      },
      { type: "h2", text: "An inferred boundary is a prediction" },
      {
        type: "p",
        text: "The attractive version of this product watches you for a few weeks, notices that you buy coffee on Mondays, and then orders on its own. It feels like learning, and in a marketing sense it is the whole pitch. In an enforcement sense it is incoherent, and the incoherence is precise: a prediction is not an instruction. Nobody authorised a prediction. It is a hypothesis about behaviour, and it cannot be the thing a purchase is checked against, because there is no document to point at when the purchase is disputed.",
      },
      {
        type: "p",
        text: "The distinction shows up exactly where it hurts. If the boundary was inferred, the question who authorised this has no answer that survives contact with a person who disagrees with the inference. If the boundary was written, the answer is a sentence with a date on it and a signature under it. One of those is a conversation. The other is evidence.",
      },
      { type: "h2", text: "The industry has quietly agreed on the mechanism" },
      {
        type: "p",
        text: "Google's payment protocol describes the delegated case, where a human is not present, and the shape is a mandate signed upfront. When you delegate a task like buying concert tickets the moment they go on sale, the description says you sign a detailed intent mandate before anything happens, and that it specifies the rules of engagement: price limits, timing and other conditions. It calls that verifiable pre authorised proof, and it is the foundation the rest of the protocol is built on.",
      },
      {
        type: "p",
        text: "Visa's documentation describes the same shape from the issuer side. The consumer sets and changes payment instructions, and validation ensures that a credential request matches the original authenticated user instructions, and that the authorisation request matches the credential request. Two checks against one instruction. The instruction has to exist for either of them to mean anything.",
      },
      {
        type: "p",
        text: "And the same protocol makes a recommendation that tells you how serious they are about it. On an autonomous payment mandate, set the expiry claim to the smallest value that will let the task complete. Not a convenient window. The smallest one that works. That is an institution telling builders that the value of an authority is inversely related to its duration.",
      },
      {
        type: "p",
        text: "One more question the answer forces, which is who writes it. Not the engineer, because an engineer writes the system rather than the rule. Not the company, because a company policy is not a personal authority and the user will feel the difference the first time it stops them buying something they wanted. The user writes it, and the system's job is to make that possible for someone who has never written a policy before, which is a writing problem before it is a software problem.",
      },
      { type: "h2", text: "So why does inference feel right" },
      {
        type: "p",
        text: "Because onboarding by interview is genuinely bad, and because being asked to write a policy is a wall most people do not climb. Both objections are about the experience, not about the principle, and both have an answer that keeps the principle intact.",
      },
      {
        type: "p",
        text: "Inference may propose. A system that watches a month of behaviour and then asks once, plainly, with a sentence the user can read and accept or edit, is doing the hardest part of the work and it is not cheating. The line is that inference never authorises. It drafts the mandate. The person signs it or changes it. After that the mandate is the document and the model is out of the loop entirely.",
      },
      {
        type: "p",
        text: "That is also the onboarding I would want. Writing a policy from nothing is a blank page. Editing a draft that already knows your subscriptions is a decision, and decisions are cheap while blank pages are expensive.",
      },
      { type: "h2", text: "What signing does, and what it does not do" },
      {
        type: "p",
        text: "I want to be careful here because it is the part I am least able to settle. Technically, signing binds the decision to a specific instruction, made by a specific principal, at a specific moment, and it is what makes the record recomputable rather than merely written down. That I can demonstrate.",
      },
      {
        type: "p",
        text: "Whether that carries weight with a court, an issuer or a regulator is a different question, and I do not have the answer. Identity and liability is the row of our own capability table that is still marked as not resolved, and I have decided to say so on the page rather than imply a conclusion we have not reached. What I can claim is narrow: the instruction is signed, dated, versioned and retrievable, and the decision can be recomputed against it months later. Whether that is sufficient in a dispute is a question for counsel, and I will not pretend otherwise.",
      },
      { type: "h2", text: "The sentence" },
      {
        type: "p",
        text: "Here is the one I would put in a product if I could only have one. Spend up to four hundred a month at these three suppliers for tools and hosting. Nothing that renews by itself. Ask me above a hundred and fifty, in the moment, when I am awake. It all stops on the last day of the month, and I can pull the whole thing from my phone in one action. Anything outside that, tell me and stop.",
      },
      {
        type: "p",
        text: "It is written before the run, it expires, it has a number the user chose, and it says what happens at the edge. If the product cannot be explained that way, the problem is not the interface. It is that the product does not know what it was authorised to do.",
      },
      {
        type: "p",
        text: "I am building that at [Noesia](https://withnoesia.com). The fields the sentence compiles into are in [what should an AI agent be allowed to do](/thoughts/what-should-an-ai-agent-be-allowed-to-do/), the draft first signing later argument sits in [the moment AI agents stop being assistants](/thoughts/the-moment-ai-agents-stop-being-assistants/), and the open question I have not closed is in [who is responsible when an AI agent buys the wrong thing](/thoughts/who-is-responsible-when-an-ai-agent-buys-the-wrong-thing/). The other half of this is [honestly, I'm excited](/notes/honestly-im-excited/).",
      },
    ],
  },
];

// `post` e non `posts`: la Function scrive in `content/cms/<kind>/`, e `kind`
// e' il nome singolare che il pannello manda. Con il plurale la cartella
// restava vuota, `loadCmsCollection` restituiva una lista vuota senza dire
// niente, e ogni articolo pubblicato dal pannello finiva su Git senza arrivare
// mai al sito: commit verde, deploy verde, pagina identica.
const cmsPosts = loadCmsCollection<Post>("post");
const merged = mergeCmsCollection(raw, cmsPosts);

export const posts: (Post & { readingMinutes: number })[] = merged
  // Il filtro sta qui e non nelle pagine: tutto ciò che mostra un articolo —
  // rotta, sitemap, feed, card, liste correlate, link in fondo — legge da
  // questo elenco, quindi un pezzo non ancora pubblico non puo' trapelare da
  // una superficie che qualcuno si e' dimenticato di filtrare.
  .filter((p) => isPublished(p.date))
  .map((p) => ({ ...p, readingMinutes: minutesOf(p.content) }))
  .sort((a, b) => (a.date < b.date ? 1 : -1));

/**
 * Gli slug che questa build ha appena reso pubblici.
 *
 * Serve a chi deve *annunciare* qualcosa invece di mostrarlo: il ping a
 * IndexNow e l'invio del sitemap non hanno senso a ogni deploy, ne' hanno
 * senso con un elenco fisso di indirizzi scritto nello script.
 */
export function publishedToday(): (Post & { readingMinutes: number })[] {
  return posts.filter(
    (p) =>
      isPublished(p.date) && p.date === new Date().toISOString().slice(0, 10),
  );
}

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug);
}
