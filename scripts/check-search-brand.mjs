// Contract: what Google says about the two brands, checked on a schedule.
//
// check-brand.mjs guarantees the repository never says the retired name, and
// check-external-brand.mjs guarantees no surface we publish carries it. Neither
// can see what a search engine actually returns, which is the thing that decided
// this problem in the first place: a month-old index entry kept the old title
// alive long after every file was clean. The page an index serves is a claim
// about our content; the page a search engine returns is the claim a visitor
// reads. This is the third half, and the only one that does not depend on anyone
// remembering to look.
//
// It asks two questions on a schedule, and the schedule decides how deep it
// goes: every day the web results for the person and for the product (two
// credits), every week the same plus the literal domain and Google Images
// (five credits). Two subjects, because Google treats them separately:
//   * the person - what comes up when someone searches the name. The alarm here
//     is the retired name appearing in a title, a snippet, a link or an answer
//     box, which is exactly how the old employer was still being described.
//   * the product - what comes up for the current name and domain. Same alarm,
//     plus a visibility report: whether our own properties appear at all, and at
//     which position. Dropping out of the results for our own name is worth
//     seeing without being a failure.
//
// The constraint that shapes the file: it must not contain a retired token.
// scripts/test-brand.mjs keeps the exemption list in check-brand.mjs closed at
// two files, so a gate can never be neutralised by adding an exception - and a
// monitor for a name is the most tempting place to add one. The tokens are read
// out of the guard instead of copied here, same as check-external-brand.mjs:
// one source of truth, and a rename still has exactly one place to touch.
//
// Cost, because a monitor nobody can afford is a monitor nobody runs. Every
// request is one search credit, and the two modes are sized so the month fits
// comfortably inside the free plan (250 searches/month when this was written,
// 50/hour):
//
//   daily   2 web queries  -> 2 credits x 31 days  = 62
//   weekly  3 web + 2 image -> 5 credits x 4 weeks = 20
//   total                            82 of 250
//
// The real number is printed at the end of every run (`searches: N`), so the
// arithmetic can be checked against the dashboard instead of taken on trust.
//
// What a clean verdict means, exactly: no retired token appears in what Google
// returned for these queries, from this locale, in these positions. It is not
// "the brand is healthy" - Google ranks differently per country, per device and
// per person, and a headless query is one more data point, not the truth. That
// limitation is in the report, not hidden behind a green check.
//
// Exit codes, mirroring check-external-brand.mjs so the workflow can tell three
// different things apart:
//   0  nothing retired came back
//   1  a retired token came back (this is the alarm)
//   2  nothing was found, but the run is incomplete: no API key, a request
//      failure, or a payload this script does not recognise
//
// Usage:
//   SEARCH_WATCH_MODE=weekly SERPAPI_KEY=... node scripts/check-search-brand.mjs
//
// `SEARCH_WATCH_MODE` is `daily` (web only) or `weekly` (web + images).
// `SEARCH_WATCH_GL` / `SEARCH_WATCH_HL` set the Google locale (default `it` /
// `en`): a different locale is a different set of results, and the one to check
// is the one the audience uses.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const guard = join(root, "scripts", "check-brand.mjs");

// Un errore imprevisto non deve mai assomigliare a un allarme.
//
// `exit 1` significa "Google ha tornato il nome ritirato", e Node esce con 1
// anche su un'eccezione non catturata: un crash nel mezzo avrebbe fatto
// annotare al workflow il messaggio sbagliato per un problema reale, e un
// incidente non diagnostica se stesso. Quindi 3, che il workflow distingue.
process.on("uncaughtException", (error) => {
  console.error(`search-watch: the monitor itself failed: ${error?.stack || error}`);
  process.exit(3);
});
process.on("unhandledRejection", (error) => {
  console.error(`search-watch: the monitor itself failed: ${error?.stack || error}`);
  process.exit(3);
});

const TIMEOUT_MS = 20_000;

// Un UA descrittivo e non un browser travestito, come in
// check-external-brand.mjs: non serve a nulla fingersi Chrome, rende solo il
// traffico piu' difficile da attribuire.
const UA = "Mozilla/5.0 (compatible; brand-watch/1.0; +https://mattiaciuni.com/)";

/**
 * Legge i token dal guard invece di ridichiararli.
 *
 * Se non riesce a trovarli, si ferma: un monitor che gira con una lista vuota
 * direbbe "tutto pulito" per sempre, che e' il modo peggiore di fallire. Stessa
 * forma attesa di check-external-brand.mjs, quindi le due restano in passo.
 */
function readTokens() {
  let source;
  try {
    source = readFileSync(guard, "utf8");
  } catch (error) {
    console.error(`search-watch: cannot read ${guard} (${error.message})`);
    process.exit(2);
  }

  const retiredBlock = source.match(/const retired = \[([^\]]*)\];/);
  const currentBlock = source.match(/const current = \{ name: "([^"]+)", domain: "([^"]+)" \};/);
  if (!retiredBlock || !currentBlock) {
    console.error("search-watch: cannot parse the brand tokens out of scripts/check-brand.mjs.");
    console.error("  Refusing to run with an empty token list: that would report a clean bill of health forever.");
    process.exit(2);
  }

  const retired = [...retiredBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  if (!retired.length) {
    console.error("search-watch: scripts/check-brand.mjs declares no retired brand, so there is nothing to watch.");
    process.exit(2);
  }
  return { retired, current: { name: currentBlock[1], domain: currentBlock[2] } };
}

