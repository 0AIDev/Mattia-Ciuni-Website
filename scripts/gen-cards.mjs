// Card For AI: per ogni pagina genera una card markdown concisa,
// alla stessa path della pagina con estensione .md
// (es. /thoughts/money-layer-for-ai-agents.md).
// Gira in postbuild (vedi package.json): legge il markup gia esportato in out/,
// quindi titolo, descrizione e canonical sono sempre quelli reali.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname, posix } from "node:path";
import { fileURLToPath } from "node:url";

const baseDir = dirname(fileURLToPath(import.meta.url));
const outDir = join(baseDir, "..", "out");
const pubDir = join(baseDir, "..", "public");

if (!existsSync(outDir)) {
  console.log("cards: out/ non presente (build non ancora eseguito) - nessuna card generata");
  process.exit(0);
}

// le card sono artefatti derivati: elimina le precedenti (out e public) prima di rigenerare
function purgeMd(dir) {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "_next") purgeMd(p);
    } else if (e.name.endsWith(".md") && e.name !== "auth.md") rmSync(p);
  }
}
purgeMd(outDir);
purgeMd(pubDir);

// Le pagine dell'export sono `index.html` dentro la loro cartella (`trailingSlash:
// true` in next.config.mjs, che è quello che rende `/thoughts/<slug>/` l'indirizzo
// servito da Pages): da `thoughts/<slug>/index.html` si torna a `thoughts/<slug>`.
function listPages(dir, rel = "", acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) listPages(join(dir, e.name), rel + e.name + "/", acc);
    else if (e.name.endsWith(".html")) acc.push({ file: join(dir, e.name), rel: rel + e.name });
  }
  return acc;
}

// `thoughts/<slug>/index.html` → `thoughts/<slug>`; `index.html` → `` (la home).
// Le pagine di servizio (`404`, `_not-found`) non hanno una card: parlare della
// pagina di errore a un agente è rumore, e la card vivrebbe come `404.html.md`.
function pagePathOf(rel) {
  return rel.replace(/\/?index\.html$/, "").replace(/\.html$/, "");
}

function clean(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2019;/g, "\u2019")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function parse(html) {
  const grab = (re) => {
    const m = html.match(re);
    return m ? clean(m[1]) : "";
  };
  const t = html.match(/property="article:published_time" content="([^"]+)"/);
  return {
    title: grab(/<title>([\s\S]*?)<\/title>/),
    description: grab(/name="description" content="([^"]*)"/),
    url: grab(/rel="canonical" href="([^"]+)"/).replace(/\/$/, ""),
    published: t ? t[1].slice(0, 10) : "",
    html,
  };
}

function markdownArticle(html) {
  const article =
    html.match(/<div\b[^>]*data-article-content[^>]*>([\s\S]*?)<\/div>\s*<\/article>/i)?.[1] ||
    html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
    "";
  let text = article
    .replace(/<button\b[\s\S]*?<\/button>/gi, "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<pre\b[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_, code) => `\n\n\`\`\`\n${clean(code)}\n\`\`\`\n\n`)
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, value) => `\n\n${"#".repeat(Number(level))} ${value}\n\n`)
    .replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, value) => `\n\n> ${value}\n\n`)
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, value) => `\n- ${value}`)
    .replace(/<\/?(?:ul|ol)\b[^>]*>/gi, "\n")
    .replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, value) => `[${value}](${href})`)
    .replace(/<strong\b[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<em\b[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p\b[^>]*>/gi, "\n\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");

  return clean(text)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const pages = listPages(outDir)
  .filter(({ rel }) => !["404", "_not-found"].includes(pagePathOf(rel)))
  .map(({ file, rel }) => {
    const pagePath = pagePathOf(rel);
    const segments = pagePath ? pagePath.split("/") : [];
    let type;
    if (!pagePath) type = "Home";
    else if (pagePath === "thoughts") type = "Thoughts index";
    else if (pagePath === "notes") type = "Notes index";
    else if (pagePath === "feedback") type = "Feedback index";
    else if (segments[0] === "thoughts") type = "Blog post";
    else if (segments[0] === "notes") type = "Note";
    else if (segments[0] === "feedback") type = "Feedback post";
    else type = "Page";
    return { pagePath, segments, type, meta: parse(readFileSync(file, "utf8")) };
  });

const byPath = new Map(pages.map((p) => [p.pagePath, p]));
const byKind = (kind) =>
  [...byPath.values()]
    .filter((p) => p.segments[0] === kind && p.segments.length === 2)
    .sort((a, b) =>
      a.meta.published === b.meta.published
        ? a.meta.title.localeCompare(b.meta.title)
        : a.meta.published < b.meta.published
          ? 1
          : -1
    );
const kinds = { thoughts: "Thoughts", notes: "Notes", feedback: "Feedback" };
const relLink = (from, to) =>
  posix.relative(posix.dirname(from + ".md"), (to || "index") + ".md");

function cardBody(p) {
  const lines = ["# " + p.meta.title];
  if (p.meta.description) lines.push("", "> " + p.meta.description);
  lines.push("", "- URL: " + p.meta.url, "- Type: " + p.type);
  if (p.meta.published) lines.push("- Published: " + p.meta.published);
  if (p.type === "Blog post" || p.type === "Note" || p.type === "Feedback post") {
    const article = markdownArticle(p.meta.html);
    if (article) lines.push("", "## Full article", "", article);
  }
  return lines.join("\n");
}

let n = 0;
for (const p of pages) {
  const extra = [];
  const itemLine = (q) =>
    `- [${q.meta.title}](${relLink(p.pagePath, q.pagePath)})` +
    (q.meta.description ? " - " + q.meta.description : "");

  if (p.type === "Home") {
    extra.push("## Cards");
    for (const kind of Object.keys(kinds)) {
      extra.push(`- [${kinds[kind]} index](${relLink("", kind)})`);
      for (const q of byKind(kind)) extra.push("  " + itemLine(q));
    }
  } else if (p.segments.length === 1) {
    const kind = p.segments[0];
    if (kinds[kind]) {
      extra.push("## " + kinds[kind]);
      for (const q of byKind(kind)) extra.push(itemLine(q));
    }
    extra.push("- [Home](" + relLink(p.pagePath, "") + ")");
  } else if (p.segments.length === 2) {
    extra.push(
      "- [" + kinds[p.segments[0]] + " index](" + relLink(p.pagePath, p.segments[0]) + ")",
      "- [Home](" + relLink(p.pagePath, "") + ")"
    );
  }

  const md = cardBody(p) + (extra.length ? "\n\n" + extra.join("\n") : "") + "\n";
  const file = p.pagePath ? p.pagePath + ".md" : "index.md";
  // scritta sia in out (production, generata in postbuild) sia in public
  // (così `next dev` le serve: /index.md, /thoughts/...md)
  for (const dir of [outDir, pubDir]) {
    const dest = join(dir, ...file.split("/"));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, md, "utf8");
  }
  n++;
}

console.log("cards: " + n + " .md generated in out/ + public/");