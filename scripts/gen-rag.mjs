import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "out");
const publicDir = join(root, "public");

if (!existsSync(outDir)) {
  console.log("rag: out/ non presente (build non ancora eseguito)");
  process.exit(0);
}

function files(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) files(file, acc);
    else if (entry.name.endsWith(".md") && entry.name !== "auth.md") acc.push(file);
  }
  return acc;
}

function clean(markdown) {
  return markdown
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*>]\s+/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const entries = files(outDir)
  .map((file) => {
    const relative = file.slice(outDir.length + 1).replaceAll("\\", "/");
    const markdown = readFileSync(file, "utf8");
    const title = (markdown.match(/^#\s+(.+)$/m) || [])[1] || relative;
    const description = (markdown.match(/^>\s+(.+)$/m) || [])[1] || "";
    const content = clean(markdown).slice(0, 9000);
    const url = relative === "index.md" ? "/" : `/${relative.replace(/\.md$/, "")}/`;
    const type = relative.startsWith("thoughts/") ? "Thought" : relative.startsWith("notes/") ? "Note" : "Site page";
    return { title, description, content, url, type };
  })
  .filter((entry) => entry.content.length > 20);

const payload = {
  version: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  policy: "Answer only from this site and usepayle.com. Say when the answer is not in the index.",
  entries,
};

for (const dir of [outDir, publicDir]) {
  const destination = join(dir, "rag", "index.json");
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, JSON.stringify(payload), "utf8");
}

console.log(`rag: ${entries.length} searchable pages generated in out/ + public/`);
