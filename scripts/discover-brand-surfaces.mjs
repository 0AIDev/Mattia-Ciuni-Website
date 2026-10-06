// Contract: find the surfaces nobody wrote down.
//
// The other two monitors share a blind spot, and it is not a small one: both
// look at a list of URLs that a person assembled by hand. A card on a directory
// site, an interview on a blog, a profile on a platform nobody here has heard
// of - all of them can repeat the retired job title forever, and neither monitor
// will ever look at them, because neither has ever heard of them either. A list
// you wrote can only find what you already knew.
//
// Exa answers a different question from the other two services. SerpAPI shows
// what a search engine displays for a query, Tavily reads a page you name, and
// this asks "what is out there about this name" and returns pages that were
// never in anyone's list. Same three roles, three different failure modes:
// this one cannot tell you that a page is wrong, only that it exists.
//
// Which is why it hands its output to the reader instead of judging it. A
// discovered page is printed as a ready-to-paste `BRAND_READ_URLS` value for
// scripts/check-brand-reading.mjs: the loop closes as find (Exa) -> read
// (Tavily) -> decide (a person). The one judgement this script does make is the
// cheapest one available: a retired token in a title or a URL is a finding, and
// that is an alarm like everywhere else.
//
// Cost: Exa bills search per request against a monthly credit balance (the free
// tier resets it every month), and asking for titles and URLs only - no page
// contents - is the cheapest shape of a search. Page text is not asked for here
// because that is the reader's job and paying for it twice would be paying for
// the same bytes with two providers.
//
// Exit codes, the same three the other monitors use:
//   0  ran, and no retired token came back (new surfaces may still have been found)
//   1  a retired token came back in a title or a URL (this is the alarm)
//   2  nothing was found, but there is no verdict: no key, a failed request
//      or a payload this script does not recognise
//
// Usage:
//   EXA_API_KEY=... node scripts/discover-brand-surfaces.mjs
//   EXA_API_KEY=... node scripts/discover-brand-surfaces.mjs --json

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));

const TIMEOUT_MS = 30_000;

// Un errore imprevisto non deve assomigliare a un allarme: `exit 1` significa
// "il nome ritirato e' pubblicato", e Node esce con 1 anche su un'eccezione non
// catturata.
process.on("uncaughtException", (error) => {
  console.error(`brand-discovery: the monitor itself failed: ${error?.stack || error}`);
  process.exit(3);
});
process.on("unhandledRejection", (error) => {
  console.error(`brand-discovery: the monitor itself failed: ${error?.stack ?? error}`);
  process.exit(3);
});

/** I token dal guard: un rinominamento ha un solo posto da toccare. */
function readTokens() {
  let source;
  try {
    source = readFileSync(join(root, "scripts", "check-brand.mjs"), "utf8");
  } catch (error) {
    console.error(`brand-discovery: cannot read scripts/check-brand.mjs (${error.message})`);
    process.exit(2);
  }
  const retiredBlock = source.match(/const retired = \[([^\]]*)\];/);
  const currentBlock = source.match(/const current = \{ name: "([^"]+)", domain: "([^"]+)" \};/);
  if (!retiredBlock || !currentBlock) {
    console.error("brand-discovery: cannot parse the brand tokens out of scripts/check-brand.mjs.");
    console.error("  Refusing to run with an empty token list: that would report a clean bill of health forever.");
    process.exit(2);
  }
  const retired = [...retiredBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  if (!retired.length) {
    console.error("brand-discovery: scripts/check-brand.mjs declares no retired brand, so there is nothing to look for.");
    process.exit(2);
  }
  return { retired, current: { name: currentBlock[1], domain: currentBlock[2] } };
}

const { retired, current } = readTokens();

/** Il nome della persona, dove il sito lo dichiara. */
function readPersonName() {
  const source = readFileSync(join(root, "lib", "site.ts"), "utf8");
  const match = source.match(/const siteDefaults = \{[\s\S]*?\n\s*name: "([^"]+)"/);
  if (!match || !match[1].trim()) {
    console.error('brand-discovery: cannot read the person name out of lib/site.ts (expected `const siteDefaults = {` then `name: "..."`).');
    process.exit(2);
  }
  return match[1].trim();
}

const person = readPersonName();

const apiKey = (process.env.EXA_API_KEY || "").trim();
if (!apiKey) {
  console.error("brand-discovery: EXA_API_KEY is not configured, so the open web was not asked anything.");
  console.error("  This run reports no verdict. Create a key at https://exa.ai/ (free tier: monthly credits, no card)");
  console.error("  and add it as the EXA_API_KEY repository secret; the workflow picks it up by itself.");
  process.exit(2);
}

// Sostituibile per prova, come negli altri due: senza, l'unico esito
// verificabile sarebbe "esce senza errori".
const endpoint = process.env.EXA_ENDPOINT || "https://api.exa.ai/search";

/**
 * Gli host che conosciamo gia', letti dai due file che li tengono.
 *
 * Non e' un elenco ridigitato: sono gli stessi URL che gli altri due monitor
 * sorvegliano, quindi una superficie gia' in elenco non viene riportata come
 * scoperta. Le due copie restano legate da un controllo di scripts/verify.js.
 */
