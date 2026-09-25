const fs = require("fs");
const path = require("path");
const out = path.join(__dirname, "..", "out");
let fail = 0;
function check(name, cond) {
  console.log((cond ? "PASS" : "FAIL") + " " + name);
  if (!cond) fail++;
}
function read(p) { return fs.readFileSync(path.join(out, p), "utf8"); }
const { readFileSync, readdirSync } = fs;
const { createHash } = require("crypto");
function ldJson(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  return blocks.map((m) => JSON.parse(m[1]));
}
// Le pagine, nell'export, sono cartelle con dentro `index.html`
// (`trailingSlash: true` in next.config.mjs: è quello che rende
// `/thoughts/<slug>/` l'indirizzo che Pages serve da sé).
const index = read("index.html");
const blog = read("thoughts/index.html");
const post = read("thoughts/money-layer-for-ai-agents/index.html");
const note = read("notes/on-boring-systems/index.html");

// Il dominio SEO production: la costante in `lib/site-origin.ts`, che il build
// usa come unica origine consentita. `NEXT_PUBLIC_SITE_URL` viene verificata
// come configurazione del progetto, ma non può sostituire la costante.
const SITE_ORIGIN = /const PRODUCTION_ORIGIN = "([^"]+)"/.exec(
  readFileSync(path.join(__dirname, "..", "lib", "site-origin.ts"), "utf8"),
)?.[1];
if (!SITE_ORIGIN) {
  console.error("verify: lib/site-origin.ts non dichiara SITE_ORIGIN");
  process.exit(1);
}
const PROD = SITE_ORIGIN.replace(/\/$/, "");
if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "") !== PROD) {
  console.error(`verify: NEXT_PUBLIC_SITE_URL deve essere ${PROD} (trovato ${process.env.NEXT_PUBLIC_SITE_URL})`);
  process.exit(1);
}

check("index: single h1", (index.match(/<h1/g) || []).length === 1);
check("index: h1 Mattia Ciuni", index.includes("<h1") && index.includes("Mattia Ciuni"));
// Un link dentro un grassetto non si vede. InlineText spezza il testo con una
// sola regex (`**grassetto**` | `*corsivo*` | `[etichetta](url)`) e vince il primo
// match: `**... [nome](url) ...**` esce come **testo letterale**, parentesi quadre
// comprese, e nessuno se ne accorge leggendo il registro. Il controllo gira sui
// registri, dove il testo si scrive, non sull'export.
//
// La prova riproduce il parser: si spezza ogni stringa dei registri con la stessa
// regex di `components/RichText.tsx` e si guarda dentro i token di grassetto. Un
// controllo con una regex piu' larga darebbe falsi positivi (il `**` di chiusura di
// una frase seguito da un link piu' avanti e' legittimo), e un controllo che grida
// al lupo viene disattivato invece che corretto.
const REGISTRIES = ["lib/posts.ts", "lib/notes.ts", "lib/feedback.ts"];
const INLINE_TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
const boldWithLink = [];
for (const file of REGISTRIES) {
  const source = readFileSync(path.join(__dirname, "..", file), "utf8");
  for (const line of source.split(/\r?\n/)) {
    for (const literal of line.match(/"(?:[^"\\]|\\.)*"/g) || []) {
      const value = literal.slice(1, -1);
      for (const part of value.split(INLINE_TOKEN)) {
        if (part.startsWith("**") && part.endsWith("**") && part.includes("](")) {
          boldWithLink.push(file + ": " + value.slice(0, 48));
        }
      }
    }
  }
}
check("content: no markdown link nested inside bold", boldWithLink.length === 0);
if (boldWithLink.length) console.log("     link dentro un grassetto: " + boldWithLink.join(" | "));
check("post: single h1", (post.match(/<h1/g) || []).length === 1);
check("index: lang=en", index.includes('<html lang="en"'));
check("index: canonical", index.includes(`rel="canonical" href="${PROD}/"`));

// L'export deve dichiarare sempre la costante production: il middleware non
// sostituisce più l'host con quello della richiesta.
const builtFor = index.match(/rel="canonical" href="(https?:\/\/[^/"]+)/)?.[1];
check(
  `origin: l'export dichiara ${SITE_ORIGIN}`,
  builtFor === SITE_ORIGIN
);
if (builtFor !== SITE_ORIGIN) {
  console.log(`     l'export dichiara ${builtFor || "(nessun canonical assoluto)"}; aggiorna lib/site-origin.ts`);
}
check("post: canonical", post.includes(`rel="canonical" href="${PROD}/thoughts/money-layer-for-ai-agents/"`));
check("index: og:image absolute", index.includes(`og:image" content="${PROD}/og.png"`));
check("index: og:site_name", index.includes('og:site_name" content="Mattia Ciuni"'));
check("index: title uses entity and topic", index.includes("Mattia Ciuni | Founder &amp; CEO at Payle"));
check("index: role links bold Payle", index.includes("Founder &amp; CEO at") && index.includes('href="https://usepayle.com"') && index.includes(">Payle</a>"));
check("index: WebSite identity", !!ldJson(index).find((j) => j["@type"] === "WebSite" && j.name === "Mattia Ciuni" && j.url === PROD));
check("post: og:type article", post.includes('og:type" content="article"'));
check("post: article:published_time", post.includes("article:published_time"));
check("blog: twitter title fixed", blog.includes('twitter:title" content="Thoughts'));
check("index: twitter large image", index.includes('twitter:card" content="summary_large_image"'));
check("index: rel=me x3", (index.match(/rel="me noopener"/g) || []).length === 3);
check("index: mailto", index.includes("mailto:ceo@usepayle.com"));
// Il theme-color segue il tema: due meta con media query (light #FCFCFC, dark
// #0A0A0A), gli stessi valori di --tc-background in globals.css. Un solo valore
// fisso lascerebbe la barra del browser del colore sbagliato in dark mode.
check("index: theme-color", index.includes('name="theme-color" content="#FCFCFC" media="(prefers-color-scheme: light)"') && index.includes('name="theme-color" content="#0A0A0A" media="(prefers-color-scheme: dark)"'));
check("index: Google Search Console verification", index.includes('name="google-site-verification" content="2Yp93wGXnpI1i5vhC09zwHdmGr1vY6rFCZIXptWOITI"'));

const person = ldJson(index).find((j) => j["@type"] === "Person");
check("index: Person JSON-LD valid", !!person && person.name === "Mattia Ciuni" && person.worksFor.name === "Payle" && person.sameAs.length === 5);
const organization = ldJson(index).find((j) => j["@type"] === "Organization");
check("index: Payle Organization JSON-LD valid", !!organization && organization.name === "Payle" && organization.founder?.["@id"]?.endsWith("/#mattia-ciuni"));
const art = ldJson(post).find((j) => j["@type"] === "BlogPosting");
check("post: BlogPosting JSON-LD valid", !!art && !!art.headline && !!art.datePublished && !!art.author);
const crumb = ldJson(post).find((j) => j["@type"] === "BreadcrumbList");
check("post: BreadcrumbList valid", !!crumb && crumb.itemListElement.length === 3);
check("post: breadcrumb visible", post.includes('aria-label="Breadcrumb"') && post.includes(">Home<") && post.includes(">Thoughts<") && post.includes('aria-current="page"'));
check("note: breadcrumb visible", note.includes('aria-label="Breadcrumb"') && note.includes(">Home<") && note.includes(">Notes<") && note.includes('aria-current="page"'));
const noteCrumb = ldJson(note).find((j) => j["@type"] === "BreadcrumbList");
check("note: BreadcrumbList valid", !!noteCrumb && noteCrumb.itemListElement.length === 3 && noteCrumb.itemListElement[2].item === `${PROD}/notes/on-boring-systems/`);  check("404: noindex + home link", read("404.html").includes('name="robots" content="noindex"') && read("404.html").includes("Go back home"));

