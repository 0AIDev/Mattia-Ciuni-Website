// Contratto offline della migrazione del dominio.
//
// Il cambio di dominio è il tipo di lavoro che non lascia traccia quando
// funziona e lascia un sito invisibile quando no: `canonical`, sitemap e
// `robots.txt` puntano tutti a una cosa sola, e quella cosa si cambia in un
// file. Qui si prova il pezzo che non si vede in un export — la risposta
// HTTP — perché il 301 è l'unico segnale che sposta il ranking, e un 302, o
// un 301 che perde la query, o un 301 applicato anche alle anteprima, si
// vedono solo davanti a una richiesta vera.
//
// Non tocca la rete e non usa l'export: importa la Function e la chiama con
// richieste costruite a mano, quindi gira anche senza `npm run build`.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const importLocal = (p) => import(pathToFileURL(p).href);

let failures = 0;
const check = (name, condition, detail = "") => {
  console.log(`${condition ? "PASS" : "FAIL"} ${name}${condition || !detail ? "" : ` — ${detail}`}`);
  if (!condition) failures += 1;
};

// La Function è TypeScript puro e non importa niente dal progetto, quindi si
// chiama come la chiama Pages: un `context` con la richiesta, l'env e il
// `next()` che continua la catena verso gli asset.
const { onRequest } = await importLocal(join(root, "functions", "_middleware.ts"));

let assetHits = 0;
const env = {
  ASSETS: {
    async fetch() {
      assetHits += 1;
      return new Response("# card", { status: 200, headers: { "Content-Type": "text/markdown" } });
    },
  },
};

/** Una richiesta che arriva al middleware, con gli asset che rispondono 200. */
const ask = (url, init = {}) =>
  onRequest({
    request: new Request(url, init),
    env,
    async next() {
      return new Response("<html></html>", { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
    },
  });

const locationOf = (response) => response.headers.get("Location");

// --- L'origine production è la stessa dichiarata dal build ----------------
// La costante è scritta due volte (la Function non può importare il modulo che
// la valida, e il motivo è commentato li'). Il rischio è che le due copie
// divergano: qui si controlla che non siano divagate.
const declaredOrigin = /const PRODUCTION_ORIGIN = "([^"]+)"/.exec(
  readFileSync(join(root, "lib", "site-origin.ts"), "utf8"),
)?.[1];
check(
  "origin: lib/site-origin.ts declares a custom domain, not a pages.dev subdomain",
  declaredOrigin === "https://mattiaciuni.com",
  `trovato ${declaredOrigin}`,
);

// --- Il sottodominio del progetto Pages risponde 301, e conserva il resto --
// 301 e non 302: un 302 dice "prova ora", un 301 dice "questa è casa tua adesso"
// ed è quello che i motori spostano. Percorso e query intatti: `/feedback/?from=x`
// che perde la query non è una migrazione, è un link rotto con un codice 301.
const legacy = await ask("https://mattiaciuni.pages.dev/thoughts/money-layer-for-ai-agents/");
check("pages.dev: 301", legacy.status === 301, `status ${legacy.status}`);
check(
  "pages.dev: the path survives the redirect",
  locationOf(legacy) === "https://mattiaciuni.com/thoughts/money-layer-for-ai-agents/",
  locationOf(legacy),
);

const legacyQuery = await ask("https://mattiaciuni.pages.dev/feedback/?from=email&tag=x");
check(
  "pages.dev: the query string survives the redirect",
  locationOf(legacyQuery) === "https://mattiaciuni.com/feedback/?from=email&tag=x",
  locationOf(legacyQuery),
);

// La query non si deve perdere nemmeno quando non c'è un Accept che faccia
// entrare in scena la negoziazione markdown: l'ordine dei controlli è quello
// che garantisce il 301, ed è l'ordine che va provato.
const plain = await ask("https://mattiaciuni.pages.dev/sitemap.xml", { headers: { Accept: "text/html" } });
check(
  "pages.dev: a sitemap is redirected too, before any content decision",
  plain.status === 301 && locationOf(plain) === "https://mattiaciuni.com/sitemap.xml",
  `${plain.status} ${locationOf(plain)}`,
);

// Anche in chiaro: Cloudflare passa la richiesta in HTTPS, ma il 301 non deve
// dipenderne per la correzione — deve essere un https, altrimenti l'host
// risponderebbe "vai qui" restando in chiaro.
const insecure = await ask("http://mattiaciuni.pages.dev/");
check(
  "pages.dev: an http request is answered with an https destination",
  insecure.status === 301 && new URL(locationOf(insecure)).protocol === "https:",
  locationOf(insecure),
);

