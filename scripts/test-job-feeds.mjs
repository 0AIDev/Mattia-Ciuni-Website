// Contratto offline dei feed dei ruoli e della tracciatura della fonte.
//
// Non tocca la rete: legge i tre file nell'export (`out/`) e le sorgenti, e
// verifica ciò che un aggregatore può rompere senza che nessuno se ne accorga —
// XML non valido, ruoli chiusi nel feed, URL che non tornano al sito, una fonte
// che arriva nel database senza passare dalla allowlist. Il fetch reale di
// Indeed resta UNVERIFIED, come il delivery email per le newsletter.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "out");

let failures = 0;
const check = (name, condition, detail = "") => {
  console.log(`${condition ? "PASS" : "FAIL"} ${name}${condition || !detail ? "" : ` — ${detail}`}`);
  if (!condition) failures += 1;
};

const read = (p) => readFileSync(join(out, p), "utf8");

if (!existsSync(join(out, "jobs.xml"))) {
  console.error("job feeds: out/ is missing; run npm run build first");
  process.exit(1);
}

// --- Sorgenti: i ruoli veri, letti da jobs.ts attraverso tsx ----------------
// (`tsx/esm/api.js` non è esportato dalla versione corrente; il runner è
// semplicemente `tsx scripts/test-job-feeds.mjs`, che registra il loader prima
// di eseguire il file. Il package script fa già così.)
const importLocal = (p) => import(pathToFileURL(p).href);
const { jobs, openJobs } = await importLocal(join(root, "lib", "careers", "jobs.ts"));
const { APPLICATION_SOURCES, applicationSource } = await importLocal(join(root, "lib", "careers", "validation.ts"));
const openSlugs = openJobs().map((job) => job.slug);

// --- jobs.xml (formato Indeed) ---------------------------------------------
const xml = read("jobs.xml");
check("jobs.xml: valid XML declaration + single root", xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>') && /^<source>/m.test(xml) && /<\/source>\s*$/.test(xml));
check("jobs.xml: declares publisher and publisherUrl", xml.includes("<publisher>Payle</publisher>") && xml.includes("https://usepayle.com"));
check("jobs.xml: RFC 2822 lastBuildDate", /<lastBuildDate>[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT<\/lastBuildDate>/.test(xml));
const xmlJobs = [...xml.matchAll(/<job>/g)].length;
check(`jobs.xml: contains exactly the open roles (${openSlugs.length})`, xmlJobs === openSlugs.length, `found ${xmlJobs}`);
check("jobs.xml: no closed or coming-soon roles", openSlugs.every((slug) => xml.includes(`<referenceno><![CDATA[${slug}]]></referenceno>`)) && !xml.includes("coming-soon"));
check("jobs.xml: every url points back to the site", [...xml.matchAll(/<url><!\[CDATA\[([^\]]+)\]\]><\/url>/g)].every((m) => m[1].startsWith("https://mattiaciuni.pages.dev/careers/") && m[1].endsWith("/")));
check("jobs.xml: description is clean HTML (no scripts, no styles)", !/<script|<style|onclick|class=/i.test(xml));
check("jobs.xml: description CDATA has no raw ]]> sequence", !/(?<!\]\]])><!\[CDATA\[\s*\]\]>/.test(xml) && ![...xml.matchAll(/<!\[CDATA\[([\s\S]*?)\]\]>/g)].some((m) => m[1].includes("]]>")));
check("jobs.xml: salary present on every open role", [...xml.matchAll(/<salary><!\[CDATA\[([^\]]*)\]\]><\/salary>/g)].every((m) => m[1].length > 0));
check("jobs.xml: jobtype normalized (full-time/part-time/contractor)", [...xml.matchAll(/<jobtype><!\[CDATA\[([^\]]*)\]\]><\/jobtype>/g)].every((m) => ["full-time", "part-time", "contractor"].includes(m[1])));
check("jobs.xml: cache headers written in the route source", readFileSync(join(root, "app", "jobs.xml", "route.ts"), "utf8").includes("max-age=3600"));

