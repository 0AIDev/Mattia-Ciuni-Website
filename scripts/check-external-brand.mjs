// Contract: the retired brand must not reappear on a surface we can influence.
//
// check-brand.mjs guarantees the repository never *says* the old name. It cannot
// see anything outside the repository, and the name kept coming back from
// outside: a company site still serving under the previous brand, the same
// profile heads on third-party platforms, and a search index holding a
// month-old snapshot of a host that now redirects. The repository can be
// spotless and the answer a search engine gives about Mattia still be wrong.
// This is the half that looks outwards.
//
// The constraint that shapes the whole file: it must not *contain* a retired
// token. scripts/test-brand.mjs keeps the exemption list in check-brand.mjs
// closed at two files, on purpose, so that a gate can never be neutralised by
// adding an exception - and a monitor for a name is the most tempting place to
// add one. So the tokens are read out of the guard instead of copied here: one
// source of truth, and a rename still has exactly one place to touch.
//
// No dependencies and no credentials, on purpose: this runs on a schedule from
// a workflow that installs nothing, and every check is a public HTTP request.
//
// What a clean verdict means, exactly: the name is absent from the bytes those
// URLs serve. It is not the same as "absent from the page a person sees". A
// client-rendered profile serves a shell first and fills it with script, so it
// can pass here while still showing the old name in a browser - observed on a
// third-party card that answered clean on one run and dirty on another. The
// targets that matter most are the ones we control, and those are server-
// rendered, so the check is exact where it counts; a third-party pass is weaker
// evidence and is not treated as proof.
//
// Exit codes, because the caller has to tell three different things apart:
//   0  every reachable surface is clean
//   1  the retired name was found on a surface (this is the alarm)
//   2  nothing was found, but at least one surface could not be verified
//      (a block page, a 4xx, a timeout), so "clean" is not a claim we can make
//
// Usage:
//   node scripts/check-external-brand.mjs
//   BRAND_WATCH_URLS="https://example.com/x https://example.com/y" node scripts/check-external-brand.mjs
//
// BRAND_WATCH_URLS exists so a host whose own name carries a retired token can
// be watched from the workflow without that string being written into a tracked
// file. A target that cannot be named in the repository can still be checked.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const guard = join(root, "scripts", "check-brand.mjs");

const TIMEOUT_MS = 20_000;

// Un UA descrittivo e non un browser travestito: la maggior parte delle
// piattaforme risponde comunque 403 o 999 a un client che non e' un browser, e
// fingersi Chrome non cambia quel risultato, rende solo il traffico piu' difficile
// da attribuire. Che alcune superfici restino "non verificabili" e' dichiarato
// nel codice di uscita 2, non nascosto dietro un UA finto.
const UA = "Mozilla/5.0 (compatible; brand-watch/1.0; +https://mattiaciuni.com/)";

/**
 * Legge i token dal guard invece di ridichiararli.
 *
 * La regex e' ancorata alla forma esatta che check-brand.mjs usa oggi
 * (`const retired = [...]` e `const current = { name: "...", domain: "..." }`).
 * Se un giorno quel file cambia forma, questo script deve fermarsi gridando:
 * un monitor che non trova i token e continua con una lista vuota direbbe
 * "tutto pulito" per sempre, che e' il modo peggiore di fallire.
 */
function readTokens() {
  let source;
  try {
    source = readFileSync(guard, "utf8");
  } catch (error) {
    console.error(`brand-watch: cannot read ${guard} (${error.message})`);
    process.exit(1);
  }

  const retiredBlock = source.match(/const retired = \[([^\]]*)\];/);
  const currentBlock = source.match(/const current = \{ name: "([^"]+)", domain: "([^"]+)" \};/);
  if (!retiredBlock || !currentBlock) {
    console.error("brand-watch: cannot parse the brand tokens out of scripts/check-brand.mjs.");
    console.error("  Expected `const retired = [...]` and `const current = { name: \"...\", domain: \"...\" };`.");
    console.error("  Refusing to run with an empty token list: that would report a clean bill of health forever.");
    process.exit(1);
  }

  const retired = [...retiredBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  if (!retired.length) {
    console.error("brand-watch: scripts/check-brand.mjs declares no retired brand, so there is nothing to watch.");
    process.exit(1);
  }
  return { retired, current: { name: currentBlock[1], domain: currentBlock[2] } };
}