// Il percorso privato resta privato: `/nda` senza token è 404 e deve restarlo
// anche sui vecchi host, o il redirect aprirebbe un indirizzo che il sito non
// voleva pubblicare. Con il token, invece, il link va portato all'apex.
const bareNda = await ask("https://mattiaciuni.pages.dev/nda");
check(
  "pages.dev: a bare /nda link is not turned into a working link",
  bareNda.status === 301 && locationOf(bareNda) === "https://mattiaciuni.com/nda",
  `${bareNda.status} ${locationOf(bareNda)}`,
);

// --- www non è una seconda copia del sito ---------------------------------
const www = await ask("https://www.mattiaciuni.com/careers/ml-engineer-risk/");
check(
  "www: 301 to the apex, path intact",
  www.status === 301 && locationOf(www) === "https://mattiaciuni.com/careers/ml-engineer-risk/",
  `${www.status} ${locationOf(www)}`,
);

// --- Il dominio production non si tocca ------------------------------------
// Qui il percorso più semplice: nessun redirect, nessun asset toccato. Un 301
// su `mattiaciuni.com` verso `mattiaciuni.com` è un loop che chiude il sito.
const prod = await ask("https://mattiaciuni.com/sitemap.xml");
check("production host: no redirect", prod.status === 200, `status ${prod.status}`);
check("production host: the content is served", (await prod.text()).includes("<html>"));

// --- Le anteprima restano raggiungibili ------------------------------------
// Ogni deploy non-production ha il suo sottodominio `pages.dev`. Sono link
// temporanei, non contenuto da indicizzare, e redirigerli verso l'apex non
// servirebbe a nulla: romperebbe il confronto fra production e preview che
// ogni deploy usa per capire se il nuovo build e' migliore.
const preview = await ask("https://a1b2c3d4.mattiaciuni.pages.dev/thoughts/");
check("preview deployment: no redirect", preview.status === 200, `status ${preview.status}`);

// --- La negoziazione markdown continua a funzionare ------------------------
// Il controllo sull'host e' il primo codice della catena: se avesse un `return`
// troppo largo si mangierebbe anche questo, che e' il motivo per cui la
// funzione esiste. Qui si verifica che la richiesta arrivi davvero agli asset.
const before = assetHits;
const card = await ask("https://mattiaciuni.com/thoughts/money-layer-for-ai-agents/", {
  headers: { Accept: "text/markdown" },
});
check(
  "production host: a markdown Accept still reaches the card",
  card.status === 200 &&
    (card.headers.get("Content-Type") || "").startsWith("text/markdown") &&
    assetHits === before + 1,
  `${card.status} ${card.headers.get("Content-Type")} asset hits ${before} -> ${assetHits}`,
);

// --- Il redirect non può puntare a se stesso -------------------------------
// Difesa contro la modifica sbagliata più ovvia: un host aggiunto per errore
// nella lista dei ritirati. Il controllo gira su tutta la lista, non sul
// singolo caso, perché è la lista intera a essere un contratto.
const middlewareSource = readFileSync(join(root, "functions", "_middleware.ts"), "utf8");
const retiredHosts = [
  ...(/(?:const RETIRED_HOSTS = new Set\(\[)([^\]]*)/.exec(middlewareSource)?.[1] ?? "").matchAll(/"([^"]+)"/g),
].map((m) => m[1]);
check(
  "retired hosts: none of them is the production host",
  retiredHosts.length > 0 && !retiredHosts.includes("mattiaciuni.com"),
  retiredHosts.join(", "),
);
check(
  "retired hosts: the Pages subdomain of the project is on the list",
  retiredHosts.includes("mattiaciuni.pages.dev"),
  retiredHosts.join(", "),
);

// --- Il codice che decide è davvero in cima alla catena --------------------
// Non basta che il 301 esista: deve arrivare prima del 404 di `/nda`, prima
// della negoziazione markdown e prima di `next()`. Un redirect messo in fondo
// non si vede su nessuna pagina, e su `/nda` aprirebbe un indirizzo privato.
const redirectIndex = middlewareSource.indexOf("RETIRED_HOSTS.has(url.hostname");
const gates = ["const isNda", "prefersMarkdown(request.headers.get", "await next()"];
check(
  "order: the host check runs before the NDA gate, markdown negotiation and next()",
  redirectIndex !== -1 && gates.every((gate) => middlewareSource.indexOf(gate) > redirectIndex),
);

console.log(
  failures
    ? `FAIL domain: ${failures} check(s) failed — il 301 non è quello che il ranking si aspetta`
    : `PASS domain: 301 da ${retiredHosts.join(", ")} verso https://mattiaciuni.com, percorso e query intatti, anteprima e host production intatti`,
);
process.exit(failures ? 1 : 0);