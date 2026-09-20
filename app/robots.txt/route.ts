import { site } from "@/lib/site";

export const dynamic = "force-static";

// Il sito è pubblico: qui si dichiara il permesso, non lo si limita. Il motivo
// per cui gli agenti AI sono elencati per nome è che molti non seguono `*`, e
// chi non trova il proprio nome decide da sé.
const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "meta-externalagent",
  "Meta-ExternalFetcher",
  "FacebookBot",
  "YouBot",
  "cohere-ai",
  "Diffbot",
  "DuckAssistBot",
  "MistralAI-User",
  "ImagesiftBot",
  "omgili",
  "Webzio-Extended",
  "PanguBot",
  "iaskspider",
  "AI2Bot",
  "AI2Bot-Dolma",
  "Timpibot",
  "Kangaroo Bot",
];

export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const text = [
    "# Tutto pubblico: il sito è pensato per essere letto, anche dalle macchine.",
    "# Ogni pagina ha la sua versione markdown allo stesso indirizzo con .md",
    `# (es. ${base}/thoughts/money-layer-for-ai-agents.md), vedi anche ${base}/llms.txt`,
    "",
    "User-Agent: *",
    "# Politica dichiarata in modo esplicito: e' l'unico posto in cui robots.txt",
    "# puo' contraddire se stesso, quindi i tre valori stanno qui per intero.",
    "Content-Signal: ai-train=yes, search=yes, ai-input=yes",
    "Allow: /",
    "",
    ...AI_AGENTS.flatMap((agent) => [`User-Agent: ${agent}`, "Allow: /", ""]),
    `Sitemap: ${base}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