// Quanti articoli abbia il blog si legge dal registro, non si scrive a mano: un
// post nuovo non deve far fallire un controllo per il motivo sbagliato, e un
// controllo che conta i post deve accorgersi se registro e build divergono.
const postCount = [
  ...readFileSync(path.join(__dirname, "..", "lib", "posts.ts"), "utf8").matchAll(/slug:\s*"/g),
].length;

const smIndex = read("sitemap.xml");
check(
  "sitemap: index with 4 children",
  smIndex.includes('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">') && (smIndex.match(/<sitemap>/g) || []).length === 4 && smIndex.includes(`${PROD}/sitemap-home.xml`) && smIndex.includes(`${PROD}/sitemap-thoughts.xml`) && smIndex.includes(`${PROD}/sitemap-notes.xml`) && smIndex.includes(`${PROD}/sitemap-feedback.xml`)
);
check("sitemap-home: base and localized urls", (read("sitemap-home.xml").match(/<loc>/g) || []).length >= 75 && read("sitemap-home.xml").includes(`${PROD}/`) && read("sitemap-home.xml").includes(`${PROD}/about/`) && read("sitemap-home.xml").includes(`${PROD}/work/`) && read("sitemap-home.xml").includes(`${PROD}/voice-notes/`) && read("sitemap-home.xml").includes(`${PROD}/videos/`) && read("sitemap-home.xml").includes(`${PROD}/it/`) && read("sitemap-home.xml").includes(`${PROD}/fr/`) && read("sitemap-home.xml").includes(`${PROD}/de/`));
check("sitemap-thoughts: index + every post", (read("sitemap-thoughts.xml").match(/<loc>/g) || []).length === postCount + 1 && read("sitemap-thoughts.xml").includes("finding-ghassen-the-co-founder-question-answered-in-three-weeks") && read("sitemap-thoughts.xml").includes("welcoming-alex-mwaniki-founding-engineer-core"));
check("sitemap-notes: 9 url", (read("sitemap-notes.xml").match(/<loc>/g) || []).length === 9 && read("sitemap-notes.xml").includes("/notes/"));
// Le date seguono i contenuti: una collezione è datata con l'elemento più
// recente che contiene, non con la data del deploy.
const sitemapUrls = (xml) =>
  [...xml.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map((m) => ({
    loc: m[1],
    lastmod: m[2],
  }));
const newest = (items) => items.map((i) => i.lastmod).sort().pop();
const thoughtItems = sitemapUrls(read("sitemap-thoughts.xml"));
const noteItems = sitemapUrls(read("sitemap-notes.xml"));
const isIndex = (loc, path) => loc.endsWith(path);
const childDates = Object.fromEntries(
  [...smIndex.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map((m) => [m[1], m[2]])
);
check(
  "sitemap: lastmod follows content",
  thoughtItems.find((i) => isIndex(i.loc, "/thoughts/"))?.lastmod === newest(thoughtItems.filter((i) => !isIndex(i.loc, "/thoughts/"))) &&
    noteItems.find((i) => isIndex(i.loc, "/notes/"))?.lastmod === newest(noteItems.filter((i) => !isIndex(i.loc, "/notes/")))
);
check(
  "sitemap: index dates are the children's",
  childDates[`${PROD}/sitemap-thoughts.xml`] === newest(thoughtItems) &&
    childDates[`${PROD}/sitemap-notes.xml`] === newest(noteItems) &&
    childDates[`${PROD}/sitemap-home.xml`] === newest([...thoughtItems, ...noteItems])
);

const robots = read("robots.txt");
check("robots: allow everything", robots.includes("User-Agent: *") && robots.includes("Allow: /") && robots.includes(`Sitemap: ${PROD}/sitemap.xml`) && robots.includes(`Sitemap: ${PROD}/news-sitemap.xml`));
check("news sitemap: generated from articles", read("news-sitemap.xml").includes("xmlns:news=") && read("news-sitemap.xml").includes("<news:title>") && read("news-sitemap.xml").includes(`${PROD}/thoughts/`));
check(
  "robots: AI agents by name",
  ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot", "Bytespider"].every((a) => robots.includes(`User-Agent: ${a}`)) &&
    (robots.match(/^User-Agent:/gm) || []).length >= 30
);
check(
  "robots: standard directives only",
  !robots.includes("Agentmap:") && robots.includes(`Sitemap: ${PROD}/sitemap.xml`)
);
// La politica d'uso dichiarata (content signals): deve essere presente e deve
// concordare con gli Allow del file — un ai-train=no sopra trentadue Allow: /
// è una politica che nessuno può rispettare, perché robots.txt è l'unico posto
// in cui può contraddire sé stesso. I motori ignorano la riga (direttiva non
// standard), quindi non deve mai stare sopra il blocco `User-Agent: *` senza
// che i tre segnali dicano tutti sì, come il sito dichiara altrove.
const signalMatch = /Content-Signal:\s*([^\n]+)/.exec(robots);
const signalValues = signalMatch
  ? Object.fromEntries(
      signalMatch[1].split(",").map((pair) => {
        const [key, value] = pair.split("=").map((part) => part.trim());
        return [key, value];
      })
    )
  : null;
check(
  "robots: content signals declared and consistent",
  !!signalValues &&
    signalValues["ai-train"] === "yes" &&
    signalValues["search"] === "yes" &&
    signalValues["ai-input"] === "yes"
);
// La card markdown si annuncia anche nella <head>: un crawler non esegue la pagina.
check(
  "head: markdown card alternate",
  index.includes(`rel="alternate" type="text/markdown" href="${PROD}/index.md"`) &&
    post.includes(`rel="alternate" type="text/markdown" href="${PROD}/thoughts/money-layer-for-ai-agents.md"`) &&
    note.includes("rel=\"alternate\" type=\"text/markdown\"")
);
const llmtxt = read("llms.txt");
check("llms.txt: valid", llmtxt.startsWith("# Mattia Ciuni") && llmtxt.includes("## Thoughts") && llmtxt.includes("## Notes") && llmtxt.includes("## Feedback") && llmtxt.includes("/thoughts/") && llmtxt.includes("/notes/") && llmtxt.includes("/feedback/") && llmtxt.includes("/work/") && llmtxt.includes("mailto:") && llmtxt.includes(".md"));

// Card For AI: file .md generati in postbuild da scripts/gen-cards.mjs
const homeCard = read("index.md");
check("card home: structured", homeCard.startsWith("# Mattia") && homeCard.includes("- URL: " + PROD) && homeCard.includes("- Type: Home") && homeCard.includes("[Thoughts index](thoughts.md)") && homeCard.includes("[Notes index](notes.md)"));
check("cards: public copy for dev", fs.existsSync(path.join(__dirname, "..", "public", "index.md")) && fs.existsSync(path.join(__dirname, "..", "public", "thoughts", "money-layer-for-ai-agents.md")));
const thoughtsCard = read("thoughts.md");
check("card thoughts index: one line per post", (thoughtsCard.match(/^\- \[.*\]\(thoughts\/[a-z0-9-]+\.md\)/gm) || []).length === postCount && thoughtsCard.includes("money-layer-for-ai-agents.md") && thoughtsCard.includes("artifact-based-hiring.md") && thoughtsCard.includes("finding-ghassen-the-co-founder-question-answered-in-three-weeks.md") && thoughtsCard.includes("welcoming-alex-mwaniki-founding-engineer-core.md"));
const postCard = read("thoughts/money-layer-for-ai-agents.md");
check("card post: content", postCard.includes("- Type: Blog post") && postCard.includes(PROD + "/thoughts/money-layer-for-ai-agents") && postCard.includes("- Published: 2026-09-20"));
const notesCard = read("notes.md");
check("card notes index: 8 notes", (notesCard.match(/^\- \[.*\]\(notes\/[a-z0-9-]+\.md\)/gm) || []).length === 8 && notesCard.includes("what-a-security-audit-taught-me.md") && notesCard.includes("the-moment-my-ai-agent-asked-for-my-credit-card.md") && notesCard.includes("idempotent-payments-for-ai-agents.md") && notesCard.includes("the-agentic-economy-is-a-trust-problem.md") && notesCard.includes("on-boring-systems.md") && notesCard.includes("what-interviews-teach-me-about-people-and-my-own-company.md") && notesCard.includes("honestly-im-excited.md") && notesCard.includes("about-the-name.md"));
const feedbackIndexPage = read("feedback/index.html");
const feedbackPostPage = read("feedback/a-stranger-redesigned-my-pitch-in-one-comment/index.html");
check("feedback: index + post built", feedbackIndexPage.includes("What people are saying") && feedbackPostPage.includes("A stranger redesigned my pitch in one comment"));
check("feedback: card with full article", read("feedback/a-stranger-redesigned-my-pitch-in-one-comment.md").includes("## Full article"));
check("index: feedback section", index.includes("Feedback") && index.includes("/feedback/"));
// Il pannello dei contributi in home non ha più il filetto nero doppio
// (`border-t-2`), quello che nella sezione faceva sembrare i feedback la
// prosecuzione dei Thoughts: un elenco con una linea nera in cima. Il check è sul
// file costruito, così un copia-incolla dalla lista sopra non lo riporta dentro.
check(
  "index: the feedback panel has no heavy rule",
  index.includes("rounded-3xl bg-gray-100") && !index.includes("border-t-2 border-gray-1200")
);
const adminPage = read("admin/feedback/index.html");
check(
  "feedback admin: private dashboard scaffold",
  adminPage.includes("Feedback review") &&
    adminPage.includes('name="robots" content="noindex, nofollow, nocache"') &&
    fs.existsSync(path.join(__dirname, "..", "functions", "api", "admin", "feedback.ts"))
);
// Due provider, due destinatari, per non consumare gli invii Resend che servono
// alla newsletter: Brevo manda la notifica a Mattia, Resend la conferma a chi ha
// scritto. La conferma usa il template congelato, non un HTML scritto a mano qui.
const feedbackSource = readFileSync(
  path.join(__dirname, "..", "functions", "api", "feedback.ts"),
  "utf8",
);
check(
  "feedback admin: protected API and notification wiring",
  fs.existsSync(path.join(__dirname, "..", "functions", "api", "admin", "feedback.ts")) &&
    readFileSync(path.join(__dirname, "..", "functions", "api", "admin", "feedback.ts"), "utf8").includes("ADMIN_TOKEN") &&
    feedbackSource.includes("api.brevo.com/v3/smtp/email") &&
    feedbackSource.includes("BREVO_API_KEY") &&
    feedbackSource.includes("ceo@usepayle.com")
);
check(
  "feedback: the author gets the frozen Resend confirmation",
  feedbackSource.includes("api.resend.com/emails") &&
    feedbackSource.includes("feedback-email-template") &&
    feedbackSource.includes("FEEDBACK_EMAIL_NAMED") &&
    !feedbackSource.includes("<html") &&
    fs.existsSync(path.join(__dirname, "..", "functions", "lib", "feedback-email-template.ts"))
);
// Il link dentro la notifica si compone dall'host che sta servendo la pagina: un
// dominio scritto a mano in una Function è il guasto che questo sito ha già pagato
// una volta (indirizzi dichiarati su un host e sito vivo su un altro), e in una
// notifica significa un link che porta al deploy sbagliato. `SITE_URL` (quando il
// progetto la imposta) e l'host della richiesta sono le uniche due fonti ammesse.
const feedbackFunction = readFileSync(
  path.join(__dirname, "..", "functions", "api", "feedback.ts"),
  "utf8"
);
check(
  "feedback: the notification link follows the serving host, never a constant",
  !feedbackFunction.includes("mattiaciuni.pages.dev") &&
    feedbackFunction.includes("siteOrigin(request, env)")
);
// La moderazione di `/api/admin/feedback` scrive su una chiave presa dal corpo:
// se il controllo sulla forma dell'id sparisse, una sessione potrebbe nominare
// `fb:index` o una `adm:<sessione>` — cioè scrivere fuori dai propri feedback.
const adminFunction = readFileSync(
  path.join(__dirname, "..", "functions", "api", "admin", "feedback.ts"),
  "utf8"
);
check(
  "feedback admin: moderation ids are scoped to feedback records",
  /RECORD_ID\s*=\s*\/\^fb:/.test(adminFunction) &&
    adminFunction.includes("RECORD_ID.test(id)") &&
    /request\.text\(\)/.test(adminFunction)
);

// La dashboard privata non finisce in nessun indice macchina: né nelle sitemap,
// né in llms.txt né nel feed. Una pagina di login in un indice è una pagina di
// login nei risultati di ricerca, e `noindex` da solo non basta: chi legge il
// sitemap.xml non guarda i meta.
const machineReadable = [
  "sitemap.xml",
  "sitemap-home.xml",
  "sitemap-thoughts.xml",
  "sitemap-notes.xml",
  "sitemap-feedback.xml",
  "news-sitemap.xml",
  "llms.txt",
  "feed.xml",
  // L'indice della chat: la dashboard non deve comparire nemmeno qui, perché la
  // chat risponde anche dicendo dove sta una cosa.
  "rag/index.json",
];
const leakedAdmin = machineReadable.filter((file) => read(file).toLowerCase().includes("admin"));
check(
  `admin: absent from every machine-readable index (${machineReadable.length} files)`,
  leakedAdmin.length === 0,
);
// La chat pubblica non compare sulla dashboard. Il controllo legge il
// **sorgente**, ed è l'unico onesto: il componente arriva da un import dinamico
// con `ssr: false`, quindi il pulsante non è mai stato nell'HTML costruito — un
// check sui file passerebbe anche a guardia rimossa.
const siteChat = readFileSync(path.join(__dirname, "..", "components", "SiteRagChat.tsx"), "utf8");
const layoutSource = readFileSync(path.join(__dirname, "..", "app", "layout.tsx"), "utf8");
check(
  "admin: the public chat is not rendered on the private dashboard",
  /if\s*\(path\.startsWith\("\/admin"\)\)\s*return null;/.test(siteChat)
);
check("chat: Ask Mattia Ciuni AI is disabled site-wide", !/^\s*import .*DeferredSiteRagChat/m.test(layoutSource) && !/^\s*<DeferredSiteRagChat\s*\/>/m.test(layoutSource) && !/^\s*<SiteRagChat\s*\/>/m.test(layoutSource));
// Sotto `/admin/` non si serve nessuna card, cache o non cache: la Function
// risponde 404 prima di guardare gli asset, e `_routes.json` deve instradare
// tutto il ramo privato verso di lei (`/admin/feedback.md` non era instradato,
// quindi Pages lo serviva come file statico — e dopo la cancellazione l'edge ha
// continuato a servirne la copia in cache per tutta la sua scadenza).
const middleware = readFileSync(path.join(__dirname, "..", "functions", "_middleware.ts"), "utf8");
const routes = JSON.parse(readFileSync(path.join(__dirname, "..", "public", "_routes.json"), "utf8"));
check(
  "admin: no markdown card under a private path, cached or not",
  middleware.includes("const isPrivate") &&
    middleware.includes('!isPrivate && prefersMarkdown(request.headers.get("Accept")') &&
    routes.include.includes("/admin/*")
);
// Ogni endpoint sotto `functions/api/` deve essere instradato: una rotta non
// elencata non arriva **mai** alla Function, la richiesta cade sull'handler
// statico e torna un 405 che sembra un metodo sbagliato invece di un endpoint
// che non esiste. È il guasto di `/api/collect`, e da qui non passa più: il
// controllo legge i file, non una lista scritta a mano.
const apiDir = path.join(__dirname, "..", "functions", "api");
const apiRoutes = [];
const walkApi = (current, prefix) => {
  for (const e of readdirSync(current, { withFileTypes: true })) {
    if (e.isDirectory()) walkApi(path.join(current, e.name), `${prefix}/${e.name}`);
    else if (e.isFile() && e.name.endsWith(".ts")) apiRoutes.push(`${prefix}/${e.name.replace(/\.ts$/, "")}`);
  }
};
walkApi(apiDir, "/api");
// `/api/chat` è l'unica eccezione, e non è una deroga a mano: la rotta resta
// fuori finché la chat è disattivata in tutto il sito. Il giorno in cui la chat
// torna nel layout, questa condizione cade da sé e la rotta torna obbligatoria.
const chatDisabled =
  !/^\s*import .*DeferredSiteRagChat/m.test(layoutSource) &&
  !/^\s*<DeferredSiteRagChat\s*\/>/m.test(layoutSource) &&
  !/^\s*<SiteRagChat\s*\/>/m.test(layoutSource);
const unrouted = apiRoutes.filter(
  (r) => !routes.include.includes(r) && !(chatDisabled && r === "/api/chat"),
);
check(
  `routes: all ${apiRoutes.length} endpoints under functions/api/ are invoked by Pages`,
  unrouted.length === 0,
);
if (unrouted.length) console.log("     non instradati in _routes.json: " + unrouted.join(", "));
if (leakedAdmin.length) console.log("     nominano admin: " + leakedAdmin.join(", "));
// Nessun file si scrive **intorno** alla dashboard: `admin/feedback.md` era una
// card servita come asset statico (quel percorso non passa dalla Function), e
// raccontava la pagina privata a chi la chiedeva. Il controllo è sui file, non
// sulle intenzioni: se la card torna, il check cade.
const strays = [];
// L'HTML della dashboard deve esserci (è la pagina): quello che non deve esserci
// è un file **scritto intorno** alla pagina, cioè una card markdown. Si guardano i
// soli file `.md`, in `out/` e in `public/` (che è ciò che Pages serve davvero).
for (const dir of ["out/admin", "public/admin"]) {
  const start = path.join(__dirname, "..", dir);
  if (!fs.existsSync(start)) continue;
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const p = path.join(current, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith(".md")) strays.push(p);
    }
  };
  walk(start);
}
check(
  "admin: no file is written around the dashboard (no admin card, no admin asset)",
  strays.length === 0,
);
if (strays.length) console.log("     file da rimuovere: " + strays.join(", "));
check(
  "admin: the dashboard is disallowed in every robots group",
  // Un crawler applica il gruppo più specifico che lo nomina: il Disallow deve
  // stare in tutti i blocchi, non solo sotto `*`.
  (robots.match(/^User-Agent:/gm) || []).length ===
    (robots.match(/^Disallow: \/admin\/$/gm) || []).length &&
    robots.includes("Disallow: /api/admin/")
);

// L'audit del 21/09: le proprietà del login che non devono regredire. Sono
// controlli sul **sorgente** perché queste cose non si vedono nell'export — un
// cookie col segreto dentro o un confronto che esce prima non lasciano traccia
// nell'HTML, e si scoprono leggendo il codice solo se qualcuno si ricorda di
// leggere il codice.
const adminFn = readFileSync(
  path.join(__dirname, "..", "functions", "api", "admin", "feedback.ts"),
  "utf8",
);
// I cookie possono uscire in due forme: `{ "Set-Cookie": `...` }` oppure la
// coppia `[ "Set-Cookie", `...` ]`, che è quella che serve quando in una risposta
// ci sono **due** cookie (un oggetto con la stessa chiave due volte ne tiene
// uno). Il controllo deve leggere entrambe, altrimenti smette di guardare proprie
// nel momento in cui la forma cambia — che è esattamente quello che era appena
// successo.
const setCookies = [...adminFn.matchAll(/"Set-Cookie"[\s:,]+`([^`]*)`/g)].map((m) => m[1]);
check(
  `admin: the master secret never travels in a cookie (${setCookies.length} Set-Cookie)`,
  setCookies.length > 0 && setCookies.every((value) => !/\$\{[^}]*ADMIN_TOKEN/.test(value)),
);
check(
  "admin: token compared in constant time, sessions in KV, real logout",
  /crypto\.subtle\.digest\("SHA-256"/.test(adminFn) &&
    /SESSION_PREFIX/.test(adminFn) &&
    /expirationTtl: SESSION_SECONDS/.test(adminFn) &&
    /action === "logout"/.test(adminFn) &&
    /\.delete\(SESSION_PREFIX/.test(adminFn) &&
    /__Host-/.test(adminFn),
);
check(
  "admin: token+TOTP bootstrap is one-time, rate limited and never cached",
  /TOTP_BOOTSTRAP_KEY/.test(adminFn) &&
    /TOTP_PENDING_PREFIX/.test(adminFn) &&
    /verifyTotp/.test(adminFn) &&
    /authRateAllowed/.test(adminFn) &&
    /rl:admin:/.test(adminFn) &&
    /"Cache-Control": "no-store"/.test(adminFn) &&
    /"X-Robots-Tag": "noindex, nofollow"/.test(adminFn) &&
    !/tokenFrom/.test(adminFn),
);
// Il token non deve comparire da nessuna parte nell'export: né nel JS del
// browser, né in una card markdown, né nei documenti di scoperta.
const adminTokenInRepo = [];
for (const dir of ["app", "components", "lib", "public", "functions", "scripts"]) {
  for (const entry of readdirSync(path.join(__dirname, "..", dir), { recursive: true })) {
    const name = String(entry);
    if (!/\.(js|mjs|ts|tsx|json|md|txt)$/.test(name)) continue;
    const full = path.join(__dirname, "..", dir, name);
    // La scansione ricorsiva elenca anche le cartelle, e `app/llms.txt/` è una
    // cartella che finisce in `.txt`: senza questo controllo si legge una
    // directory e il file di verifica muore (EISDIR).
    if (!fs.statSync(full).isFile()) continue;
    if (/ADMIN_TOKEN\s*[:=]\s*["'`][0-9a-f]{32,}/.test(readFileSync(full, "utf8"))) {
      adminTokenInRepo.push(`${dir}/${name}`);
    }
  }
}
check("admin: no hard-coded token anywhere in the tree", adminTokenInRepo.length === 0);
if (adminTokenInRepo.length) console.log("     " + adminTokenInRepo.join(", "));
// Il form di submission sostituisce il link email: la Function deve essere
// nell'elenco delle route dinamiche di Pages, altrimenti l'export statico
// risponderebbe 405 al POST. L'endpoint vive nei chunk JS del form (component
// client), quindi si cerca lì, non nell'HTML.
const jsHasFeedbackApi = (() => {
  const chunks = path.join(out, "_next", "static", "chunks");
  const stack = [chunks];
  while (stack.length) {
    const dir = stack.pop();
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.name.endsWith(".js") && readFileSync(full, "utf8").includes("/api/feedback")) return true;
    }
  }
  return false;
})();
check(
  "feedback: submission form wired",
  jsHasFeedbackApi &&
    JSON.parse(readFileSync(path.join(__dirname, "..", "public", "_routes.json"), "utf8")).include.includes("/api/feedback") &&
    fs.existsSync(path.join(__dirname, "..", "functions", "api", "feedback.ts"))
);
check(
  "footer: section links",
  index.includes('aria-label="Site"') && /href="\/feedback\/"[\s\S]{0,400}?aria-label="Legal"/.test(index)
);

