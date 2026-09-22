import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "out");
const docs = join(root, "docs", "SEO-LIVE-AUDIT.md");
if (!existsSync(join(out, "index.html"))) {
  console.error("audit: run npm run build first");
  process.exit(1);
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith("_")) walk(full, files);
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}
function text(value = "") { return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function match(html, expression) { return expression.exec(html)?.[1] || ""; }
function pathFor(file) {
  const rel = relative(out, file).split("\\").join("/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"/index.html".length)}/`;
  return `/${rel}`;
}
function localLinks(html) {
  return [...html.matchAll(/href="(\/[^"#?]*)/g)].map((m) => m[1]).filter((href, i, all) => all.indexOf(href) === i && !href.startsWith("/_next/"));
}
function schemaTypes(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => {
    try {
      const value = JSON.parse(m[1]);
      return value["@graph"] ? value["@graph"].map((item) => item["@type"]).flat() : [value["@type"]];
    } catch { return []; }
  }).filter(Boolean);
}
const files = walk(out).filter((file) => {
  const url = pathFor(file);
  return !url.startsWith("/admin") && url !== "/404/" && url !== "/404.html";
});
const sitemap = existsSync(join(out, "sitemap.xml")) ? readFileSync(join(out, "sitemap.xml"), "utf8") : "";
const childMaps = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].split(".pages.dev").pop());
const sitemapText = childMaps.map((name) => {
  const file = join(out, name.replace(/^\//, ""));
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}).join("\n");
const rows = files.map((file) => {
  const html = readFileSync(file, "utf8");
  const url = pathFor(file);
  const title = match(html, /<title>([^<]*)<\/title>/);
  const description = match(html, /name="description" content="([^"]*)/);
  const canonical = match(html, /rel="canonical" href="([^"]*)/);
  const og = match(html, /property="og:image" content="([^"]*)/);
  const h1 = text(match(html, /<h1[^>]*>([\s\S]*?)<\/h1>/));
  const images = (html.match(/<img\b/g) || []).length;
  const missingAlt = [...html.matchAll(/<img\b([^>]*)>/g)].filter((m) => !/\balt="/.test(m[1])).length;
  const links = localLinks(html).length;
  const schemas = schemaTypes(html);
  return {
    url, title, description, canonical, h1, images, missingAlt, links, schemas,
    inSitemap: Boolean(canonical) && new RegExp(`<loc>${canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<\\/loc>`).test(sitemapText),
    titleOk: title.includes(" | ") && !title.includes("·"),
    canonicalOk: canonical.endsWith(url) || canonical.endsWith(url.slice(0, -1)),
    ogOk: Boolean(og) && og.includes("mattiaciuni.pages.dev"),
    schemaOk: schemas.length > 0,
  };
});
const status = (value) => value ? "PASS" : "CHECK";
const rowLine = (row) => {
  const alt = row.missingAlt === 0 ? "all alt" : `${row.missingAlt} missing`;
  return `| [${row.url}](${row.url}) | ${status(row.titleOk)} ${row.title.slice(0, 58)} | ${status(row.canonicalOk)} | ${status(row.schemaOk)} ${row.schemas.join(", ") || "none"} | ${status(row.ogOk)} | ${status(row.inSitemap)} | ${row.images} / ${alt} | ${row.links} |`;
};
const lines = [
  "# SEO page-by-page audit",
  "",
  `Generated from the static export on ${new Date().toISOString().slice(0, 10)}. This is the repository/export audit. Run node scripts/audit-seo.mjs --site=https://mattiaciuni.pages.dev after deployment for a network-level check; DNS, Cloudflare headers, cache and Search Console are not provable from the export alone.`,
  "",
  "## Executive summary",
  "",
  `The audit found **${rows.length} public HTML pages**. Every public page is checked for a title, canonical, Open Graph image, H1, structured data, image alt text and sitemap membership. The admin area is intentionally excluded from indexing and from this table. A CHECK is a prompt for review, not an automatic ranking failure: empty content pages such as Videos and Voice Notes can legitimately have no item-level schema when they are awaiting recordings.`,
  "",
  "## Page inventory",
  "",
  "| URL | title | canonical | schema | OG image | sitemap | images/alt | internal links |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ...rows.map(rowLine),
  "",
  "## What to fix first",
  "",
  "1. **Keep the homepage and `/work/` as entity hubs.** They should explain the relationship between Mattia Ciuni, Payle, Celeste and the real subjects of the writing. Do not create thin pages for every keyword permutation.",
  "2. **Keep article URLs stable.** A title change does not justify changing a slug. If a URL must move, add a permanent redirect and update the canonical, sitemap, feed and internal links together.",
  "3. **Use one primary intent per article.** A pillar can mention many related terms, but supporting pieces should answer a narrower real question and link back to the pillar with descriptive anchor text.",
  "4. **Validate the live origin.** Run the live audit after each production deploy and inspect the homepage, /work/, one Thought, one Note, /feedback/, /robots.txt, /sitemap.xml and /.well-known/security.txt from the actual domain.",
  "5. **Use Search Console for indexing, not invented automation.** Submit the sitemap, inspect representative URLs, and request indexing only for genuinely new or materially updated pages. No script can force a first position.",
  "",
  "## Schema and entity plan",
  "",
  "The homepage and About page are the authoritative Person surfaces. The Work page is a CollectionPage and ItemList connecting Payle and Celeste to the real work. Thoughts and Notes should remain Article or BlogPosting pages with Mattia as author, stable dates and related links. Feedback is a public record of user perspective, not a claim that every contributor is an employee or co-author. Keep sameAs limited to profiles actually controlled by Mattia; never add a profile merely because a keyword strategy would benefit from it.",
  "",
  "## Verification commands",
  "",
  "Commands:",
  "npm run build",
  "node scripts/audit-seo.mjs",
  "node scripts/check-live.mjs --site=https://mattiaciuni.pages.dev",
  "node scripts/verify.js",
  "",
  "",
  "The live checker verifies DNS, sitemap child maps, page status, canonical ownership and OG image reachability. Search Console coverage, external backlinks, Core Web Vitals from real users and Google ranking remain external measurements.",
  "",
];
writeFileSync(docs, lines.join("\n"), "utf8");
console.log(`audit: wrote ${docs} (${rows.length} pages)`);
