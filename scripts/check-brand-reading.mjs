// Contract: read the pages that refuse to be read, and say whether they carry
// the retired name.
//
// check-external-brand.mjs fetches every watched surface with a plain HTTP
// request, on purpose: no dependencies, no credentials, so it always runs. The
// price of that choice is a hole it declares out loud - LinkedIn answers 999,
// Medium and Crunchbase answer 403 - and those surfaces are exactly the ones
// that repeat a job title. The monitor reports them as `unverified` and exits 2,
// which is honest and still leaves the question open: the profile that most
// needs checking is the one nobody can read.
//
// This is the other half, and it is a separate file for that reason. The
// credential-free baseline stays credential-free; a service that can read a page
// through a real browser is asked only for the surfaces the plain fetch could
// not open. If the key is missing, nothing here pretends otherwise: exit 2, and
// the baseline monitor keeps working exactly as before.
//
// Tavily is used for read-and-extract, not for search: the same service is
// billed 1 credit per 5 successfully extracted URLs, so the whole list below
// costs one credit per run. The key is a secret and never travels in a
// tracked file.
//
// What a clean verdict means, exactly: the extracted text of that page does not
// contain a retired token. Extraction can be partial on a page that hides
// content behind a client render, so a pass here is evidence, not proof - which
// is the same caveat the baseline monitor declares, and the reason the two are
// read together rather than either alone.
//
// Exit codes, the same three the other two monitors use:
//   0  every surface that was read is clean
//   1  a retired token was found on a surface (this is the alarm)
//   2  nothing was found, but at least one surface could not be read
//
// Usage:
//   TAVILY_API_KEY=... node scripts/check-brand-reading.mjs
//   BRAND_READ_URLS="https://example.com/x" TAVILY_API_KEY=... node scripts/check-brand-reading.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const guard = join(root, "scripts", "check-brand.mjs");

const TIMEOUT_MS = 30_000;

// Un errore imprevisto non deve assomigliare a un allarme: `exit 1` significa
// "il nome ritirato e' pubblicato", e Node esce con 1 anche su un'eccezione non
// catturata. Un incidente che si traveste da scoperta non si diagnostica.
process.on("uncaughtException", (error) => {
  console.error(`brand-reading: the monitor itself failed: ${error?.stack || error}`);
  process.exit(3);
});
process.on("unhandledRejection", (error) => {
  console.error(`brand-reading: the monitor itself failed: ${error?.stack || error}`);
  process.exit(3);
});

/** I token dal guard, non ridichiarati: un rinominamento ha un solo posto. */
function readTokens() {
  let source;
  try {
    source = readFileSync(guard, "utf8");
  } catch (error) {
    console.error(`brand-reading: cannot read ${guard} (${error.message})`);
    process.exit(2);
  }
  const retiredBlock = source.match(/const retired = \[([^\]]*)\];/);
  const currentBlock = source.match(/const current = \{ name: "([^"]+)", domain: "([^"]+)" \};/);
  if (!retiredBlock || !currentBlock) {
    console.error("brand-reading: cannot parse the brand tokens out of scripts/check-brand.mjs.");
    console.error("  Refusing to run with an empty token list: that would report a clean bill of health forever.");
    process.exit(2);
  }
  const retired = [...retiredBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  if (!retired.length) {
    console.error("brand-reading: scripts/check-brand.mjs declares no retired brand, so there is nothing to read for.");
    process.exit(2);
  }
  return { retired, current: { name: currentBlock[1], domain: currentBlock[2] } };
}

const { retired } = readTokens();

const apiKey = (process.env.TAVILY_API_KEY || "").trim();
if (!apiKey) {
  console.error("brand-reading: TAVILY_API_KEY is not configured, so the blocked pages were not read.");
  console.error("  This run reports no verdict. The credential-free monitor (check-external-brand.mjs) still runs");
  console.error("  and still reports these surfaces as `unverified`; this file only adds the reading of them.");
  process.exit(2);
}

// L'endpoint e' sostituibile per prova, come in check-search-brand.mjs: senza,
// l'unica cosa verificabile sarebbe "esce senza errori".
const endpoint = process.env.BRAND_READ_ENDPOINT || "https://api.tavily.com/extract";

/**
 * Le superfici che il recupero semplice non riesce ad aprire.
 *
 * Ognuna e' qui perche' risponde 403 o 999 a una richiesta senza browser, e
 * ognuna e' una pagina che ripete la carica. L'elenco e' chiuso di proposito:
 * aggiungerne una e' una decisione. Un controllo di scripts/verify.js verifica
 * che ogni URL di questo elenco sia anche fra i target di
 * check-external-brand.mjs, cosi' le due liste non possono divergere.
 */
const BLOCKED_SURFACES = [
  {
    url: "https://www.linkedin.com/in/mattiaciuni/",
    why: "il profilo e' nel sameAs del JSON-LD del sito, ed e' la pagina che risponde a una ricerca sul nome",
  },
  {
    url: "https://medium.com/@mattiaciuni/about",
    why: "la bio pubblica, indicizzata e citata dagli assistenti",
  },
  {
    url: "https://fazier.com/p/mattiaciuni",
    why: "una scheda di terze parti che ha ripetuto la carica vecchia",
  },
];

const extra = (process.env.BRAND_READ_URLS ?? "")
  .split(/[\s,]+/)
  .filter(Boolean)
  .map((url) => ({ url, why: "target aggiunto da BRAND_READ_URLS" }));