// Pointeer "For AI:" visibile in fondo a ogni pagina
check("page: For AI link on home", index.includes("For AI:") && index.includes('href="/index.md"'));
check("page: For AI link on post", post.includes("For AI:") && post.includes('href="/thoughts/money-layer-for-ai-agents.md"'));

// OG images: ogni pagina che ne dichiara una deve averla davvero, nel suo formato
// 1200x630 (le card le scrive scripts/og.ps1: qui si controlla solo che esistano).
check(
  "og: card files exist (home, indexes)",
  fs.existsSync(path.join(out, "og.png")) &&
    fs.existsSync(path.join(out, "thoughts", "og.png")) &&
    fs.existsSync(path.join(out, "notes", "og.png"))
);

// Le card degli articoli non si scrivono a mano (le compone scripts/og.ps1 dai
// registri), quindi un articolo pubblicato senza immagine non lo vedrebbe
// nessuno: l'elenco atteso si ricava da lib/posts.ts e lib/notes.ts, e il
// conteggio si confronta con le pagine che il build ha prodotto davvero, così il
// controllo non può passare a vuoto se il registro cambia forma.
const slugsIn = (file) =>
  [...readFileSync(path.join(__dirname, "..", file), "utf8").matchAll(/slug:\s*"([^"]+)"/g)].map(
    (m) => m[1]
  );
