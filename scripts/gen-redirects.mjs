// Unisce le regole `_redirects` scritte in codice con quelle pubblicate dal
// pannello, e scrive il risultato in `out/_redirects`.
//
// Il file di partenza e' `public/_redirects`, che resta l'unico posto dove
// mettere una regola scritta a mano. Qui non lo si modifica: lo si estende, e
// tutto quello che il pannello ha pubblicato viene dopo, marcato, cosi' due
// copie del file non si pestano i piedi e un rollback del CMS si vede togliendo
// un blocco.
//
// Attenzione al limite di Cloudflare: oltre le prime 100 regole vengono
// ignorate **senza avviso**. Il controllo qui e' quello che lo rende visibile
// prima del deploy, non dopo.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const CLOUDFLARE_REDIRECT_LIMIT = 100;

function countRules(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#")).length;
}

const destination = join(root, "out", "_redirects");
if (!existsSync(destination)) {
  console.log("redirects: out/_redirects not found, skipping (run after next build)");
  process.exit(0);
}

const base = readFileSync(destination, "utf8").replace(/\n*$/, "\n");

// `lib/cms-redirects.ts` e' TypeScript: si riusa il modulo gia' compilato dal
// generatore di copy quando esiste, altrimenti si rilegge il JSON direttamente.
// Cosi' questo script resta un file Node puro, senza dipendere da tsx.
const cmsDirectory = join(root, "content", "cms", "redirect");
let rules = [];
if (existsSync(cmsDirectory)) {
  const { readdirSync } = await import("node:fs");
  for (const file of readdirSync(cmsDirectory).filter((name) => name.endsWith(".json"))) {
    try {
      const parsed = JSON.parse(readFileSync(join(cmsDirectory, file), "utf8"));
      const from = String(parsed.from || "");
      const to = String(parsed.to || "");
      if (parsed.enabled === false) continue;
      if (!from.startsWith("/") || from.startsWith("//") || from.includes(" ")) continue;
      if (!to.startsWith("/") && !/^https:\/\//.test(to)) continue;
      const status = [301, 302, 307, 308].includes(Number(parsed.status)) ? Number(parsed.status) : 301;
      rules.push(`${from}  ${to}  ${status}`);
    } catch (error) {
      console.warn(`redirects: skipping invalid ${file}`, error.message);
    }
  }
}

if (!rules.length) {
  console.log("redirects: no CMS rules published");
  process.exit(0);
}

const header = [
  "",
  "# --- published from the admin panel (content/cms/redirect) ---",
  "# Removed automatically when the matching CMS item is unpublished.",
  ...rules,
  "",
].join("\n");

const merged = base + header;
const total = countRules(merged);
if (total > CLOUDFLARE_REDIRECT_LIMIT) {
  console.error(
    `FAIL redirects: ${total} rules exceed Cloudflare's ${CLOUDFLARE_REDIRECT_LIMIT} limit; the ones after the limit are ignored without warning.`,
  );
  process.exit(1);
}

writeFileSync(destination, merged);
console.log(`redirects: ${rules.length} CMS rule(s) merged, ${total} total (limit ${CLOUDFLARE_REDIRECT_LIMIT})`);