const { retired, current } = readTokens();

// Gli host che una canonical puo' nominare senza che sia un problema: l'host
// della pagina stessa e l'origine dichiarata del sito. `www` incluso perche' un
// www che raddrizza sulla stessa origine e' corretto, non un secondo sito.
const allowedCanonicalHosts = new Set([
  current.domain,
  `www.${current.domain}`,
  "mattiaciuni.com",
  "www.mattiaciuni.com",
]);

/**
 * Le superfici esterne, e per ognuna perche' e' in elenco.
 *
 * `expects` non e' decorazione: e' il motivo per cui l'URL e' qui, e va scritto
 * come lo scriverebbe chi legge il report alle sette del mattino.
 */
const targets = [
  {
    url: "https://withnoesia.com/",
    why: "la home del prodotto: titolo, descrizione e JSON-LD sono cio' che un motore legge per primo",
  },
  {
    url: "https://withnoesia.com/llms.txt",
    why: "il file di fatti per i knowledge graph: e' la fonte diretta delle risposte degli assistenti",
  },
  {
    url: "https://withnoesia.com/index.md",
    why: "la card markdown della home, con la sua canonical dichiarata",
  },
  {
    url: "https://withnoesia.com/authors/mattia-ciuni",
    why: "una pagina di persona: e' quella che risponde a una ricerca sul nome",
  },
  {
    url: "https://withnoesia.com/pt/team/mattia-ciuni",
    why: "la seconda pagina di persona, in un'altra lingua",
  },
  {
    url: "https://mattiaciuni.com/",
    why: "la nostra home: qui il check e' una regressione, non una migrazione",
  },
  {
    url: "https://mattiaciuni.com/llms.txt",
    why: "il nostro file per le macchine, quello che descrive Mattia come fondatore",
  },
  {
    url: "https://mattiaciuni.pages.dev/",
    why: "l'host ritirato del progetto: deve reindirizzare, non servire markup vecchio",
  },
  {
    url: "https://www.linkedin.com/in/mattiaciuni/",
    why: "il profilo e' nel sameAs del JSON-LD del sito: se dice il vecchio nome, lo dice anche il sito",
  },
  {
    url: "https://medium.com/@mattiaciuni/about",
    why: "la bio pubblica, indicizzata e citata dagli assistenti",
  },
  {
    url: "https://fazier.com/p/mattiaciuni",
    why: "una scheda di terze parti che ripete la vecchia carica",
  },
];

// Aggiunte dalla riga di comando o dal workflow, per gli host il cui nome porta
// un token ritirato e che quindi non possono stare scritti qui.
const extra = (process.env.BRAND_WATCH_URLS ?? "")
  .split(/[\s,]+/)
  .filter(Boolean)
  .map((url) => ({ url, why: "target aggiunto da BRAND_WATCH_URLS" }));

const allTargets = [...targets, ...extra];

/** La riga che contiene il match, accorciata: un report si legge, non si decodifica. */
function contextAround(text, index, width = 160) {
  const lineStart = text.lastIndexOf("\n", index) + 1;
  const lineEnd = text.indexOf("\n", index);
  const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd).trim();
  return line.replace(/\s+/g, " ").slice(0, width);
}

function findToken(text, tokens) {
  const lower = text.toLowerCase();
  for (const token of tokens) {
    const at = lower.indexOf(token.toLowerCase());
    if (at !== -1) return { token, context: contextAround(text, at) };
  }
  return null;
}

/**
 * La canonical dichiarata, sia in HTML sia in una card markdown: la seconda
 * forma esiste perche' il sito pubblica le card, e la canonical sbagliata che ha
 * causato questo problema stava in un `index.md`, non in un `<link>`.
 */
