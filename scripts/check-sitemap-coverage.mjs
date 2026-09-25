import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "out");
const productionOrigin = "https://mattiaciuni.pages.dev";
// Plain Node cannot import the TypeScript i18n module; keep this list in sync
// with `lib/i18n.ts` when a locale is added.
const LOCALES = ["en", "it", "fr", "es", "de"];
const localeSet = new Set(LOCALES);
const sitemapFiles = [
  "sitemap-home.xml",
  "sitemap-thoughts.xml",
  "sitemap-notes.xml",
  "sitemap-feedback.xml",
];
const errorPaths = new Set(["/404/", "/404.html", "/_not-found/"]);
const careersApplicationPattern = /^\/(?:[a-z]{2}\/)?careers\/(?:[^/]+\/apply|confirmed|thank-you|preview)\/$/;
const staticExtensions = new Set([
  "avif",
  "css",
  "csv",
  "gif",
  "ico",
  "jpeg",
  "jpg",
  "js",
  "json",
  "map",
  "md",
  "mp3",
  "mp4",
  "pdf",
  "png",
  "svg",
  "txt",
  "webmanifest",
  "webp",
  "woff",
  "woff2",
  "xml",
]);

if (!existsSync(join(out, "index.html"))) {
  console.error("sitemap coverage: out/ is missing; run npm run build first");
  process.exit(1);
}

let failures = 0;
const check = (name, condition, detail = "") => {
  console.log(`${condition ? "PASS" : "FAIL"} ${name}${condition || !detail ? "" : ` — ${detail}`}`);
  if (!condition) failures += 1;
};

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) walk(file, files);
    else if (entry.name.endsWith(".html")) files.push(file);
  }
  return files;
}

function pathFor(file) {
  const rel = relative(out, file).split(sep).join("/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"/index.html".length)}/`;
  return `/${rel}`;
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return result;
}

function htmlLanguage(html) {
  const tag = html.match(/<html\b[^>]*>/i)?.[0];
  return tag ? attributes(tag).lang || "" : "";
}

function metaContent(html, name) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    if (attrs.name?.toLowerCase() === name.toLowerCase()) return attrs.content || "";
  }
  return "";
}

function isNoindex(html) {
  const directives = metaContent(html, "robots").toLowerCase().split(/[\s,]+/);
  return directives.includes("noindex") || directives.includes("none");
}

/**
 * Con `output: "export"` Next scrive comunque un `404.html` per ogni percorso
 * che una route dinamica potrebbe generare, anche quando `generateStaticParams`
 * non lo elenca: `dynamicParams = false` non lo impedisce. Il file c'e', quindi un
 * check che enumera l'export lo trova, ma non e' una pagina: porta la `canonical`
 * della home e si dichiara `noindex`.
 *
 * Non si puo' pero' basarsi sul solo `noindex`, perche' anche `/careers/preview/`
 * e `/nda/` sono `noindex` di proposito e quelle **devono** restare nell'export.
 * La distinzione e' la canonical: se punta alla home, il file e' la shell 404.
 */
function linkHref(html, rel) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    if ((attrs.rel || "").toLowerCase() === rel) return attrs.href || "";
  }
  return "";
}

function isNotFoundShell(html) {
  if (!isNoindex(html)) return false;
  const canonical = linkHref(html, "canonical").replace(/\/$/, "");
  if (!canonical) return true;
  try {
    // La shell 404 dichiara la home come canonical, quindi l'URL si riduce
    // all'origine. Una pagina reale dichiara il proprio indirizzo, piu' lungo.
    return new URL(canonical).pathname === "/";
  } catch {
    return true;
  }
}

function decodeXml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function xmlLocations(xml) {
  return [...xml.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)].map((match) => decodeXml(match[1].trim()));
}

function normalizeCrawlPath(path) {
  if (!path) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return null;
  }
  const lastSegment = decoded.split("/").filter(Boolean).at(-1) || "";
  const extension = lastSegment.includes(".") ? lastSegment.split(".").at(-1)?.toLowerCase() : "";
  if (extension && staticExtensions.has(extension)) return null;
  if (decoded === "/") return "/";
  return decoded.endsWith("/") ? decoded : `${decoded}/`;
}