const cardPath = (dir, slug) => path.join(out, dir, slug, "og.png");
// Le pagine di una sezione: cartelle con dentro `index.html`. Le card stanno
// nella stessa cartella (`thoughts/<slug>/og.png`).
const pagesIn = (dir) =>
  readdirSync(path.join(out, dir), { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(out, dir, e.name, "index.html")))
    .map((e) => e.name);
const cardsIn = (dir) =>
  readdirSync(path.join(out, dir), { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(out, dir, e.name, "og.png")))
    .map((e) => e.name);
const postSlugs = slugsIn("lib/posts.ts");
const noteSlugs = slugsIn("lib/notes.ts");
const feedbackSlugs = slugsIn("lib/feedback.ts");
check(
  "og: every article, note and feedback post has its card",
  postSlugs.length > 0 &&
    noteSlugs.length > 0 &&
    feedbackSlugs.length > 0 &&
    postSlugs.length === pagesIn("thoughts").length &&
    noteSlugs.length === pagesIn("notes").length &&
    feedbackSlugs.length === pagesIn("feedback").length &&
    postSlugs.every((slug) => fs.existsSync(cardPath("thoughts", slug))) &&
    noteSlugs.every((slug) => fs.existsSync(cardPath("notes", slug))) &&
    feedbackSlugs.every((slug) => fs.existsSync(cardPath("feedback", slug)))
);
// Un articolo e una nota hanno la copertina in pagina; un **feedback no**, e non
// è una dimenticanza: la sua pagina è il verbale di uno scambio, e la card in
// pagina mostrerebbe dentro l'articolo la sua stessa call to action
// («Read feedback»). Quindi qui si controlla che Thoughts e Notes l'abbiano, e
// che i Feedback **non** ne abbiano una: se qualcuno la rigenera e la rimette,
// il controllo cade invece di approvare una cartella con un file che nessuno
// nomina.
const feedbackHasCover = feedbackSlugs.filter((slug) =>
  fs.existsSync(path.join(out, "feedback", slug, "cover.png")),
);
check(
  "covers: every article and note has its in-page image, no orphan feedback cover",
  postSlugs.every((slug) => fs.existsSync(path.join(out, "thoughts", slug, "cover.png"))) &&
    noteSlugs.every((slug) => fs.existsSync(path.join(out, "notes", slug, "cover.png"))) &&
    feedbackHasCover.length === 0,
);
if (feedbackHasCover.length) console.log("     cover orfana: " + feedbackHasCover.join(", "));