function declaredCanonical(body) {
  const html = body.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  if (html) {
    const href = html[0].match(/href=["']([^"']+)["']/i);
    if (href) return href[1];
  }
  const markdown = body.match(/^\s*Canonical:\s*(\S+)\s*$/im);
  return markdown ? markdown[1] : null;
}

const findings = [];
const clean = [];
const unverified = [];

for (const target of allTargets) {
  let response;
  try {
    response = await fetch(target.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": UA, accept: "text/html,text/plain,text/markdown;q=0.9,*/*;q=0.5" },
    });
  } catch (error) {
    unverified.push({ ...target, reason: `request failed (${error.message})` });
    continue;
  }

  if (!response.ok) {
    unverified.push({ ...target, reason: `answered HTTP ${response.status}` });
    continue;
  }

  let body;
  try {
    body = await response.text();
  } catch (error) {
    unverified.push({ ...target, reason: `body could not be read (${error.message})` });
    continue;
  }

  const hit = findToken(body, retired);
  if (hit) findings.push({ ...target, finalUrl: response.url, token: hit.token, context: hit.context });

  // L'host della pagina stessa, con e senza `www`: una pagina di terze parti che
  // dichiara la canonical sul proprio host e' corretta e non e' deriva. Senza
  // questa riga ogni scheda esterna diventa un falso positivo, ed e' il modo piu'
  // rapido per far spegnere un monitor: un allarme che sbaglia viene ignorato
  // prima di uno che tace.
  const responseHost = new URL(response.url).host.toLowerCase();
  const selfHosts = new Set([
    responseHost,
    responseHost.startsWith("www.") ? responseHost.slice(4) : `www.${responseHost}`,
  ]);

  const canonical = declaredCanonical(body);
  if (canonical) {
    let host = null;
    try {
      host = new URL(canonical, response.url).host.toLowerCase();
    } catch {
      findings.push({
        ...target,
        finalUrl: response.url,
        context: `declares an unparseable canonical: ${canonical}`,
      });
    }
    if (host && !allowedCanonicalHosts.has(host) && !selfHosts.has(host)) {
      // Il caso trovato il 5 ottobre 2026: il sito sotto il nome nuovo dichiarava
      // la canonical sul dominio del nome vecchio, che non risolve piu'. Google
      // non poteva consolidare niente, quindi le pagine vecchie restavano in
      // indice con i loro titoli vecchi, e nessun altro check se ne accorgeva.
      findings.push({
        ...target,
        finalUrl: response.url,
        context: `declares canonical on "${host}", which is neither this host nor ${current.domain}`,
      });
    }
  }

  if (!hit) {
    clean.push({
      ...target,
      finalUrl: response.url,
      redirected: response.url !== target.url,
      canonical,
    });
  }
}

console.log(`brand-watch: watching ${allTargets.length} surface(s) for ${retired.length} retired name(s)`);

for (const target of clean) {
  const moved = target.redirected ? ` -> ${target.finalUrl}` : "";
  const canonical = target.canonical ? `, canonical ${target.canonical}` : "";
  console.log(`  ok        ${target.url}${moved}${canonical}`);
}

for (const target of unverified) {
  console.log(`  unverified ${target.url}: ${target.reason} - ${target.why}`);
}

for (const target of findings) {
  console.error(`  FOUND     ${target.url} -> ${target.finalUrl ?? target.url}`);
  console.error(`            ${target.context}`);
  console.error(`            ${target.why}`);
}

const summary = `brand-watch: ${clean.length} clean, ${unverified.length} could not be verified, ${findings.length} carried the retired name`;

if (findings.length) {
  console.error(`FAIL brand-watch: the retired name is still published.`);
  console.error(`  ${summary}`);
  console.error("  A name that only exists in an index is fixed by the site that feeds it.");
  process.exit(1);
}

if (unverified.length) {
  console.log(`WARN brand-watch: nothing found, but the result is incomplete.`);
  console.log(`  ${summary}`);
  console.log("  A surface that answers 4xx or a block page to a non-browser client is not a pass: it is a gap.");
  process.exit(2);
}

console.log(`PASS brand-watch: no retired name on any watched surface.`);
console.log(`  ${summary}`);
