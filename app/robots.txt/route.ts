import { site } from "@/lib/site";

export const dynamic = "force-static";

// Il sito è pubblico: qui si dichiara il permesso, non lo si limita. Il motivo
// per cui gli agenti AI sono elencati per nome è che molti non seguono `*`, e
// chi non trova il proprio nome decide da sé.
//
// L'unica eccezione sono le due porte della dashboard privata: non sono
// contenuto, sono uno strumento con un login, e non c'è niente da indicizzare.
// Il `Disallow` si ripete in **ogni** blocco perché un crawler applica il gruppo
// più specifico che lo nomina: lasciarlo solo sotto `*` lo renderebbe invisibile
// proprio agli agenti nominati qui sotto, che è il contrario di quello che serve.
// Restano fuori da ogni sitemap e da `llms.txt` (vedi `verify.js`). L’NDA usa inoltre un token one-time e non espone mai il documento dal sito.
const PRIVATE_PATHS = ["/admin/", "/api/admin/", "/nda", "/nda/", "/api/nda", "/api/nda/"];
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
    "# La politica d'uso (IETF draft, contentsignals.org): il sito è pubblico,",
    "# quindi tutti e tre i segnali dicono sì — la stessa cosa che dicono i",
    "# trentadue Allow: / che seguono. Un segnale che contraddice gli Allow è una",
    "# politica che nessuno può rispettare. La scoperta (card, llms.txt, catalogo)",
    "# resta dichiarata negli header e in /.well-known/, non qui.",
    "Content-Signal: ai-train=yes, search=yes, ai-input=yes",
    "Allow: /",
    ...PRIVATE_PATHS.map((path) => `Disallow: ${path}`),
    "",
    ...AI_AGENTS.flatMap((agent) => [
      `User-Agent: ${agent}`,
      "Allow: /",
      ...PRIVATE_PATHS.map((path) => `Disallow: ${path}`),
      "",
    ]),
    `Sitemap: ${base}/sitemap.xml`,
    `Sitemap: ${base}/news-sitemap.xml`,
    "",
  ].join("\n");

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
