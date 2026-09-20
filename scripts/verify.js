const fs = require("fs");
const path = require("path");
const out = path.join(__dirname, "..", "out");
let fail = 0;
function check(name, cond) {
  console.log((cond ? "PASS" : "FAIL") + " " + name);
  if (!cond) fail++;
}
function read(p) { return fs.readFileSync(path.join(out, p), "utf8"); }
function ldJson(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  return blocks.map((m) => JSON.parse(m[1]));
}
const index = read("index.html");
const blog = read("thoughts.html");
const post = read("thoughts/money-layer-for-ai-agents.html");
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
check("404: noindex + home link", read("404.html").includes('name="robots" content="noindex"') && read("404.html").includes("Go back home"));

const smIndex = read("sitemap.xml");
check("sitemap: index with 3 children", smIndex.includes('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">') && (smIndex.match(/<sitemap>/g) || []).length === 3 && smIndex.includes(`${PROD}/sitemap-home.xml`) && smIndex.includes(`${PROD}/sitemap-thoughts.xml`) && smIndex.includes(`${PROD}/sitemap-notes.xml`));
check("sitemap-home: 1 url", (read("sitemap-home.xml").match(/<loc>/g) || []).length === 1 && read("sitemap-home.xml").includes(`${PROD}/`));
check("sitemap-thoughts: 3 url", (read("sitemap-thoughts.xml").match(/<loc>/g) || []).length === 3 && read("sitemap-thoughts.xml").includes("/thoughts/"));
check("sitemap-notes: 4 url", (read("sitemap-notes.xml").match(/<loc>/g) || []).length === 4 && read("sitemap-notes.xml").includes("/notes/"));
const robots = read("robots.txt");
check("robots: allow everything", robots.includes("User-Agent: *") && robots.includes("Allow: /") && robots.includes(`Sitemap: ${PROD}/sitemap.xml`));
const llmtxt = read("llms.txt");
check("llms.txt: valid", llmtxt.startsWith("# Mattia Ciuni") && llmtxt.includes("## Thoughts") && llmtxt.includes("## Notes") && llmtxt.includes("/thoughts/") && llmtxt.includes("/notes/") && llmtxt.includes("mailto:"));

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
check("weight: homepage html+css < 52KB raw", bytes < 52 * 1024);
process.exit(fail ? 1 : 0);
