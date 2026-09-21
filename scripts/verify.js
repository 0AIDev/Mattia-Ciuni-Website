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

// Il dominio: dalla variabile del progetto Pages se c'è, altrimenti dalla
// stringa scritta in `lib/site-origin.ts` — la **stessa** che legge il
// middleware. Non una seconda copia qui dentro: è esattamente così che il sito
// ha finito per dichiarare `mattiaciuni.xyz` (un dominio che non esiste) mentre
// rispondeva su un altro host, con tutti i controlli verdi.
const SITE_ORIGIN = /export const SITE_ORIGIN = "([^"]+)"/.exec(
  readFileSync(path.join(__dirname, "..", "lib", "site-origin.ts"), "utf8"),
)?.[1];
if (!SITE_ORIGIN) {
  console.error("verify: lib/site-origin.ts non dichiara SITE_ORIGIN");
  process.exit(1);
}
const PROD = (process.env.NEXT_PUBLIC_SITE_URL || SITE_ORIGIN).replace(/\/$/, "");

check("index: single h1", (index.match(/<h1/g) || []).length === 1);
check("index: h1 Mattia Ciuni", index.includes("<h1") && index.includes("Mattia Ciuni"));
check("post: single h1", (post.match(/<h1/g) || []).length === 1);
check("index: lang=en", index.includes('<html lang="en"'));
check("index: canonical", index.includes(`rel="canonical" href="${PROD}/"`));

// Il build può essere fatto per un dominio diverso da quello scritto in
// `lib/site-origin.ts`: succede quando il progetto Pages ha
// `NEXT_PUBLIC_SITE_URL`. Il middleware sostituisce l'host a chi serve la
// pagina, ma per farlo deve sapere **quale** dominio sta dentro l'export: se i
// due non coincidono la sostituzione non trova niente da sostituire, e ogni
// pagina dichiara un host che non è quello che qualcuno ha scelto.
const builtFor = index.match(/rel="canonical" href="(https?:\/\/[^/"]+)/)?.[1];
check(
  `origin: l'export dichiara ${SITE_ORIGIN} (il dominio che il middleware riscrive)`,
  builtFor === SITE_ORIGIN
);
if (builtFor !== SITE_ORIGIN) {
  console.log(`     l'export dichiara ${builtFor || "(nessun canonical assoluto)"}; aggiorna lib/site-origin.ts`);
}
check("post: canonical", post.includes(`rel="canonical" href="${PROD}/thoughts/money-layer-for-ai-agents/"`));
check("index: og:image absolute", index.includes(`og:image" content="${PROD}/og.png"`));
check("post: og:type article", post.includes('og:type" content="article"'));
check("post: article:published_time", post.includes("article:published_time"));
check("blog: twitter title fixed", blog.includes('twitter:title" content="Thoughts'));
check("index: twitter large image", index.includes('twitter:card" content="summary_large_image"'));
check("index: rel=me x3", (index.match(/rel="me noopener"/g) || []).length === 3);
check("index: mailto", index.includes("mailto:ceo@usepayle.com"));
check("index: theme-color", index.includes('name="theme-color" content="#FFFFFF"'));
check("index: Google Search Console verification", index.includes('name="google-site-verification" content="2Yp93wGXnpI1i5vhC09zwHdmGr1vY6rFCZIXptWOITI"'));

const person = ldJson(index).find((j) => j["@type"] === "Person");
check("index: Person JSON-LD valid", !!person && person.name === "Mattia Ciuni" && person.worksFor.name === "Payle" && person.sameAs.length === 5);
const art = ldJson(post).find((j) => j["@type"] === "BlogPosting");
check("post: BlogPosting JSON-LD valid", !!art && !!art.headline && !!art.datePublished && !!art.author);
const crumb = ldJson(post).find((j) => j["@type"] === "BreadcrumbList");
check("post: BreadcrumbList valid", !!crumb && crumb.itemListElement.length === 3);
check("post: breadcrumb visible", post.includes('aria-label="Breadcrumb"') && post.includes(">Home<") && post.includes(">Thoughts<") && post.includes('aria-current="page"'));
check("note: breadcrumb visible", note.includes('aria-label="Breadcrumb"') && note.includes(">Home<") && note.includes(">Notes<") && note.includes('aria-current="page"'));
const noteCrumb = ldJson(note).find((j) => j["@type"] === "BreadcrumbList");
check("note: BreadcrumbList valid", !!noteCrumb && noteCrumb.itemListElement.length === 3 && noteCrumb.itemListElement[2].item === `${PROD}/notes/on-boring-systems/`);
check("404: noindex + home link", read("404.html").includes('name="robots" content="noindex"') && read("404.html").includes("Go back home"));

const smIndex = read("sitemap.xml");
check("sitemap: index with 3 children", smIndex.includes('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">') && (smIndex.match(/<sitemap>/g) || []).length === 3 && smIndex.includes(`${PROD}/sitemap-home.xml`) && smIndex.includes(`${PROD}/sitemap-thoughts.xml`) && smIndex.includes(`${PROD}/sitemap-notes.xml`));
check("sitemap-home: 3 urls", (read("sitemap-home.xml").match(/<loc>/g) || []).length === 3 && read("sitemap-home.xml").includes(`${PROD}/`) && read("sitemap-home.xml").includes(`${PROD}/voice-notes/`) && read("sitemap-home.xml").includes(`${PROD}/videos/`));
check("sitemap-thoughts: 4 url", (read("sitemap-thoughts.xml").match(/<loc>/g) || []).length === 4 && read("sitemap-thoughts.xml").includes("finding-ghassen-the-co-founder-question-answered-in-three-weeks"));
check("sitemap-notes: 7 url", (read("sitemap-notes.xml").match(/<loc>/g) || []).length === 7 && read("sitemap-notes.xml").includes("/notes/"));
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
check("llms.txt: valid", llmtxt.startsWith("# Mattia Ciuni") && llmtxt.includes("## Thoughts") && llmtxt.includes("## Notes") && llmtxt.includes("/thoughts/") && llmtxt.includes("/notes/") && llmtxt.includes("mailto:") && llmtxt.includes(".md"));