// La pagina di un feedback è diversa da un post del blog, e questo è il controllo
// che lo tiene vero: niente copertina in pagina, niente filetto nero in cima,
// niente indice laterale, e invece il credito di chi ha scritto (nome + GitHub,
// come nella card dell'elenco) e il numero dello scambio.
const feedbackPages = feedbackSlugs.filter((slug) =>
  fs.existsSync(path.join(out, "feedback", slug, "index.html")),
);
const feedbackLayout = feedbackPages.map((slug) => {
  // React separa il testo con i marcatori di commento (`Exchange <!-- -->01`),
  // quindi si legge l'HTML senza commenti: il numero dello scambio è testo, non
  // markup, e confrontarlo sull'HTML grezzo fallirebbe per un motivo che non
  // c'entra con la pagina.
  const html = readFileSync(path.join(out, "feedback", slug, "index.html"), "utf8").replace(
    /<!--[\s\S]*?-->/g,
    "",
  );
  const author = /<span class="font-medium text-gray-1200">([^<]+)<\/span>/.exec(html)?.[1] || "";
  return {
    slug,
    hasCoverImage: html.includes(`/feedback/${slug}/cover.png`),
    hasBlackRule: /<article class="border-t-2/.test(html),
    hasToc: html.includes('aria-label="Table of contents"'),
    exchange: /Exchange\s+\d\d/.test(html),
    credit: !!author && html.includes('aria-label="' + author + ' on GitHub"'),
    creditRowAligned: html.includes("flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm leading-5"),
  };
});
check(
  `feedback: exchange layout, not a blog post (${feedbackLayout.length} page)`,
  feedbackLayout.length > 0 &&
    feedbackLayout.every(
      (page) =>
        !page.hasCoverImage &&
        !page.hasBlackRule &&
        !page.hasToc &&
        page.exchange &&
        page.credit &&
        page.creditRowAligned,
    ),
);
for (const page of feedbackLayout) {
  const problems = [
    page.hasCoverImage && "cover",
    page.hasBlackRule && "filetto nero",
    page.hasToc && "TOC",
    !page.exchange && "numero scambio",
    !page.credit && "credito autore",
  ].filter(Boolean);
  if (problems.length) console.log(`     ${page.slug}: ${problems.join(", ")}`);
}
check(
  "og: no card without an article",
  cardsIn("thoughts").every((slug) => postSlugs.includes(slug)) &&
    cardsIn("notes").every((slug) => noteSlugs.includes(slug)) &&
    cardsIn("feedback").every((slug) => feedbackSlugs.includes(slug))
);
check(
  "og: each section declares its own card",
  blog.includes(`og:image" content="${PROD}/thoughts/og.png"`) &&
    read("notes/index.html").includes(`og:image" content="${PROD}/notes/og.png"`)
);
check(
  "note: own og image declared",
  note.includes(`og:image" content="${PROD}/notes/on-boring-systems/og.png"`)
);

// Il controllo che chiude il cerchio: **ogni** pagina costruita dichiara un
// `og:image`, e quel file esiste davvero nell'export. I controlli qui sopra
// guardano le card che conoscono (articoli e sezioni); questo guarda ciò che le
// pagine dicono, quindi copre anche la home e le pagine che verranno. Un
// `og:image` che risponde 404 non si vede mai navigando il sito: si vede quando
// la pagina viene incollata da qualche parte, cioè quando è tardi.
const htmlPages = (dir, acc = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!e.name.startsWith("_") && !e.name.startsWith(".")) htmlPages(full, acc);
    } else if (e.name.endsWith(".html")) acc.push(full);
  }
  return acc;
};
const pages = htmlPages(out);

// Ogni pagina dichiara la sua card **completa**: `width`, `height` e `type`.
// Senza `type` alcuni lettori provano a indovinare il formato dall'indirizzo, e
// senza misure qualcuno non disegna la card grande nemmeno con
// `summary_large_image`. `check-live.mjs` lo controllava solo sulle pagine delle
// sitemap, quindi sei pagine fuori da lì (videos, voice-notes e le quattro
// legali) sono andate avanti a dichiararla a metà: qui il controllo gira su
// **tutte** le pagine esportate.
const incompleteCards = [];
for (const file of pages) {
  const html = readFileSync(file, "utf8");
  if (!/property="og:image"/.test(html)) continue;
  if (
    !/property="og:image:width"/.test(html) ||
    !/property="og:image:height"/.test(html) ||
    !/property="og:image:type"/.test(html)
  ) {
    incompleteCards.push(
      "/" + path.relative(out, file).replace(/index\.html$/, "").split(path.sep).join("/")
    );
  }
}
check(
  `og: every page declares a complete card (${pages.length} pages)`,
  incompleteCards.length === 0
);
if (incompleteCards.length) console.log("     senza width/height/type: " + incompleteCards.join(", "));

const declared = pages.map((file) => {
  const html = readFileSync(file, "utf8");
  // Tutte le occorrenze: `og:image` ne ammette più di una, e ognuna deve esistere.
  const urls = [...html.matchAll(/property="og:image" content="([^"]+)"/g)].map((m) => m[1]);
  return { file: path.relative(out, file), urls };
});
const relative = (url) => (url.startsWith(PROD) ? url.slice(PROD.length) : null);
// Titoli e card social, controllati su **ogni** pagina costruita, non su una
// pagine a caso:
//   - il titolo SERP usa il divisore `|` (mai puntini o punti di sospensione)
//     e ha una lunghezza utile (i titoli corti sprecano spazio nella SERP);
//   - `og:site_name` è dichiarato: senza, Discord mostra una card anonima.
// Il controllo entra nei post e nelle note (dove il titolo è il contenuto) per
// il divisore e il site name, mentre la soglia di lunghezza riguarda solo le
// pagine di navigazione: un titolo d'articolo non si accorcia per far contenta
// una metrica.
check(
  `meta: title uses "|" and og:site_name everywhere (${pages.length} pages)`,
  pages.length > 0 &&
    declared.every((p) => {
      const html = readFileSync(path.join(out, p.file), "utf8");
      const title = (/<title>([^<]*)<\/title>/.exec(html) || [])[1] || "";
      return    (title.includes(" | ") || p.file === "nda\\index.html") && !title.includes("\u00B7") && html.includes('property="og:site_name"');
    })
);

// La description è la riga che i motori mostrano sotto il titolo: oltre ~160
// caratteri la tagliano, e una frase tagliata a metà è peggio di una più corta.
// Come per i titoli, la soglia vale per le pagine di **navigazione**: la
// description di un articolo, di una nota o di uno scambio di feedback è testo
// dell'autore e non si accorcia per far contenta una metrica. Lì resta
// obbligatorio averne una.
// Le pagine `noindex` (il flusso di candidatura, l'NDA, il 404) restano fuori:
// una description o un hreflang su una pagina che i motori non mostrano non
// serve a nessuno, e chiederla qui sarebbe un controllo che insegna a
// scrivere metadati per il controllo invece che per la pagina.
const isNoindex = (html) => {
  const meta = (/<meta name="robots" content="([^"]*)"/.exec(html) || [])[1] || "";
  return /noindex|none/i.test(meta);
};
const ARTICLE_DESCRIPTION = /(?:^|\/)(thoughts|notes|feedback)\/[^/]+\/$/;
const descriptionAudit = [];
for (const file of pages) {
  const html = readFileSync(file, "utf8");
  if (isNoindex(html)) continue;
  const meta = (/<meta name="description" content="([^"]*)"/.exec(html) || [])[1];
  const content = (meta || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'");
  const rel = path.relative(out, file).split(path.sep).join("/");
  const pagePath = `/${rel.replace(/index\.html$/, "")}`;
  if (!content) descriptionAudit.push(`${rel}: senza description`);
  else if (content.length > 160 && !ARTICLE_DESCRIPTION.test(pagePath)) {
    descriptionAudit.push(`${rel}: ${content.length} caratteri`);
  }
}
check(
  `meta: every indexable page declares a description a SERP can show`,
  descriptionAudit.length === 0
);
if (descriptionAudit.length) console.log("     " + descriptionAudit.slice(0, 10).join(", "));

// hreflang: le cinque lingue del sito più `x-default`, su ogni pagina. Senza,
// Google sceglie da sé quale indirizzo mostrare a chi cerca in italiano o in
// tedesco; con, la scelta è dichiarata. Il controllo verifica tre cose: che le
// sei annotazioni ci siano tutte, che nessun `href` esca dall'origine di
// produzione, e che ogni `href` corrisponda a una pagina che nell'export esiste
// davvero (un hreflang che punta al vuoto è un'annotazione che si perde).
const LOCALE_LIST = ["en", "it", "fr", "es", "de"];
const hreflangAudit = [];
for (const file of pages) {
  const rel = path.relative(out, file).split(path.sep).join("/");
  // L'NDA e il 404 non hanno varianti: uno è privato, l'altro non ha lingua.
  if (rel === "nda/index.html" || rel.startsWith("404")) continue;
  const html = readFileSync(file, "utf8");
  if (isNoindex(html)) continue;
  // Next scrive l'attributo come `hrefLang` nell'export: in HTML i nomi degli
  // attributi sono case-insensitive, quindi il browser legge `hreflang` e il
  // controllo deve fare lo stesso.
  const tags = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/gi)].map((m) => ({ lang: m[1], href: m[2] }));
  const byLanguage = new Map(tags.map((tag) => [tag.lang, tag.href]));
  const problems = [];
  for (const lang of [...LOCALE_LIST, "x-default"]) {
    if (!byLanguage.has(lang)) problems.push(`senza ${lang}`);
  }
  if (byLanguage.size !== tags.length) problems.push("annotazioni duplicate");
  const ownPath = rel.replace(/index\.html$/, "");
  const [first, ...rest] = ownPath.split("/");
  const unprefixed = LOCALE_LIST.includes(first) ? rest.join("/") : ownPath;
  if (byLanguage.get("x-default") !== `${PROD}/${unprefixed}`) {
    problems.push(`x-default ${byLanguage.get("x-default")} invece di ${PROD}/${unprefixed}`);
  }
  for (const tag of tags) {
    if (!tag.href.startsWith(`${PROD}/`)) problems.push(`${tag.lang} fuori origine`);
    else if (!fs.existsSync(path.join(out, tag.href.slice(PROD.length + 1), "index.html"))) {
      problems.push(`${tag.lang} -> ${tag.href.slice(PROD.length)} assente`);
    }
  }
  if (problems.length) hreflangAudit.push(`${rel}: ${problems.join(", ")}`);
}
check(`meta: every indexable page declares hreflang for the five locales and x-default`, hreflangAudit.length === 0);
if (hreflangAudit.length) console.log("     " + hreflangAudit.slice(0, 10).join("; "));

