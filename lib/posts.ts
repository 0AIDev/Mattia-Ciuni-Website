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
            : b.text
    )
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

const raw: Post[] = [
  {
    slug: "welcoming-raj-koli-founding-engineer-agent-experience",
    title: "Welcoming Raj Koli, Founding Engineer (Agent Experience): the interview",
    category: "Thoughts",
    description:
      "Raj Koli, 21, from India, is Payle's Founding Engineer on the Agent Experience: the interview on agent evaluation, typed errors, and the pending state most demos skip.",
    date: "2026-10-01",
    tags: ["founders", "hiring", "engineering", "building in public", "Payle"],
    keywords: [
      "Raj Koli",
      "founding engineer",
      "Payle team",
      "agent evaluation",
      "TypeScript SDK",
      "AI agent payments",
      "Mattia Ciuni",
    ],
    content: [
      {
        type: "p",
        text: "**Founding Team series.** This is the second post in the series: introducing the people building Payle, in their own words, with the honesty we use everywhere else on this site.",
      },
      {
        type: "p",
        text: "First up was [Alex Mwaniki, Founding Engineer on the core](/thoughts/welcoming-alex-mwaniki-founding-engineer-core/). Today: **Raj Koli**, Founding Engineer on the Agent Experience: the TypeScript SDK, the demo agent, and everything that makes the Payle agent usable by developers and visible to the world.",
      },
      {
        type: "p",
        text: "Raj is 21, from India, and a full-time university student who committed to Payle full-time anyway. Here is our conversation, edited for length but not for honesty.",
      },
      { type: "h2", text: "A builder who was already watching agents fail" },
      {
        type: "p",
        text: "**Mattia: Take me back to the day you first saw Payle. What made you reach out instead of just scrolling?**",
      },
      {
        type: "quote",
        text: "Honestly, what got me was the framing: agents that can actually do things instead of just generating answers. I had already been interested in agent evaluation and tool use, so when I saw your post, it felt like someone was building exactly the kind of thing I wanted to work on. I messaged you the same day because I wanted to learn more about it.",
      },
      {
        type: "p",
        text: "**Mattia: Your CV mentions Terminal-Bench and agent evaluation at Handshake AI. Where did that instinct come from, what made you think \"I know how agents fail, and I want to build for them\"?**",
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
        text: "I build my week around university's fixed deadlines, but Payle is a full-time commitment for me, around 40 hours a week. The hard part isn't really the hours themselves, it's making sure a university deadline doesn't suddenly affect the work. So I try to see conflicts coming weeks ahead instead of discovering them when they're already here.",
      },
      {
        type: "p",
        text: "**Mattia: There will be a week where a university exam collides with a Payle deadline. Walk me through how you decide which one wins, and what you'd tell me before that week.**",
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
        text: "**Mattia: Payle's bet is that agents will pay for things everywhere and nobody will think about it. Raj, the student from India who evaluated agents before most people knew what agents were, what does your version of that future look like?**",
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
        text: "Raj is now officially Founding Engineer (Agent Experience) at Payle: full-time commitment, equity with 4-year vesting and a 1-year cliff. He owns the TypeScript SDK, the demo agent, and everything that makes the Payle agent usable by developers. His first shipped artifact, the persistent idempotency SDK with FLAKY_MODE testing, is coming in a follow-up post.",
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
      "Alex Mwaniki, 21, from Kenya, is Payle's Founding Engineer on the core: the interview on least privilege, Go, and why no LLM touches the money.",
    date: "2026-09-22",
    tags: ["founders", "hiring", "engineering", "building in public", "Payle"],
    keywords: [
      "Alex Mwaniki",
      "founding engineer",
      "Payle team",
      "artifact-based hiring",
      "AI agent payments",
      "Mattia Ciuni",
    ],
    content: [
      {
        type: "p",
        text: "**Founding Team series.** This is the first post in a series I've wanted to write since the day Payle stopped being just me: introducing the people building this company, [in their own words](/work/), with the honesty we use everywhere else on this site.",
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
        text: "**Describe in one sentence what you think about Payle.**",
      },
      {
        type: "audio",
        src: "/thoughts/welcoming-alex-mwaniki-founding-engineer-core/alex-audio.m4a",
        title: "Alex Mwaniki: one sentence about Payle",
      },
      { type: "h2", text: "A builder with nowhere to build" },
      {
        type: "p",
        text: "**Mattia: Take me back to the day you first saw Payle. What made you reply instead of just scrolling?**",
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
        text: "It came directly from my background in Cloud Architecture and SRE. In cloud security, the foundational rule is the Principle of Least Privilege: you never grant a service excess access. You generate the minimal permissions needed to execute the task given, nothing more. When I looked at what Payle was building, I applied the exact mental model to AI. We want autonomous agents to handle transactions, but can we blindly trust non-deterministic software with unrestricted access to our money? Giving an AI agent a static card number or a permanent API key is asking for a disaster; one hallucination could drain an entire account. The only safe model is treating the agent like an untrusted cloud process and giving it the least permissions required. Pairing that with an append-only ledger was the natural counterpart: every permission granted and every cent moved must be permanently recorded in an immutable trail.",
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
        text: "\"I told no one, let the code do the talking\" is a level of discipline I didn't expect from a 21-year-old. Most people his age announce the title first. He announced nothing until the code existed.",
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
        text: "Honestly? The main feeling was relief. I'm 21, and taking on an executive CTO role involves regulatory compliance and corporate management that would pull me completely away from the code. Having Ghassen own that side lets me focus 100% on what I do best: building the core engine, the ledger, and the infrastructure. The only uneasy part was the initial surprise of a sudden structural shift, but that passed immediately once I realized it protects my time to just build. I'm sure there's still a lot to learn before taking a managerial role like a CTO. I believe in the Payle manifesto, and I'm grateful for this chance to be part of it at this early stage. The growth and networking from this team, different countries and different backgrounds, really makes me want to stay and build.",
      },
      {
        type: "p",
        text: "I'm including this answer unedited because it's the most mature response to the hardest question I ask any early team member. The title changed. The compensation didn't. And instead of ego, he saw the structure for what it is: protection of his time to build. That answer is why the path we wrote into his agreement, growth toward bigger technical ownership earned through shipped work, is one I'm confident we'll walk together. The other half of that story is [how Ghassen became my co-founder](/thoughts/finding-ghassen-the-co-founder-question-answered-in-three-weeks/).",
      },
      { type: "h2", text: "The principle he would defend" },
      {
        type: "p",
        text: "**Mattia: Our rule is \"no LLM in the authorization path, deterministic code decides.\" A founder tells you \"AI is smart enough now, why not let it decide?\" Defend the principle.**",
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
        text: "**Mattia: Payle's bet is that one day agents pay for things everywhere and nobody thinks about it. Alex, the kid from Kenya who built an M-Pesa gateway, what does everyday money look like when your generation rebuilds it?**",
      },
      {
        type: "quote",
        text: "M-Pesa proved to the world that money doesn't need plastic cards or bank branches; it can live as programmatic software. My generation's version takes human friction out of transactions completely. Agents will negotiate, book, and pay for services autonomously in milliseconds, while humans sleep peacefully knowing that strict, programmatic policy limits set the boundaries. It's an economy where money moves seamlessly, but code guarantees safety.",
      },
      { type: "h2", text: "Welcome to the team, Alex" },
      {
        type: "p",
        text: "Alex is now officially Founding Engineer (Core) at Payle: full-time, equity with vesting, San Francisco-bound with the team if we make the batch. He owns the authorization engine, the ledger, and the money test suite. His first shipped test, rate limiting under burst load, is coming in a follow-up post. Next in this series: [Raj Koli, Founding Engineer on the Agent Experience](/thoughts/welcoming-raj-koli-founding-engineer-agent-experience/).",
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