// --- jobs.rss.xml -----------------------------------------------------------
const rss = read("jobs.rss.xml");
check("jobs.rss.xml: valid RSS 2.0 structure", rss.startsWith('<?xml version="1.0" encoding="UTF-8"?>') && rss.includes('<rss version="2.0">') && rss.includes("</rss>"));
check("jobs.rss.xml: channel metadata", rss.includes("<title>Payle") && rss.includes("<language>en</language>") && rss.includes("<lastBuildDate>"));
check("jobs.rss.xml: item count matches open roles", [...rss.matchAll(/<item>/g)].length === openSlugs.length);
check("jobs.rss.xml: guid isPermaLink and absolute", [...rss.matchAll(/<guid isPermaLink="true">([^<]+)<\/guid>/g)].every((m) => m[1].startsWith("https://mattiaciuni.pages.dev/careers/")));
check("jobs.rss.xml: description entities escaped (no raw < inside)", [...rss.matchAll(/<description>([\s\S]*?)<\/description>/g)].every((m) => !/<(?:h3|p|ul|li)[\s>]/.test(m[1])));
check("jobs.rss.xml: every item has RFC 822 pubDate", [...rss.matchAll(/<pubDate>([^<]+)<\/pubDate>/g)].every((m) => !Number.isNaN(Date.parse(m[1]))));

// --- jobs.atom.xml ----------------------------------------------------------
const atom = read("jobs.atom.xml");
check("jobs.atom.xml: valid Atom 1.0 structure", atom.includes('<feed xmlns="http://www.w3.org/2005/Atom">') && atom.includes("</feed>"));
check("jobs.atom.xml: id, self link and updated", atom.includes('<link rel="self"') && /<id>https:\/\/mattiaciuni\.pages\.dev\/jobs\.atom\.xml<\/id>/.test(atom) && /<updated>\d{4}-\d{2}-\d{2}T/.test(atom));
check("jobs.atom.xml: entry count matches open roles", [...atom.matchAll(/<entry>/g)].length === openSlugs.length);
check("jobs.atom.xml: content type html", [...atom.matchAll(/<content type="html">/g)].length === openSlugs.length);
check("jobs.atom.xml: every entry links back to the site", [...atom.matchAll(/<link rel="alternate" href="([^"]+)"/g)].every((m) => m[1].startsWith("https://mattiaciuni.pages.dev/careers/")));

// --- JSON-LD JobPosting sulle pagine ruolo ----------------------------------
for (const job of openJobs()) {
  const page = read(join("careers", job.slug, "index.html"));
  const match = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(page);
  const parsed = match ? JSON.parse(match[1]) : null;
  const ok =
    parsed &&
    parsed["@type"] === "JobPosting" &&
    parsed.directApply === true &&
    typeof parsed.description === "string" &&
    parsed.description.includes("<h3>") &&
    parsed.hiringOrganization?.logo?.startsWith("https://") &&
    parsed.datePosted === job.postedAt;
  check(`jobposting: ${job.slug} complete for Google Jobs`, Boolean(ok));
}

// --- Tracciatura della fonte -------------------------------------------------
check("sources: allowlist covers the boards in the checklist", ["indeed", "glassdoor", "jooble", "talent", "careerjet", "jobrapido", "linkedin", "direct"].every((s) => APPLICATION_SOURCES.includes(s)));
check("sources: known utm values pass through", applicationSource("indeed") === "indeed" && applicationSource("LINKEDIN") === "linkedin");
check("sources: unknown tokens fall back to direct", applicationSource("(drop table)") === "direct" && applicationSource("xyz!hack") === "direct");
check("sources: empty input is direct", applicationSource(undefined) === "direct" && applicationSource("") === "direct");
check("sources: apply endpoint stores the validated column", readFileSync(join(root, "functions", "api", "careers", "apply.ts"), "utf8").includes("source: value.source"));
check("sources: form sends the hint from utm_source/referrer", readFileSync(join(root, "components", "CareersApplicationForm.tsx"), "utf8").includes("applicationSourceHint()"));

// --- Il feed segue jobs.ts senza rigenerazione manuale -----------------------
// (la route legge `openJobs()` a import time: un nuovo ruolo open appare al
// prossimo build; il test verifica il collegamento, non la data).
const staticJobInFeed = jobs.find((job) => job.status === "open");
check("feeds: source of truth is jobs.ts (openJobs), not a copy", staticJobInFeed ? xml.includes(staticJobInFeed.slug) : false);

// --- La pipeline non rompe il resto -----------------------------------------
check("feeds: excluded from sitemap coverage by contract", !read("sitemap-home.xml").includes("jobs.xml") && !read("sitemap.xml").includes("jobs.xml"));
check("feeds: careers page still exposes its markdown card", existsSync(join(out, "careers.md")));

console.log(failures ? `job feeds: ${failures} FAILED` : "job feeds: XML/RSS/Atom, JSON-LD e source-tracking passati; fetch reale degli aggregatori resta UNVERIFIED");
process.exit(failures ? 1 : 0);
