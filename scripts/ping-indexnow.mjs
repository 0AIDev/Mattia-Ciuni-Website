import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Annuncia a IndexNow (Bing, Yandex, Seznam e gli altri che lo leggono) **le
// pagine che questa build ha pubblicato oggi**, non un elenco fisso.
//
// La versione precedente mandava sempre gli stessi cinque indirizzi: `/`,
// `/thoughts/`, `/notes/`, `/sitemap.xml`, `/news-sitemap.xml`. Il risultato era
// che un articolo nuovo non veniva mai annunciato davvero, e che il servizio
// riceveva un segnale a ogni deploy anche quando non era cambiato niente. Un
// segnale che arriva sempre è un segnale che si può ignorare.
//
// Gli indirizzi nuovi si leggono dall'**export**, non da un registro di
// codice: questo file è Node puro e non può importare TypeScript, mentre
// `out/sitemap-*.xml` è già il risultato di tutte le regole del sito, filtro
// per data compreso. Se un pezzo ha la data di oggi, la sua `<lastmod>` è oggi,
// e questo script non deve sapere perché.
//
// Google non è su IndexNow, e non esiste un'API per chiedere l'indicizzazione di
// un singolo URL: l'Indexing API di Google è riservata per policy agli annunci
// di lavoro e agli eventi, e usarla per gli articoli è una violazione che non
// porta indicizzazione. Per Google l'annuncio è il sitemap che cambia, e a
// dirlo è `scripts/submit-google-sitemap.mjs`, che usa la Sitemap API.

const out = join(process.cwd(), "out");
const home = join(out, "index.html");
if (!existsSync(home)) {
  console.log("indexnow: skipped (build output is missing)");
  process.exit(0);
}
const origin = (readFileSync(home, "utf8").match(/<link rel="canonical" href="([^"]+)"/)?.[1] || "")
  .replace(/\/$/, "");
if (!/^https:\/\//.test(origin)) {
  console.warn("indexnow: skipped (the export has no absolute production canonical)");
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
const publishedToday = [];
for (const file of ["sitemap-thoughts.xml", "sitemap-notes.xml", "sitemap-feedback.xml"]) {
  const path = join(out, file);
  if (!existsSync(path)) continue;
  const xml = readFileSync(path, "utf8");
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) {
    if (match[2] !== today) continue;
    // L'indice della sezione compare con la data di oggi perché contiene il
    // pezzo nuovo, ed è giusto annunciarlo: è la pagina da cui si arriva.
    publishedToday.push(match[1]);
  }
}

const key = process.env.INDEXNOW_KEY?.trim();
if (!key) {
  console.log("indexnow: skipped (INDEXNOW_KEY is not configured)");
  process.exit(0);
}

mkdirSync(out, { recursive: true });
writeFileSync(join(out, `${key}.txt`), key + "\n", "utf8");

// Niente di nuovo: non si annuncia niente. Il file della chiave è già stato
// riscritto perché serve comunque alla verifica dell'host.
if (!publishedToday.length) {
  console.log(`indexnow: nothing published today (${today}), no ping sent`);
  process.exit(0);
}

const urls = [...new Set([...publishedToday, `${origin}/sitemap.xml`])];
const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(origin).hostname,
    key,
    keyLocation: `${origin}/${key}.txt`,
    urlList: urls,
  }),
});
if (!response.ok && response.status !== 202) {
  console.warn(`indexnow: provider returned ${response.status}; build continues`);
} else {
  console.log(`indexnow: submitted ${urls.length} URL(s) published today (${today})`);
}