function internalPath(raw, currentPath) {
  const href = decodeXml(raw.trim());
  if (!href || href.startsWith("#") || /^(?:mailto|tel|javascript|data):/i.test(href)) return null;
  let url;
  try {
    const base = `${productionOrigin}${currentPath.startsWith("/") ? currentPath : `/${currentPath}`}`;
    url = new URL(href, base);
  } catch {
    return null;
  }
  if (url.origin !== productionOrigin || url.search || url.hash) return null;
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin/") ||
    url.pathname.startsWith("/.well-known/") ||
    url.pathname.startsWith("/rag/")
  ) {
    return null;
  }
  return normalizeCrawlPath(url.pathname);
}

function linkedPaths(html, currentPath) {
  const links = [];
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/gi)) {
    const linked = internalPath(match[1] ?? match[2] ?? "", currentPath);
    if (linked) links.push(linked);
  }
  return links;
}

const exported = new Map();
for (const file of walk(out)) {
  const path = pathFor(file);
  const html = readFileSync(file, "utf8");
  exported.set(path, {
    path,
    html,
    noindex: isNoindex(html),
    language: htmlLanguage(html),
  });
}

const publicExport = [...exported.values()].filter(
  (page) => !errorPaths.has(page.path) && !page.path.startsWith("/admin/") && !isNotFoundShell(page.html),
);
const indexableExport = publicExport.filter((page) => !page.noindex);
const noindexExport = [...exported.values()].filter((page) => page.noindex && !isNotFoundShell(page.html));

const sitemapPaths = new Map();
for (const file of sitemapFiles) {
  const sitemapOriginFailures = [];
  const fullPath = join(out, file);
  if (!existsSync(fullPath)) {
    check(`sitemap exists: ${file}`, false);
    continue;
  }
  const xml = readFileSync(fullPath, "utf8");
  const locations = xmlLocations(xml);
  const fileEntries = [];
  for (const raw of locations) {
    let url;
    try {
      url = new URL(raw);
    } catch {
      sitemapOriginFailures.push(`${file}: invalid URL ${raw}`);
      continue;
    }
    const validOrigin = url.origin === productionOrigin;
    const validPath = url.pathname.startsWith("/") && (url.pathname === "/" || url.pathname.endsWith("/"));
    if (!validOrigin || !validPath || url.username || url.password || url.search || url.hash) {
      sitemapOriginFailures.push(`${file}: ${raw}`);
      continue;
    }
    const normalizedPath = normalizeCrawlPath(url.pathname);
    if (!normalizedPath) {
      sitemapOriginFailures.push(`${file}: unsupported URL ${raw}`);
      continue;
    }
    const entry = { file, raw, path: normalizedPath };
    fileEntries.push(entry);
    const sources = sitemapPaths.get(normalizedPath) || [];
    sources.push(file);
    sitemapPaths.set(normalizedPath, sources);
  }
  check(`sitemap XML uses the production origin: ${file}`, sitemapOriginFailures.length === 0, sitemapOriginFailures.slice(0, 3).join(", "));
  check(`sitemap contains URLs: ${file}`, fileEntries.length > 0);
}

const duplicateSitemapPaths = [...sitemapPaths.entries()]
  .filter(([, sources]) => sources.length > 1)
  .map(([path, sources]) => `${path} (${sources.join(", ")})`);

const sitemapPathList = [...sitemapPaths.keys()];
const missingFromExport = sitemapPathList.filter((path) => !exported.has(path));
const sitemapNotIndexable = sitemapPathList
  .map((path) => exported.get(path))
  .filter((page) => page?.noindex)
  .map((page) => page.path);
const careersSitemapLeaks = sitemapPathList.filter((path) => careersApplicationPattern.test(path));

const sectionSeeds = [
  "about",
  "work",
  "thoughts",
  "notes",
  "feedback",
  "privacy",
  "terms",
  "cookies",
  "legal",
  "newsletter",
  "link",
  "voice-notes",
  "videos",
  "careers",
];
// La home non contiene tutti i selettori di lingua e le sezioni editoriali.
// Per questo il crawl parte dalla home e dagli indici pubblici, poi segue solo
// link HTML interni: un URL sitemap che non emerge da questa rete è irraggiungibile.
const crawlQueue = [
  "/",
  ...sectionSeeds.map((section) => `/${section}/`),
  ...LOCALES.flatMap((locale) => [
    `/${locale}/`,
    ...sectionSeeds.map((section) => `/${locale}/${section}/`),
  ]),
];
const crawled = new Set();
const crawlMissingFromExport = new Set();
while (crawlQueue.length) {
  const path = crawlQueue.shift();
  if (!path || crawled.has(path)) continue;
  crawled.add(path);
  const page = exported.get(path);
  if (!page) {
    crawlMissingFromExport.add(path);
    continue;
  }
  for (const linked of linkedPaths(page.html, path)) {
    if (!crawled.has(linked)) crawlQueue.push(linked);
  }
}