const broken = declared.flatMap((p) =>
  p.urls.length === 0 || p.urls.some((u) => !u.startsWith(PROD))
    ? (p.file === "nda\\index.html" ? [] : [p.file])
    : p.urls
        .filter((u) => !fs.existsSync(path.join(out, relative(u).replace(/^\//, ""))))
        .map((u) => `${p.file} -> ${u}`)
);
check(
  `og: every page's declared og:image exists (${declared.length} pages, ${declared.reduce((n, p) => n + p.urls.length, 0)} declarations)`,
  declared.length > 0 && broken.length === 0
);
if (broken.length) console.log("     manca: " + broken.join(", "));

// Scoperta per gli agenti: i documenti in /.well-known/ e la riga `Link`.
// Qui non basta "il file c'e'": si controlla che ciò che il documento dichiara
// esista davvero — gli indirizzi del linkset, il digest di ogni skill. Un
// documento che nomina un artefatto assente è peggio di un documento mancante:
// l'agente lo legge, prova, e conclude che il sito è rotto.
const headersFile = readFileSync(path.join(__dirname, "..", "public", "_headers"), "utf8");
const wellKnown = (rel) => path.join(out, ".well-known", rel);
const apiCatalog = JSON.parse(fs.readFileSync(wellKnown("api-catalog"), "utf8"));
const hrefs = apiCatalog.linkset.flatMap((entry) =>
  Object.entries(entry)
    .filter(([rel]) => rel !== "anchor")
    .flatMap(([, links]) => links.map((l) => l.href)),
);
check(
  `well-known: api-catalog linkset, every href exists (${hrefs.length} link)`,
  Array.isArray(apiCatalog.linkset) &&
    apiCatalog.linkset.length > 0 &&
    hrefs.length > 0 &&
    hrefs.every((href) => href.startsWith(PROD + "/")) &&
    hrefs.every((href) => fs.existsSync(path.join(out, href.slice(PROD.length + 1))))
);
check(
  "well-known: api-catalog served as a linkset too",
  /\/\.well-known\/api-catalog[\s\S]{0,200}Content-Type: application\/linkset\+json/.test(
    headersFile,
  )
);
const ardCatalog = JSON.parse(fs.readFileSync(wellKnown("ai-catalog.json"), "utf8"));
const ardEntriesValid = Array.isArray(ardCatalog.entries) && ardCatalog.entries.length > 0 && ardCatalog.entries.every((entry) => {
  const hasUrl = typeof entry.url === "string";
  const hasData = Object.prototype.hasOwnProperty.call(entry, "data");
  return /^urn:air:[^:]+:[^:]+:[^:]+$/.test(entry.identifier) &&
    !!entry.displayName && typeof entry.type === "string" && (hasUrl !== hasData) &&
    Array.isArray(entry.representativeQueries) && entry.representativeQueries.length >= 2 &&
    hasUrl && entry.url.startsWith(PROD + "/");
});
check(
  `well-known: ARD catalog, real public entries (${ardCatalog.entries?.length || 0})`,
  ardCatalog.specVersion === "1.0" && ardCatalog.host?.displayName === "Mattia Ciuni" &&
    ardCatalog.host?.identifier === `did:web:${new URL(PROD).hostname}` && ardEntriesValid &&
    headersFile.includes("/.well-known/ai-catalog.json") && headersFile.includes("Content-Type: application/json")
);
// auth.md: il controllo che gira sui lettori di agenti cerca un H1 che *nomini*
// auth.md, e il documento deve dire la verità (niente API protette, niente
// credenziali da mandare). Era l'unico dei file di scoperta che nessuno
// verificava nel merito.
check(
  "auth.md: H1 names the file, honest unauthenticated policy",
  fs.existsSync(path.join(out, "auth.md")) &&
    /^#\s.*auth\.md.*$/m.test(read("auth.md")) &&
    read("auth.md").includes("no OAuth/OIDC issuer") &&
    read("auth.md").includes("/api/admin/feedback") &&
    headersFile.includes("/auth.md") && headersFile.includes("Content-Type: text/markdown")
);

// RFC 9728: il documento esiste, è JSON vero, e le tre liste vuote **sono** la
// risposta (nessun issuer può emettere token per questa origine). I due file che
// pubblicherebbe un authorization server restano assenti: se qualcuno ci mettesse
// un `issuer` inventato, il sito dichiarerebbe endpoint che non esistono, e questo
// controllo è lì per fermarlo.
const protectedResource = JSON.parse(fs.readFileSync(wellKnown("oauth-protected-resource"), "utf8"));
const emptyList = (value) => Array.isArray(value) && value.length === 0;
check(
  "well-known: oauth-protected-resource, public resource with no issuer",
  protectedResource.resource === PROD + "/" &&
    emptyList(protectedResource.authorization_servers) &&
    emptyList(protectedResource.scopes_supported) &&
    emptyList(protectedResource.bearer_methods_supported) &&
    protectedResource.resource_documentation === PROD + "/auth.md" &&
    protectedResource.resource_policy_uri === PROD + "/terms/" &&
    fs.existsSync(path.join(out, "terms", "index.html")) &&
    headersFile.includes("/.well-known/oauth-protected-resource") &&
    !fs.existsSync(wellKnown("oauth-authorization-server")) &&
    !fs.existsSync(wellKnown("openid-configuration"))
);

// La skill pubblicata non deve nominare un dominio diverso da quello che serve le
// pagine: era il modo in cui il vecchio host sopravviveva a un cambio di dominio
// (la skill diceva `mattia-ciuni.xyz`, che non esiste in DNS). Ora il dominio
// arriva da `{{SITE}}`, sostituito alla generazione, e il digest copre il file
// finale — se la sostituzione non avvenisse, questo check cade.
const publishedSkill = readFileSync(
  path.join(out, ".well-known", "agent-skills", "read-and-cite-mattia-ciuni", "SKILL.md"),
  "utf8",
);
check(
  "well-known: the skill follows the real domain",
  publishedSkill.includes(PROD + "/thoughts/") &&
    !publishedSkill.includes("{{SITE}}") &&
    !/https?:\/\/(?!www\.)[a-z0-9.-]*mattia[-.]?ciuni\.xyz/i.test(publishedSkill)
);

// Le pagine legali devono descrivere quello che il sito fa davvero, non quello che
// faceva due funzioni fa: newsletter (Resend + Brevo + Beehiiv), form di feedback
// (KV + notifica), chat AI (Workers AI, storia nel browser) e analytics (Google,
// solo con consenso). Il controllo legge l'export, quindi una policy scritta e mai
// costruita non passa.
const privacy = read("privacy/index.html");
const cookies = read("cookies/index.html");
// I nomi delle chiavi si leggono dal codice invece di essere elencati a mano: una
// chiave nuova che nessuno documenta fa fallire questo controllo, invece di
// comparire nel browser di qualcuno senza che la policy lo dica.
const storageKeys = [
  ...new Set(
    [
      "lib/analytics.ts",
      "components/GoogleAnalytics.tsx",
      "components/NewsletterSection.tsx",
      "components/FeedbackForm.tsx",
    ]
      .map((file) => readFileSync(path.join(__dirname, "..", file), "utf8"))
      .join("\n")
      .match(/mattia-ciuni-[a-z0-9-]+/g) || [],
  ),
];
const terms = read("terms/index.html");
check(
  "legal: privacy covers newsletter, feedback and analytics while chat is disabled",
  ["Brevo", "Beehiiv", "Resend", "Workers KV", "Supabase", "Google Analytics 4", "Umami", "Microsoft Clarity", "a copy in my own database", "transiently", "Garante"].every(
    (needle) => privacy.includes(needle),
  )
);
check(
  "legal: cookies lists the real storage keys",
  storageKeys.length >= 5 &&
  [...storageKeys, "mattia_feedback_admin", "_ga_G-YQS0R94ZQP", "_clck", "_clsk"].every(
    (needle) => cookies.includes(needle),
  )
);
check(
  "legal: terms cover publishing feedback while chat is disabled",
  ["Content-Signal", "permission to publish", "initial"].every((needle) =>
    terms.includes(needle),
  ) && !terms.includes("Ask Mattia Ciuni AI")
);// La copia nel database del sito: se l'endpoint o lo schema spariscono, la misura
// continua a vivere solo in due servizi di terzi, che e' esattamente il problema che
// questa copia e' stata costruita per risolvere.
const collectFunction = readFileSync(path.join(__dirname, "..", "functions", "api", "collect.ts"), "utf8");
const collectMigration = readFileSync(
  path.join(__dirname, "..", "supabase", "migrations", "20260922_000003_analytics_events.sql"),
  "utf8",
);
check(
  "analytics: the owned copy is a real endpoint with a schema",
  collectFunction.includes("crypto.subtle.digest") &&
    collectFunction.includes("EVENTS.has(name)") &&
    collectFunction.includes("visitorDay") &&
    collectMigration.includes("create table if not exists public.analytics_events") &&
    collectMigration.includes("enable row level security"),
);
// Il controllo guarda **la riga che viene scritta**, non il file: `ip` compare
// legittimamente come nome di parametro in `visitorDay(ip, salt)`, ed e' proprio
// quello che deve succedere. Quello che non deve esistere e' un campo `ip` o
// `user_agent` dentro la riga che finisce nel database.
const rowsBlock = (() => {
  const start = collectFunction.indexOf("rows.push({");
  return start < 0 ? "" : collectFunction.slice(start, collectFunction.indexOf("});", start));
})();
check(
  "analytics: the row that reaches the database has no address and no user agent",
  rowsBlock.length > 100 &&
    !/\bip\b\s*:/.test(rowsBlock) &&
    !/user[_-]?agent\s*:/i.test(rowsBlock) &&
    rowsBlock.includes("visitor_day") &&
    collectFunction.includes('deviceOf(request.headers.get("User-Agent")'),
);
// Umami non e' dietro il consenso: se la CSP non lo autorizza, lo script viene bloccato in silenzio e il contatore resta a zero senza che nessuno se ne accorga. Per questo l'origine e' verificata sia nello `script-src` (lo script) sia nel `connect-src` (l'endpoint che riceve i dati).
check("security: CSP allows the cookieless counter", /script-src[^;]*https:\/\/cloud\.umami\.is/.test(headersFile) && /connect-src[^;]*https:\/\/cloud\.umami\.is/.test(headersFile));
// Clarity e' sempre attivo come Umami: se la CSP non nomina lo script e l'endpoint,
// le registrazioni spariscono in silenzio e nessuno se ne accorge.
check("security: CSP allows Clarity", /script-src[^;]*https:\/\/www\.clarity\.ms/.test(headersFile) && /connect-src[^;]*https:\/\/\*\.clarity\.ms/.test(headersFile));
check("legal: cookies lists the Clarity session cookies", cookies.includes("_clck") && cookies.includes("_clsk") && cookies.includes("Microsoft Clarity"));
check("legal: cookies says Umami writes nothing", cookies.includes("Umami") && cookies.includes("no cookie, no local storage"));
check("security: production hardening headers are configured", headersFile.includes("Content-Security-Policy:") && headersFile.includes("Strict-Transport-Security:") && headersFile.includes("Cross-Origin-Opener-Policy:") && headersFile.includes("X-Frame-Options: DENY") && headersFile.includes("X-Content-Type-Options: nosniff") && headersFile.includes("frame-ancestors 'none'"));
check("security: vulnerability disclosure document is published", fs.existsSync(path.join(out, ".well-known", "security.txt")) && read(".well-known/security.txt").includes("Contact: mailto:ceo@usepayle.com") && read(".well-known/security.txt").includes("Canonical:"));
check("security: public forms reject cross-origin browser posts", readFileSync(path.join(__dirname, "..", "functions", "api", "feedback.ts"), "utf8").includes("cross_origin") && readFileSync(path.join(__dirname, "..", "functions", "api", "subscribe.ts"), "utf8").includes("cross_origin"));
check("accessibility: feedback dialog has a labelled focusable implementation", readFileSync(path.join(__dirname, "..", "components", "FeedbackForm.tsx"), "utf8").includes("aria-labelledby=\"feedback-dialog-title\"") && readFileSync(path.join(__dirname, "..", "components", "FeedbackForm.tsx"), "utf8").includes("event.key !== \"Tab\"") && readFileSync(path.join(__dirname, "..", "components", "FeedbackForm.tsx"), "utf8").includes("triggerRef"));
check("WebMCP: registration is present in the page",
  index.includes('rel="ai-catalog"') && index.includes("webmcp.js") &&
    fs.existsSync(path.join(out, "webmcp.js")) &&
    readFileSync(path.join(out, "webmcp.js"), "utf8").includes("navigator.modelContext") &&
    readFileSync(path.join(out, "webmcp.js"), "utf8").includes("provideContext") &&
    readFileSync(path.join(out, "webmcp.js"), "utf8").includes("registerTool") &&
    readFileSync(path.join(out, "webmcp.js"), "utf8").includes("additionalProperties: false") &&
    readFileSync(path.join(out, "webmcp.js"), "utf8").includes("read_current_page") &&
    readFileSync(path.join(out, "webmcp.js"), "utf8").includes("search_site_archive") &&
    readFileSync(path.join(out, "webmcp.js"), "utf8").includes("find_site_content")
);

// L'indice delle skill si verifica **ricalcolando il digest** sul file pubblicato:
// è l'unico modo per cui "sha256:…" nell'indice e l'artefatto che un agente
// scarica sono la stessa cosa.
const skillIndex = JSON.parse(fs.readFileSync(wellKnown("agent-skills/index.json"), "utf8"));
const digestOk = skillIndex.skills.every((s) => {
  const rel = s.url.startsWith(PROD + "/") ? s.url.slice(PROD.length + 1) : null;
  const file = rel ? path.join(out, rel) : null;
  return (
    s.type === "skill-md" &&
    /^[a-z0-9-]+$/.test(s.name) &&
    !!s.description &&
    !!file &&
    fs.existsSync(file) &&
    s.digest === "sha256:" + createHash("sha256").update(readFileSync(file)).digest("hex")
  );
});
check(
  `well-known: agent-skills index, digests match (${skillIndex.skills.length} skill)`,
  skillIndex["$schema"] === "https://schemas.agentskills.io/discovery/0.2.0/schema.json" &&
    skillIndex.skills.length > 0 &&
    digestOk
);

// La riga che scopre tutto il resto: una relazione registrata, sulla risposta di
// ogni pagina, e non un indirizzo che non risponde.
check(
  "well-known: Link header on every page, pointing at files that exist",
  /Link: [^\n]*rel="describedby"/.test(headersFile) &&
    /Link: [^\n]*rel="service-doc"/.test(headersFile) &&
    [...headersFile.matchAll(/Link: ([^\n]*)/g)]
      .flatMap((m) => [...m[1].matchAll(/<([^>]+)>/g)].map((x) => x[1]))
      .every((href) => fs.existsSync(path.join(out, href.replace(/^\//, ""))))
);

// Favicon e logo nuovo
check("index: favicon icon.png", index.includes('rel="icon"') && index.includes("icon.png") && !index.includes("icon.svg"));

// L'avatar, alla dimensione in cui è mostrato. Il controllo nasce dal giorno in
// cui la home serviva un PNG 128×128 da 10,7KB per un quadrato di 40px — su
// mobile una richiesta che finisce prima, e Lighthouse stimava ~10KB di
// risparmio. Serve a non rimettere un'immagine più grande del suo riquadro.
const avatar = path.join(out, "mattia.webp");
check(
  "index: avatar WebP, sotto i 4KB",
  index.includes('src="/mattia.webp"') && fs.existsSync(avatar) && fs.statSync(avatar).size < 4 * 1024,
);
check(
  "index: footer + logo signature",
  index.includes("© 2026 Mattia Ciuni") &&
    index.includes('class="site-signature') &&
    fs.existsSync(path.join(__dirname, "..", "public", "logo.svg"))
);

// Due guasti che nessun tipo TypeScript vede e che l'HTML non perdona: un `<a>`
// dentro un `<a>` (React lo segnala come "cannot be a descendant of" e butta via
// l'idratazione, quindi la pagina si ricostruisce sul client) e un link interno
// che punta a una pagina non esportata. Girano su **tutto** l'export, non su una
// pagina campione: la card del feedback conteneva il link al GitHub dell'autore
// dentro il link della card, ed era l'unica pagina con quel difetto.
// (`pages` è la stessa lista di pagine che controlla gli `og:image` qui sopra.)
const nestedAnchors = [];
const unresolvedLinks = [];
for (const file of pages) {
  const html = readFileSync(file, "utf8");
  const where =
    "/" + path.relative(out, file).replace(/index\.html$/, "").split(path.sep).join("/");
  let open = 0;
  for (const tag of html.match(/<a\b[^>]*>|<\/a>/gi) || []) {
    if (/^<a\b/i.test(tag)) {
      if (open > 0) nestedAnchors.push(`${where} → ${tag.slice(0, 70)}`);
      open += 1;
    } else open = Math.max(0, open - 1);
  }
  for (const match of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = match[1];
    if (href.startsWith("/_next/") || href.startsWith("//")) continue;
    const target = path.join(out, href.replace(/^\//, ""));
    const candidates = [target, `${target}.html`, path.join(target, "index.html")];
    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      unresolvedLinks.push(`${where} → ${href}`);
    }
  }
}
check(`links: no nested <a> across ${pages.length} exported pages`, nestedAnchors.length === 0);
if (nestedAnchors.length) console.log("     " + nestedAnchors.slice(0, 5).join(", "));
const allowedCardLinks = unresolvedLinks.filter((entry) => entry.endsWith(".md"));
const realUnresolvedLinks = unresolvedLinks.filter((entry) => !entry.endsWith(".md"));
check("links: every internal href resolves in the export", realUnresolvedLinks.length === 0);
if (realUnresolvedLinks.length) console.log("     " + realUnresolvedLinks.slice(0, 5).join(", "));

// La forma di un controllo non si decide col focus. `:focus-visible` in
// `app/globals.css` sta **dopo** `@tailwind utilities` nello stesso foglio,
// quindi una `border-radius` scritta lì dentro vince sulle utility: era così che
// gli input `rounded-full` del form di feedback diventavano quadrati (2px) nel
// momento esatto in cui li si usava, e i campi di testo prendono `:focus-visible`
// anche col mouse. Il contorno sì, la forma no.
const globalsCss = readFileSync(path.join(__dirname, "..", "app", "globals.css"), "utf8");
const focusRules = [...globalsCss.matchAll(/(:focus[^{]*)\{([^}]*)\}/g)].map((m) => ({
  selector: m[1].trim(),
  body: m[2],
}));
const focusReshapes = focusRules.filter((rule) => /border-radius/.test(rule.body));
check(
  `css: a focus ring never reshapes its control (${focusRules.length} focus rules)`,
  focusRules.length > 0 && focusReshapes.length === 0,
);
if (focusReshapes.length) console.log("     " + focusReshapes.map((r) => r.selector).join(", "));

// Dark mode: i token foreground devono restare bianchi anche quando una pagina
// usa un componente senza classe esplicita. Il problema pero' e' invisibile
// nel layout statico: il colore applicato era #D4D4D4/#9C9C9C, quindi il build
// passava mentre frecce, etichette e modali risultavano grigi. Questo contratto
// legge il sorgente del tema e controlla anche i due punti che piu' spesso
// sfuggono: il testo nativo dei button e la classe del pulsante indietro.
const darkThemeBlock = globalsCss.match(/\.dark\s*\{([\s\S]*?)\n\}/)?.[1] || "";
const whiteForegroundTokens = ["--tc-paragraph", "--tc-gray-1000", "--tc-gray-1100", "--tc-gray-1200"];
const historyButtonSource = readFileSync(
  path.join(__dirname, "..", "components", "HistoryBackButton.tsx"),
  "utf8",
);
check(
  "theme: dark foreground tokens stay white",
  whiteForegroundTokens.every((token) => new RegExp(`${token}:\\s*255 255 255`).test(darkThemeBlock)),
);
check(
  "theme: native controls and paragraph copy follow the theme",
  /body\s*\{[\s\S]*?color:\s*rgb\(var\(--tc-gray-1200\)\)/.test(globalsCss) &&
    /\.text-text-paragraph\s*\{\s*color:\s*rgb\(var\(--tc-paragraph\)\)/.test(globalsCss),
);
check(
  "theme: back button keeps a theme-aware white arrow",
  historyButtonSource.includes("text-gray-1200") && historyButtonSource.includes('stroke="currentColor"'),
);

// Collegamenti interni (blog): testo → note/altri articoli, sezioni, correlati
// I link interni hanno la barra finale, come la canonical: con
// `trailingSlash: true` li scrive Next, ed è la forma che Pages serve senza
// reindirizzare.
check(
  "post: cross-links in content",
  post.includes('href="/notes/the-agentic-economy-is-a-trust-problem/"') &&
    post.includes('href="#what-agents-actually-need"')
);
check(
  "post: related lists",
  post.includes('aria-labelledby="more"') &&
    post.includes('aria-labelledby="notes"') &&
    post.includes('href="/notes/idempotent-payments-for-ai-agents/"')
);
check(
  "note: cross-links + related",
  note.includes('href="/thoughts/') && note.includes('aria-labelledby="thoughts"')
);
check(
  "post: toc anchors",
  post.includes('aria-label="On this page"') &&
    post.includes('what-agents-actually-need') &&
    post.includes('why-this-is-financial-infrastructure')
);

// peso homepage (html + css + js, raw; gzip ~1/3)
let bytes = fs.statSync(path.join(out, "index.html")).size;
function staticTotal(dir, ext) {
  let t = 0;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) t += staticTotal(p, ext);
    else if (f.name.endsWith(ext)) t += fs.statSync(p).size;
  }
  return t;
}
const css = staticTotal(path.join(out, "_next", "static"), ".css");
bytes += css;
const jsTotal = staticTotal(path.join(out, "_next", "static"), ".js");
console.log("all exported CSS: " + (css / 1024).toFixed(1) + "KB raw");
// Il budget comprende il CSS self-hosted (font inclusi), la sezione newsletter
// globale e il consenso analytics opzionale. La pagina resta sotto 70KB raw,
// mentre il browser non scarica font Google né GA finché non c'è consenso. Il
// numero è un guardrail per evitare regressioni, non un proxy del punteggio Lighthouse.
// La home include l'intero archivio Notes nel carousel, i due ingressi Field
// notes e i controlli interattivi accessibili. Le cover sono lazy, quindi il
// markup aggiuntivo non forza il download delle immagini fuori viewport.
// Il carousel include il testo completo delle note nell'archivio pubblico: la
// nuova nota di audit aggiunge contenuto reale alla home, non JavaScript o
// richieste critiche. Il guardrail sale a 115KB per includere la chat RAG sticky
// globale e lasciare spazio editoriale senza nascondere regressioni strutturali.
// staticTotal conta **tutti** i CSS dell'export, non solo quello linkato dalla
// home: le sezioni con client components (feedback, voice-notes) hanno bundle
// propri. Il check misura la pagina che un utente scarica davvero, quindi conta
// il CSS effettivamente referenziato dalla home, non l'intero sito.
const homeCssLinks = [...index.matchAll(/href="(\/_next\/static\/[^"]+\.css)"/g)].map(
  (m) => path.join(out, m[1].replace(/^\//, "").split("/").join(path.sep))
);
const homeCss = homeCssLinks.reduce((t, f) => t + (fs.existsSync(f) ? fs.statSync(f).size : 0), 0);
bytes = fs.statSync(path.join(out, "index.html")).size + homeCss;
console.log("homepage html+css: " + (bytes / 1024).toFixed(1) + "KB raw | all JS chunks: " + (jsTotal / 1024).toFixed(1) + "KB raw");
// Il form di feedback ha aggiunto markup reale alla home e la sezione Feedback
// in più. Il CSS globale sale lentamente con ogni componente client nuovo
// (hover states, varianti del modal): il guardrail segue la pagina, non il
// numero, e continua a fermare qualunque regressione strutturale oltre.
// Responsive viewport metadata and keyboard-safe mobile controls add a small,
// intentional amount of CSS/HTML to the static shell.
//
// Perche' il limite sale a 122KB: i nomi dei chunk JS sono **ripetuti** dentro il
// payload di idratazione, una volta per ogni componente client che li usa. Una
// rotta in piu' cambia lo split di Turbopack (misurato con `/link`: due chunk
// condivisi al posto di uno) e la stessa pagina home guadagna ~0.7KB di soli
// riferimenti, senza nessun byte di codice o CSS in piu'. Il budget serve a
// fermare regressioni strutturali, non a contare le rotte: 2KB di margine
// assorbono un paio di pagine nuove e qualsiasi regressione vera resta sopra.
//
// Perche' il limite sale a 128KB: la home elenca l'**intero** archivio Thoughts,
// e ogni articolo in piu' costa circa 1.6KB di HTML crudo. Non e' il testo del
// titolo: il payload di idratazione ripete ogni voce due volte, quindi una riga
// da ~300 byte si paga tre. Misurato con la quarta Thoughts (Alex): 121.5 -> 123.1KB.
//
// Il margine copre ancora qualche articolo, ma la crescita e' lineare e senza
// tetto: quando l'archivio arrivera' a farsi sentire, la risposta giusta e'
// strutturale (ultimi N in home + link "All thoughts", come fanno gia' Notes e
// Feedback) e non l'ennesima deroga al numero. Quel cambio e' una decisione di
// prodotto, quindi resta aperto qui invece di essere preso di nascosto.
// Perche' il limite sale a 132KB: tre cause insieme, 2026-09-25. (1) Il post di
// Raj e' il quinto Thought in home: ~1.6KB come da misura qui sopra. (2) Il
// corsivo vera di Instrument Serif entra nel CSS della home come due @font-face
// (659 byte): prima il browser inclinava i glyph sinteticamente e il testo delle
// citazioni si vedeva male. (3) La dark mode: i token colore passano da CSS
// variables (rgb(var(--tc-…))) e ogni utility colore paga la sintassi della
// variabile, ~1.5KB su tutta la pagina. Il prossimo articolo deve prendere la
// strada strutturale (ultimi N in home + link "All thoughts"), non questo numero.
check("weight: homepage html+css < 132KB raw", bytes < 132 * 1024);
process.exit(fail ? 1 : 0);
