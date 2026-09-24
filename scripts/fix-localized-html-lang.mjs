import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "out");
// Keep this list in sync with `lib/i18n.ts`; this postbuild step is plain Node.
const locales = new Set(["en", "it", "fr", "es", "de"]);

if (!existsSync(out)) {
  console.error("localized HTML language: out/ is missing; run this after next build");
  process.exit(1);
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) walk(file, files);
    else if (entry.name.endsWith(".html")) files.push(file);
  }
  return files;
}

function localeFor(file) {
  const path = relative(out, file).split(sep).join("/");
  const match = path.match(/^([a-z]{2})(?:\/|$)/);
  return match && locales.has(match[1]) ? match[1] : null;
}

function withLanguage(html, locale) {
  const openingTag = html.match(/<html\b[^>]*>/i)?.[0];
  if (!openingTag) return html;

  const langAttribute = /(\s)lang\s*=\s*(["'])[^"']*\2/i;
  const updatedTag = langAttribute.test(openingTag)
    ? openingTag.replace(langAttribute, `$1lang="${locale}"`)
    : openingTag.replace(/^<html\b/i, `<html lang="${locale}"`);

  return updatedTag === openingTag ? html : html.replace(openingTag, updatedTag);
}

let changed = 0;
for (const file of walk(out)) {
  const locale = localeFor(file);
  if (!locale) continue;
  const html = readFileSync(file, "utf8");
  const updated = withLanguage(html, locale);
  if (updated !== html) {
    writeFileSync(file, updated);
    changed += 1;
  }
}

console.log(`localized HTML language: updated ${changed} exported pages`);
