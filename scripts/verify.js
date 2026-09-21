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
function ldJson(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  return blocks.map((m) => JSON.parse(m[1]));
}
const index = read("index.html");
const blog = read("thoughts.html");
const post = read("thoughts/money-layer-for-ai-agents.html");
const note = read("notes/on-boring-systems.html");
const PROD = (process.env.NEXT_PUBLIC_SITE_URL || "https://mattiaciuni.xyz").replace(/\/$/, "");

check("index: single h1", (index.match(/<h1/g) || []).length === 1);
check("index: h1 Mattia Ciuni", index.includes("<h1") && index.includes("Mattia Ciuni"));
check("post: single h1", (post.match(/<h1/g) || []).length === 1);
check("index: lang=en", index.includes('<html lang="en"'));
check("index: canonical", index.includes(`rel="canonical" href="${PROD}"`));
check("post: canonical", post.includes(`rel="canonical" href="${PROD}/thoughts/money-layer-for-ai-agents/"`));
check("index: og:image absolute", index.includes(`og:image" content="${PROD}/og.png"`));
check("post: og:type article", post.includes('og:type" content="article"'));
check("post: article:published_time", post.includes("article:published_time"));
check("blog: twitter title fixed", blog.includes('twitter:title" content="Thoughts'));
check("index: twitter large image", index.includes('twitter:card" content="summary_large_image"'));
check("index: rel=me x3", (index.match(/rel="me noopener"/g) || []).length === 3);
check("index: mailto", index.includes("mailto:ceo@usepayle.com"));
check("index: theme-color", index.includes('name="theme-color" content="#FCFCFC"'));

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
check("sitemap-home: 1 url", (read("sitemap-home.xml").match(/<loc>/g) || []).length === 1 && read("sitemap-home.xml").includes(`${PROD}/`));
check("sitemap-thoughts: 3 url", (read("sitemap-thoughts.xml").match(/<loc>/g) || []).length === 3 && read("sitemap-thoughts.xml").includes("/thoughts/"));
check("sitemap-notes: 4 url", (read("sitemap-notes.xml").match(/<loc>/g) || []).length === 4 && read("sitemap-notes.xml").includes("/notes/"));
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
check("robots: allow everything", robots.includes("User-Agent: *") && robots.includes("Allow: /") && robots.includes(`Sitemap: ${PROD}/sitemap.xml`));
check(
  "robots: AI agents by name",
  ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot", "Bytespider"].every((a) => robots.includes(`User-Agent: ${a}`)) &&
    (robots.match(/^User-Agent:/gm) || []).length >= 30
);
check(
  "robots: content signal declared",
  robots.includes("Content-Signal: ai-train=yes, search=yes, ai-input=yes")
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
check("card thoughts index: 2 posts", (thoughtsCard.match(/^\- \[.*\]\(thoughts\/[a-z0-9-]+\.md\)/gm) || []).length === 2 && thoughtsCard.includes("money-layer-for-ai-agents.md") && thoughtsCard.includes("artifact-based-hiring.md"));
const postCard = read("thoughts/money-layer-for-ai-agents.md");
check("card post: content", postCard.includes("- Type: Blog post") && postCard.includes(PROD + "/thoughts/money-layer-for-ai-agents") && postCard.includes("- Published: 2026-09-20"));
const notesCard = read("notes.md");
check("card notes index: 3 notes", (notesCard.match(/^\- \[.*\]\(notes\/[a-z0-9-]+\.md\)/gm) || []).length === 3 && notesCard.includes("idempotent-payments-for-ai-agents.md") && notesCard.includes("the-agentic-economy-is-a-trust-problem.md") && notesCard.includes("on-boring-systems.md"));

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
// Le pagine costruite: nell'export sono file (`thoughts/<slug>.html`), mentre le
// card stanno in cartelle (`thoughts/<slug>/og.png`).
const pagesIn = (dir) =>
  readdirSync(path.join(out, dir))
    .filter((n) => n.endsWith(".html"))
    .map((n) => n.replace(/\.html$/, ""));
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
  "og: no card without an article",
  cardsIn("thoughts").every((slug) => postSlugs.includes(slug)) &&
    cardsIn("notes").every((slug) => noteSlugs.includes(slug))
);
check(
  "og: each section declares its own card",
  blog.includes(`og:image" content="${PROD}/thoughts/og.png"`) &&
    read("notes.html").includes(`og:image" content="${PROD}/notes/og.png"`)
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

// Favicon e logo nuovo
check("index: favicon icon.png", index.includes('rel="icon"') && index.includes("icon.png") && !index.includes("icon.svg"));
check(
  "index: footer + logo signature",
  index.includes("© 2026 Mattia Ciuni") &&
    index.includes('class="site-signature') &&
    fs.existsSync(path.join(__dirname, "..", "public", "logo.svg"))
);

// Collegamenti interni (blog): testo → note/altri articoli, sezioni, correlati
check(
  "post: cross-links in content",
  post.includes('href="/notes/the-agentic-economy-is-a-trust-problem"') &&
    post.includes('href="#what-agents-actually-need"')
);
check(
  "post: related lists",
  post.includes('aria-labelledby="more"') &&
    post.includes('aria-labelledby="notes"') &&
    post.includes('href="/notes/idempotent-payments-for-ai-agents"')
);
check(
  "note: cross-links + related",
  note.includes('href="/thoughts/money-layer-for-ai-agents"') &&
    note.includes('aria-labelledby="thoughts"')
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
check("weight: homepage html+css < 56KB raw", bytes < 56 * 1024);
process.exit(fail ? 1 : 0);