const surfaces = [...BLOCKED_SURFACES, ...extra];
const urls = surfaces.map((surface) => surface.url);

/** La riga che contiene il match, accorciata: un report si legge, non si decodifica. */
function contextAround(text, index, width = 180) {
  const from = Math.max(0, index - 60);
  return text.slice(from, index + width).replace(/\s+/g, " ");
}

let payload;
try {
  const response = await fetch(endpoint, {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "content-type": "application/json", accept: "application/json" },
    // `advanced` e non `basic`, e la ragione e' una misura, non una preferenza:
    // il primo giro vero (6 ottobre) ha mostrato che il basic legge LinkedIn
    // (13.313 caratteri) ma su Medium risponde "Failed to fetch url", mentre
    // l'avanzato legge entrambe. Costa 2 crediti ogni 5 URL invece di 1, cioe'
    // 2 crediti per giro con questa lista e ~60 al mese su 1.000: il livello
    // che legge davvero costa quattro centesimi di niente in piu'.
    body: JSON.stringify({ api_key: apiKey, urls, extract_depth: "advanced" }),
  });
  payload = await response.json();
  if (!response.ok || payload?.error || payload?.detail) {
    const detail = payload?.error ?? payload?.detail ?? `HTTP ${response.status}`;
    console.error(`brand-reading: Tavily answered an error: ${JSON.stringify(detail).slice(0, 200)}`);
    console.error("  No verdict for this run: an error page is not a clean page.");
    process.exit(2);
  }
} catch (error) {
  console.error(`brand-reading: the request failed (${error.message}).`);
  process.exit(2);
}

// Un payload senza `results` non e' "pulito": e' "non ho capito".
if (!Array.isArray(payload?.results)) {
  console.error("brand-reading: the response has no `results` array, so the shape is not the one this script reads.");
  console.error("  Refusing to call an unrecognised payload a pass.");
  process.exit(2);
}

/**
 * Una chiave di confronto tollerante per gli URL.
 *
 * Un confronto per stringa esatta sembrava sufficiente e non lo e': il fornitore
 * normalizza, quindi la stessa pagina puo' tornare con o senza la barra finale e
 * l'uguaglianza fallisce **in silenzio** - una pagina letta benissimo veniva
 * riportata come "non letta", che e' un falso allarme nello stesso punto in cui
 * il monitor deve essere affidabile. Il primo giro vero ha prodotto esattamente
 * questo sospetto, quindi ora si confronta su una forma normalizzata.
 */
const urlKey = (value) => {
  try {
    const parsed = new URL(value);
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.host.toLowerCase().replace(/^www\./, "")}${path}`;
  } catch {
    return String(value).replace(/\/+$/, "").toLowerCase();
  }
};

const findings = [];
const clean = [];
const unread = [];

const seen = new Map(payload.results.map((row) => [urlKey(row.url), row]));
const failures = new Map();
for (const failed of Array.isArray(payload.failed_results) ? payload.failed_results : []) {
  const url = typeof failed === "string" ? failed : failed?.url;
  if (!url) continue;
  failures.set(urlKey(url), typeof failed === "object" && failed?.error ? String(failed.error) : "no text");
}

for (const surface of surfaces) {
  const key = urlKey(surface.url);
  const row = seen.get(key);

  // "Non e' tornata" e "e' tornata vuota" sono due cose diverse, e riportarle
  // con la stessa frase manda a cercare il problema nel posto sbagliato. La
  // prima e' un guasto della lettura, la seconda e' una pagina che non si lascia
  // leggere.
  if (!row) {
    const reason = failures.get(key);
    unread.push({
      ...surface,
      reason: reason ? `Tavily could not read it (${reason})` : "Tavily did not return this URL at all",
    });
    continue;
  }
  if (typeof row.raw_content !== "string" || !row.raw_content.trim()) {
    unread.push({ ...surface, reason: "returned no text" });
    continue;
  }

  // La ricerca e' sul testo e con un indice che appartiene a quel testo: la
  // regex con `i` tiene insieme il confronto e la posizione del contesto.
  const content = row.raw_content;
  let hit = null;
  for (const token of retired) {
    const match = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").exec(content);
    if (match) {
      hit = { token, context: contextAround(content, match.index) };
      break;
    }
  }

  if (hit) findings.push({ ...surface, chars: content.length, ...hit });
  else clean.push({ ...surface, chars: content.length });
}

console.log(`brand-reading: asked Tavily to read ${surfaces.length} blocked surface(s)`);

for (const entry of clean) {
  console.log(`  ok         ${entry.url} (${entry.chars} chars) - ${entry.why}`);
}

for (const entry of unread) {
  console.log(`  unread     ${entry.url}: ${entry.reason} - ${entry.why}`);
}

for (const finding of findings) {
  console.error(`  FOUND      ${finding.url}`);
  console.error(`             ${finding.context}`);
  console.error(`             ${finding.why}`);
}

const summary = `brand-reading: ${clean.length} read and clean, ${unread.length} could not be read, ${findings.length} carried the retired name`;

if (findings.length) {
  console.error("FAIL brand-reading: the retired name is published on a surface a reader can open.");
  console.error(`  ${summary}`);
  process.exit(1);
}

if (unread.length) {
  console.log("WARN brand-reading: nothing found, but the reading is incomplete.");
  console.log(`  ${summary}`);
  console.log("  A surface that returns no text is not a pass: it is the same gap as before, one layer up.");
  process.exit(2);
}

console.log("PASS brand-reading: every blocked surface was read and carries no retired name.");
console.log(`  ${summary}`);