const { retired, current } = readTokens();

/**
 * Il nome della persona, letto dove il sito lo dichiara.
 *
 * `lib/site.ts` è la fonte: è quello che finisce nei metadata, nei JSON-LD e
 * nell'indice, quindi cercare il *vecchio* nome mentre la ricerca va sul nome
 * *attuale* coincide solo se le due righe restano in passo. Stessa disciplina
 * di readTokens: se non lo trova, non inventa una query, si ferma.
 */
function readPersonName() {
  let source;
  try {
    source = readFileSync(join(root, "lib", "site.ts"), "utf8");
  } catch (error) {
    console.error(`search-watch: cannot read lib/site.ts (${error.message})`);
    process.exit(2);
  }
  const match = source.match(/const siteDefaults = \{[\s\S]*?\n\s*name: "([^"]+)"/);
  if (!match || !match[1].trim()) {
    console.error('search-watch: cannot read the person name out of lib/site.ts (expected `const siteDefaults = {` then `name: "..."`).');
    process.exit(2);
  }
  return match[1].trim();
}

const person = readPersonName();

// `||` e non `??`: il workflow passa le variabili d'ambiente anche quando non
// sono definite, e in quel caso arrivano come stringa vuota - che con `??`
// sostituirebbe il default e farebbe partire una ricerca con `gl=` vuoto.
const mode = (process.env.SEARCH_WATCH_MODE || "daily").toLowerCase();
if (!["daily", "weekly"].includes(mode)) {
  console.error(`search-watch: unknown SEARCH_WATCH_MODE "${mode}" (expected daily or weekly).`);
  process.exit(2);
}

const gl = (process.env.SEARCH_WATCH_GL || "it").toLowerCase();
const hl = (process.env.SEARCH_WATCH_HL || "en").toLowerCase();

const apiKey = (process.env.SERPAPI_KEY ?? "").trim();
if (!apiKey) {
  console.error("search-watch: SERPAPI_KEY is not configured, so Google was not asked anything.");
  console.error("  This run reports no verdict. Create a key at https://serpapi.com/ (free plan: 250 searches/month)");
  console.error("  and add it as the SERPAPI_KEY repository secret; the workflow picks it up by itself.");
  process.exit(2);
}

// Il provider di default, e un gancio per provarlo davvero.
//
// Senza poter cambiare endpoint l'unica prova possibile sarebbe "esce senza
// errori": il ramo che conta - il token ritirato nei risultati - resterebbe
// mai eseguito, e si finisce per dare per scontato l'unica cosa che deve
// funzionare. Con una risposta di prova si prova l'allarme nella sua forma
// esatta, con gli stessi byte che arriverebbero da Google.
const endpoint = process.env.SEARCH_WATCH_ENDPOINT || "https://serpapi.com/search.json";

// Le query non contengono il nome ritirato: e' la domanda a doverlo *trovare*
// nei risultati, non a provocarlo. Quattro domande, due soggetti: la persona e
// il prodotto sono due entita' separate e Google le tratta separate.
const queries = [
  { kind: "web", q: `"${person}"`, why: "il nome della persona" },
  { kind: "web", q: `"${current.name}"`, why: "il nome del prodotto" },
];

// Il settimanale aggiunge il dominio completo nella ricerca e le immagini:
// costano altri crediti e vale la pena solo con cadenza bassa.
if (mode === "weekly") {
  queries.push({ kind: "web", q: current.domain, why: "il dominio cosi' come lo si scrive" });
  queries.push(
    { kind: "images", q: `"${person}"`, why: "le immagini legate al nome" },
    { kind: "images", q: `"${current.name}"`, why: "le immagini legate al prodotto" },
  );
}

const findings = [];
const reports = [];
const selfHits = [];
let searches = 0;