// Card For AI: file .md generati in postbuild da scripts/gen-cards.mjs
const homeCard = read("index.md");
check("card home: structured", homeCard.startsWith("# Mattia") && homeCard.includes("- URL: " + PROD) && homeCard.includes("- Type: Home") && homeCard.includes("[Thoughts index](thoughts.md)") && homeCard.includes("[Notes index](notes.md)"));
check("cards: public copy for dev", fs.existsSync(path.join(__dirname, "..", "public", "index.md")) && fs.existsSync(path.join(__dirname, "..", "public", "thoughts", "money-layer-for-ai-agents.md")));
const thoughtsCard = read("thoughts.md");
check("card thoughts index: 3 posts", (thoughtsCard.match(/^\- \[.*\]\(thoughts\/[a-z0-9-]+\.md\)/gm) || []).length === 3 && thoughtsCard.includes("money-layer-for-ai-agents.md") && thoughtsCard.includes("artifact-based-hiring.md") && thoughtsCard.includes("finding-ghassen-the-co-founder-question-answered-in-three-weeks.md"));
const postCard = read("thoughts/money-layer-for-ai-agents.md");
check("card post: content", postCard.includes("- Type: Blog post") && postCard.includes(PROD + "/thoughts/money-layer-for-ai-agents") && postCard.includes("- Published: 2026-09-20"));
const notesCard = read("notes.md");
check("card notes index: 6 notes", (notesCard.match(/^\- \[.*\]\(notes\/[a-z0-9-]+\.md\)/gm) || []).length === 6 && notesCard.includes("idempotent-payments-for-ai-agents.md") && notesCard.includes("the-agentic-economy-is-a-trust-problem.md") && notesCard.includes("on-boring-systems.md") && notesCard.includes("what-interviews-teach-me-about-people-and-my-own-company.md") && notesCard.includes("honestly-im-excited.md") && notesCard.includes("about-the-name.md"));

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
check(
  "og: every article and note has its card",
  postSlugs.length > 0 &&
    noteSlugs.length > 0 &&
    postSlugs.length === pagesIn("thoughts").length &&
    noteSlugs.length === pagesIn("notes").length &&
    postSlugs.every((slug) => fs.existsSync(cardPath("thoughts", slug))) &&
    noteSlugs.every((slug) => fs.existsSync(cardPath("notes", slug)))
);
check(
  "covers: every article and note has its in-page image",
  postSlugs.every((slug) => fs.existsSync(path.join(out, "thoughts", slug, "cover.png"))) &&
    noteSlugs.every((slug) => fs.existsSync(path.join(out, "notes", slug, "cover.png")))
);
check(
  "og: no card without an article",
  cardsIn("thoughts").every((slug) => postSlugs.includes(slug)) &&
    cardsIn("notes").every((slug) => noteSlugs.includes(slug))
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
      return title.includes(" | ") && !title.includes("\u00B7") && html.includes('property="og:site_name"');
    })
);

const broken = declared.flatMap((p) =>
  p.urls.length === 0 || p.urls.some((u) => !u.startsWith(PROD))
    ? [p.file]
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
check(
  "auth.md: honest unauthenticated policy",
  fs.existsSync(path.join(out, "auth.md")) && read("auth.md").includes("does not currently expose protected APIs") &&
    headersFile.includes("/auth.md") && headersFile.includes("Content-Type: text/markdown")
);check("WebMCP: registration is present in the page",
  index.includes('rel="ai-catalog"') && index.includes("webmcp.js") &&
    fs.existsSync(path.join(out, "webmcp.js")) &&
    readFileSync(path.join(out, "webmcp.js"), "utf8").includes("navigator.modelContext") &&
    readFileSync(path.join(out, "webmcp.js"), "utf8").includes("registerTool") &&
    readFileSync(path.join(out, "webmcp.js"), "utf8").includes("read_current_page") &&
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
  post.includes('aria-label="Table of contents"') &&
    post.includes('href="#why-this-is-financial-infrastructure"')
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
console.log("homepage html+css: " + (bytes / 1024).toFixed(1) + "KB raw | all JS chunks: " + (jsTotal / 1024).toFixed(1) + "KB raw");
// Il budget comprende il CSS self-hosted (font inclusi), la sezione newsletter
// globale e il consenso analytics opzionale. La pagina resta sotto 70KB raw,
// mentre il browser non scarica font Google né GA finché non c'è consenso. Il
// numero è un guardrail per evitare regressioni, non un proxy del punteggio Lighthouse.
// La home include l'intero archivio Notes nel carousel, i due ingressi Field
// notes e i controlli interattivi accessibili. Le cover sono lazy, quindi il
// markup aggiuntivo non forza il download delle immagini fuori viewport.
check("weight: homepage html+css < 100KB raw", bytes < 100 * 1024);
process.exit(fail ? 1 : 0);