const crawlIndexable = [...crawled]
  .map((path) => exported.get(path))
  .filter((page) => page && !page.noindex);
const missingFromSitemaps = indexableExport
  .filter((page) => !sitemapPaths.has(page.path))
  .map((page) => page.path)
  .sort();
const sitemapMissingFromCrawl = sitemapPathList.filter((path) => !crawled.has(path)).sort();
const localizedPages = indexableExport.filter((page) => {
  const locale = page.path.match(/^\/([a-z]{2})(?:\/|$)/)?.[1];
  return locale && localeSet.has(locale);
});
const wrongLocalizedLanguage = localizedPages
  .filter((page) => page.language !== page.path.match(/^\/([a-z]{2})(?:\/|$)/)?.[1])
  .map((page) => ({
    path: page.path,
    expected: page.path.match(/^\/([a-z]{2})(?:\/|$)/)?.[1],
    actual: page.language,
  }));
const allowedNoindex = (path) =>
  errorPaths.has(path) || path === "/nda/" || path.startsWith("/admin/") || careersApplicationPattern.test(path);
const unexpectedNoindex = noindexExport.map((page) => page.path).filter((path) => !allowedNoindex(path)).sort();

const sitemapIndex = join(out, "sitemap.xml");
const sitemapIndexExists = existsSync(sitemapIndex);
const expectedSitemapIndexPaths = sitemapFiles.map((file) => `/${file}`);
let sitemapIndexPaths = [];
let sitemapIndexFailures = [];
if (sitemapIndexExists) {
  for (const raw of xmlLocations(readFileSync(sitemapIndex, "utf8"))) {
    try {
      const url = new URL(raw);
      if (url.origin !== productionOrigin || !url.pathname.startsWith("/") || url.username || url.password || url.search || url.hash) {
        sitemapIndexFailures.push(raw);
      } else {
        sitemapIndexPaths.push(url.pathname);
      }
    } catch {
      sitemapIndexFailures.push(raw);
    }
  }
}

check("crawled internal links resolve to exported pages", crawlMissingFromExport.size === 0, [...crawlMissingFromExport].slice(0, 10).join(", "));
check("every indexable exported page is included in a sitemap", missingFromSitemaps.length === 0, missingFromSitemaps.slice(0, 10).join(", "));
check("every sitemap URL exists in the export", missingFromExport.length === 0, missingFromExport.slice(0, 10).join(", "));
check("every sitemap URL is reachable by the internal crawl", sitemapMissingFromCrawl.length === 0, sitemapMissingFromCrawl.slice(0, 10).join(", "));
check("no sitemap URL is noindex", sitemapNotIndexable.length === 0, sitemapNotIndexable.slice(0, 10).join(", "));
check("no sitemap URL duplicates another sitemap URL", duplicateSitemapPaths.length === 0, duplicateSitemapPaths.slice(0, 10).join(", "));
check("Careers application flows stay out of every sitemap", careersSitemapLeaks.length === 0, careersSitemapLeaks.slice(0, 10).join(", "));
check("only expected application/private pages are noindex", unexpectedNoindex.length === 0, unexpectedNoindex.slice(0, 10).join(", "));
check("all indexable localized pages use the URL locale on <html lang>", wrongLocalizedLanguage.length === 0, wrongLocalizedLanguage.slice(0, 10).map((page) => `${page.path} (${page.expected} != ${page.actual || "missing"})`).join(", "));
check("sitemap index exists", sitemapIndexExists);
check("sitemap index uses the production origin", sitemapIndexFailures.length === 0, sitemapIndexFailures.slice(0, 10).join(", "));
check("sitemap index references every child sitemap", sitemapIndexPaths.length === expectedSitemapIndexPaths.length && expectedSitemapIndexPaths.every((path) => sitemapIndexPaths.includes(path)), sitemapIndexPaths.join(", "));

console.log(
  `sitemap coverage: ${exported.size} exported pages, ${crawlIndexable.length} crawlable/indexable, ` +
    `${indexableExport.length} indexable, ${sitemapPaths.size} sitemap URLs, ${missingFromSitemaps.length} missing, ` +
    `${sitemapMissingFromCrawl.length} unreachable from the crawl`,
);
process.exit(failures ? 1 : 0);
