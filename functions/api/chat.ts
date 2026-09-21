interface AiBinding {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

interface AssetBinding {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  AI?: AiBinding;
  ASSETS: AssetBinding;
}

interface RagEntry {
  title: string;
  description: string;
  content: string;
  url: string;
  type: string;
}

interface RagIndex {
  entries: RagEntry[];
}

interface ChatBody {
  question?: unknown;
  path?: unknown;
}

const MODEL = "@cf/meta/llama-3.2-1b-instruct";
const MAX_QUESTION = 500;
const STOP_WORDS = new Set(["what", "where", "when", "who", "does", "is", "the", "and", "for", "about", "tell", "me", "can", "you", "how", "this", "that", "with", "from"]);
const NAV_WORDS = /\b(go|take|send|open|show|vai|portami|mandami|apri|mostrami)\b/i;
// Gli intent espliciti della sezione Feedback passano prima di qui: il
// retrieval a token non sempre li vince contro pagine con più testo.
const NAV_OVERRIDES: Array<[RegExp, string]> = [
  [/\bfeedback\b|attack(ed)? (it|payle)|send (my|a) (comment|feedback)/i, "/feedback/"],
];

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9àèéìòù]+/gi, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function retrieve(entries: RagEntry[], question: string): RagEntry[] {
  const wanted = new Set(tokens(question));
  return entries
    .map((entry) => {
      const title = new Set(tokens(entry.title));
      const body = tokens(`${entry.description} ${entry.content}`);
      const score = [...wanted].reduce((sum, token) => sum + (title.has(token) ? 5 : body.includes(token) ? 1 : 0), 0);
      return { entry, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ entry }) => entry);
}

function navigation(question: string, entries: RagEntry[]): string | null {
  const lower = question.toLowerCase();
  for (const [pattern, url] of NAV_OVERRIDES) {
    if (pattern.test(lower)) return url;
  }
  if (!NAV_WORDS.test(question)) return null;
  if (/usepayle|payle\.com|payle website|product/i.test(lower)) return "https://usepayle.com";
  const ranked = entries
    .map((entry) => ({ entry, score: tokens(`${entry.title} ${entry.url}`).filter((token) => lower.includes(token)).length }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score ? ranked[0].entry.url : null;
}

function fallback(question: string, sources: RagEntry[]): string {
  if (!sources.length) {
    return "I can answer questions about Mattia Ciuni, Payle, the Thoughts, the Notes and the other pages on this site. I could not find that in the site's published content.";
  }
  const best = sources[0];
  return `Here is what I found on this site, in “${best.title}”: ${best.description || best.content.slice(0, 420)}${best.url === "/" ? "" : ` Read the full page: ${best.url}`}`;
}

function aiText(result: unknown): string {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";
  const value = result as { response?: unknown; result?: unknown };
  if (typeof value.response === "string") return value.response;
  if (typeof value.result === "string") return value.result;
  return "";
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return json({ error: "invalid_request" }, 400);
  }

  const question = typeof body.question === "string" ? body.question.trim().slice(0, MAX_QUESTION) : "";
  if (!question) return json({ error: "empty_question" }, 400);

  const indexResponse = await env.ASSETS.fetch(new Request(new URL("/rag/index.json", request.url)));
  if (!indexResponse.ok) return json({ error: "knowledge_base_unavailable" }, 503);
  const index = (await indexResponse.json()) as RagIndex;
  const entries = index.entries || [];
  const currentPath = typeof body.path === "string" && body.path.startsWith("/") ? body.path : "/";
  const current = entries.find((entry) => entry.url.replace(/\/$/, "") === currentPath.replace(/\/$/, ""));
  const sources = retrieve(entries, question);
  if (current && !sources.some((entry) => entry.url === current.url)) sources.unshift(current);
  const navigateTo = navigation(question, entries);

  if (!env.AI) {
    return json({ answer: fallback(question, sources), sources: sources.map(({ title, url }) => ({ title, url })), navigateTo, mode: "local" });
  }

  const context = sources.map((source, index) => `SOURCE ${index + 1}\nTITLE: ${source.title}\nURL: ${source.url}\nCONTENT: ${source.content}`).join("\n\n");
  const system = `You are the private site guide for Mattia Ciuni's personal website. Answer only from the provided sources. You may mention usepayle.com because it is the site's product link. Do not browse, invent facts, answer general questions, or discuss external people or sites. If the sources do not answer the question, say exactly that the answer is not in the site's published content and suggest a related page. Be concise, warm, and link to a source when useful. Never output markdown links to an external domain other than https://usepayle.com.`;
  try {
    const result = await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: `QUESTION: ${question}\n\nSITE SOURCES:\n${context || "No matching source was found."}` },
      ],
      max_tokens: 220,
      temperature: 0.1,
    });
    const answer = aiText(result) || fallback(question, sources);
    return json({ answer, sources: sources.map(({ title, url }) => ({ title, url })), navigateTo, mode: "workers-ai" });
  } catch {
    return json({ answer: fallback(question, sources), sources: sources.map(({ title, url }) => ({ title, url })), navigateTo, mode: "local" });
  }
};