function knownHosts() {
  const hosts = new Set([current.domain, `www.${current.domain}`, "mattiaciuni.com", "www.mattiaciuni.com"]);
  for (const file of ["check-external-brand.mjs", "check-brand-reading.mjs"]) {
    let source;
    try {
      source = readFileSync(join(root, "scripts", file), "utf8");
    } catch {
      continue; // un monitor assente non rende ignorante questo, lo rende meno preciso
    }
    for (const match of source.matchAll(/url:\s*"(https?:\/\/[^"]+)"/g)) {
      try {
        hosts.add(new URL(match[1]).host.toLowerCase());
      } catch {
        /* un URL non assoluto non ha un host da confrontare */
      }
    }
  }
  return hosts;
}

const known = knownHosts();

// Le due domande, separate come negli altri monitor: la persona e il prodotto
// non sono la stessa entita' per un motore di ricerca.
const queries = [
  { q: person, why: "la persona" },
  { q: `${current.name} ${current.domain}`, why: "il prodotto e il suo dominio" },
];

const findings = [];
const discovered = [];
let searches = 0;

for (const query of queries) {
  searches += 1;
  let payload;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "content-type": "application/json", accept: "application/json", "x-api-key": apiKey },
      // Solo titoli e URL: il testo delle pagine lo legge l'altro monitor, con
      // l'altro fornitore, e chiederlo due volte e' pagare due volte gli stessi byte.
      body: JSON.stringify({ query: query.q, numResults: 10, type: "auto" }),
    });
    payload = await response.json();
    if (!response.ok || payload?.error) {
      const detail = payload?.error ?? `HTTP ${response.status}`;
      console.error(`brand-discovery: Exa answered an error for "${query.q}": ${JSON.stringify(detail).slice(0, 200)}`);
      console.error("  No verdict for this run: an error page is not a clean result.");
      process.exit(2);
    }
  } catch (error) {
    console.error(`brand-discovery: the request for "${query.q}" failed (${error.message}).`);
    process.exit(2);
  }

  if (!Array.isArray(payload?.results)) {
    console.error(`brand-discovery: the payload for "${query.q}" has no \`results\` array.`);
    console.error("  The engine changed shape or the key lacks access; refusing to call it a pass.");
    process.exit(2);
  }

  for (const row of payload.results) {
    const title = typeof row?.title === "string" ? row.title.replace(/\s+/g, " ").trim() : "";
    const url = typeof row?.url === "string" ? row.url : "";

    // L'unico giudizio che questo script si permette: il nome ritirato nel
    // titolo o nell'URL. Il corpo della pagina lo legge l'altro monitor.
    for (const token of retired) {
      const pattern = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const where = pattern.test(title) ? `titled "${title}"` : pattern.test(url) ? `at ${url}` : null;
      if (where) {
        findings.push({ query, token, url, title, context: `the retired name appears ${where}` });
        break;
      }
    }

    if (!url) continue;
    let host;
    try {
      host = new URL(url).host.toLowerCase();
    } catch {
      continue;
    }
    if (known.has(host)) continue;
    discovered.push({ query: query.q, why: query.why, host, url, title });
  }
}

console.log(`brand-discovery: ${searches} Exa search(es) against ${known.size} known host(s)`);

if (discovered.length) {
  console.log(`\n  superfici non in elenco (${discovered.length}):`);
  for (const entry of discovered) {
    console.log(`    ${entry.host}  (${entry.why})`);
    console.log(`      ${entry.url}`);
    if (entry.title) console.log(`      ${entry.title.slice(0, 120)}`);
  }
  // Il ponte verso l'altro monitor: la scoperta è l'ingresso della lettura.
  // Copiare e incollare questa riga è il passo che chiude l'anello, ed è scritto
  // in una forma che si incolla senza modifiche.
  const urls = [...new Set(discovered.map((entry) => entry.url))];
  console.log("\n  per leggerle con Tavily (accetta fino a 20 URL per giro):");
  console.log(`    BRAND_READ_URLS="${urls.slice(0, 20).join(" ")}" npm run check:brand-reading`);
} else {
  console.log("\n  nessuna superficie fuori dall'elenco: i due monitor guardano gia' tutto quello che è emerso");
}

for (const finding of findings) {
  console.error(`\n  FOUND     ${finding.context}`);
  console.error(`            ${finding.url}`);
  console.error(`            ${finding.query.why}`);
}

const summary = `brand-discovery: ${searches} search(es), ${discovered.length} surface(s) outside the known list, ${findings.length} carrying the retired name`;

if (findings.length) {
  console.error("FAIL brand-discovery: a page with the retired name was found outside the watched list.");
  console.error(`  ${summary}`);
  console.error("  Fix the page, then add it to the watched list so it cannot come back unnoticed.");
  process.exit(1);
}

console.log("\nPASS brand-discovery: no retired name in anything the open web returned.");
console.log(`  ${summary}`);
console.log("  A pass here means nothing bad was *found*: it is a wider net, not a complete one.");