for (const query of queries) {
  const engine = query.kind === "images" ? "google_images" : "google";
  const url = new URL(endpoint);
  url.searchParams.set("engine", engine);
  url.searchParams.set("q", query.q);
  url.searchParams.set("num", "10");
  url.searchParams.set("hl", hl);
  url.searchParams.set("gl", gl);
  url.searchParams.set("api_key", apiKey);
  searches += 1;

  let response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": UA, accept: "application/json" },
    });
  } catch (error) {
    console.error(`search-watch: ${query.kind} "${query.q}" could not be fetched (${error.message}).`);
    process.exit(2);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    console.error(`search-watch: ${query.kind} "${query.q}" did not return JSON (HTTP ${response.status}).`);
    process.exit(2);
  }

  if (!response.ok || payload?.error) {
    const detail = payload?.error ?? `HTTP ${response.status}`;
    console.error(`search-watch: ${query.kind} "${query.q}" answered an error: ${detail}`);
    console.error("  No verdict for this run: an error page is not a clean result.");
    process.exit(2);
  }

  // Un payload senza il campo che ci aspettiamo e' "non ho capito", non "pulito".
  const rows = query.kind === "images" ? payload.images_results : payload.organic_results;
  if (!Array.isArray(rows)) {
    console.error(`search-watch: ${query.kind} "${query.q}" returned a payload without ${query.kind === "images" ? "images_results" : "organic_results"}.`);
    console.error("  The engine changed shape or the account lacks that engine; refusing to call it a pass.");
    process.exit(2);
  }

  // Le righe visibili, per il report: il senso di questo controllo e' vedere
  // cosa c'e', non solo assicurarsi che non ci sia il vecchio nome.
  const visible = rows.slice(0, 10).map((row, index) => ({
    position: index + 1,
    title: (row.title ?? "").replace(/\s+/g, " ").trim(),
    link: row.link ?? row.original ?? "",
  }));

  // L'allarme: il token ritirato in qualsiasi cosa Google ha restituito per
  // questa query. Si guarda il payload intero e non solo le righe, perche'
  // l'answer box e la knowledge graph sono esattamente dove un vecchio datore
  // di lavoro viene descritto — e non compaiono mai in organic_results.
  // `search_parameters` escluso: e' il riecheggio della richiesta, e non e'
  // risultato. Se ci fosse dentro, la query stessa falserebbe il controllo.
  const echoed = { ...payload };
  delete echoed.search_parameters;
  const json = JSON.stringify(echoed);
  for (const token of retired) {
    // La ricerca e' sul testo originale e con un indice che appartiene a quel
    // testo: un `toLowerCase()` sul payload intero puo' cambiare la lunghezza
    // delle stringhe e spostare ogni match rispetto al contesto che poi si
    // stampa. La regex con `i` tiene insieme il confronto e la posizione.
    const match = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").exec(json);
    if (!match) continue;
    findings.push({ query, context: contextAround(json, match.index) });
    break; // un ritrovamento per query basta: l'allarme e' che ci sia, non quante volte
  }

  // Dove compaiono le nostre pagine: informativo, mai un fallimento.
  visible.forEach((row) => {
    try {
      const host = new URL(row.link).host.toLowerCase().replace(/^www\./, "");
      if (host === current.domain || host === "mattiaciuni.com") {
        selfHits.push({ query: query.q, position: row.position, host, title: row.title });
      }
    } catch {
      /* un link non assoluto non e' un host, e non e' comunque nostro */
    }
  });

  reports.push({ query, visible, total: rows.length });
}

/** La riga che contiene il match, accorciata: un report si legge, non si decodifica. */
function contextAround(text, index, width = 200) {
  const from = Math.max(0, index - 60);
  return text.slice(from, index + width).replace(/\s+/g, " ");
}

const label = mode === "weekly" ? "weekly (web + images)" : "daily (web)";
console.log(`search-watch: mode ${label}, locale gl=${gl} hl=${hl}, ${searches} search credit(s)`);
console.log(`watching ${retired.length} retired name(s) across ${queries.length} quer(ies)`);

for (const report of reports) {
  // Nessuna virgolette aggiunte: le query con piu' parole arrivano gia'
  // quotate, e racchiuderle di nuovo ha prodotto `web ""Nome""` — brutto da
  // leggere e abbastanza lontano da far fallire un asserzione sul testo.
  console.log(`\n  ${report.query.kind} ${report.query.q} — ${report.total} result(s)`);
  for (const row of report.visible.slice(0, 5)) {
    console.log(`    ${String(row.position).padStart(2)}. ${row.title || "(senza titolo)"}`);
    if (row.link) console.log(`        ${row.link}`);
  }
  if (report.visible.length > 5) console.log(`    … ${report.total - 5} altri`);
}

if (selfHits.length) {
  console.log("\n  le nostre pagine nei risultati:");
  for (const hit of selfHits) console.log(`    pos ${hit.position}  ${hit.host}  (${hit.query})`);
} else {
  console.log("\n  nessuna pagina nostra nei primi 10 risultati segnalati");
}

for (const finding of findings) {
  console.error(`\n  FOUND     ${finding.query.kind} ${finding.query.q}`);
  console.error(`            ${finding.context}`);
  console.error(`            ${finding.query.why}`);
}

const summary = `search-watch: ${searches} search(es), ${findings.length} carrying the retired name`;

if (findings.length) {
  console.error(`FAIL search-watch: Google is still returning the retired name.`);
  console.error(`  ${summary}`);
  console.error("  An index only changes when the source behind it does: fix the page that earns the result, then wait.");
  process.exit(1);
}

console.log(`\nPASS search-watch: no retired name in what Google returned.`);
console.log(`  ${summary}`);
console.log(
  "  This is one headless query from one locale, not a ranking guarantee: results vary by country and by person.",
);
process.exit(0);
