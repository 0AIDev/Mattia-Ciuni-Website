// Contract: no retired brand name survives in a tracked source file.
//
// Two rebrands in a row turned this into a build gate rather than a checklist.
// A hand-applied rename only reaches the directories someone remembered to
// sweep: the Ceilya pass never looked at verify-final.out, a log committed at
// the repo root, so "Payle" stayed in a tracked file until this check existed
// to find it. A miss like that is invisible in review, because the build stays
// green and every page still renders. The only symptom is a site whose prose
// says one name while its title tag, its Organization JSON-LD, its OG image and
// its RAG corpus say another, which is exactly the split search engines and
// agents index on.
//
// So: every rename appends its token to `retired` below, and nothing else has
// to remember to run the sweep. The list of tracked files is read from git
// rather than assembled here, because a directory list is what let the last
// miss through.
//
// public/ is not excluded by hand for correctness reasons but for sequencing
// ones: its cards, agent files and RAG entries are derived from the sources
// below and rewritten on every build, so in a prebuild gate they still hold
// the *previous* brand and would fail every rename on its first run. The two
// files in public/ that no generator owns, auth.md and webmcp.js, are tracked,
// so this sweep reaches them without special-casing.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const root = process.cwd();

// Every brand name this site has shipped under. Matched case-insensitively, so
// one entry covers the capitalized prose form, the lowercase domain form and
// the SCREAMING one, including compounds like ceilya.com and ceilya-agent.
const retired = ["payle", "ceilya"];

// The brand the site answers to right now. Verified against lib/site.ts below:
// after the next rename, whoever updates `retired` and forgets this gets a hard
// failure instead of a guard that confidently checks the wrong string.
const current = { name: "Noesia", domain: "withnoesia.com" };
const siteConfig = "lib/site.ts";

// Strings that legitimately contain a retired name. Masked out of each file
// before the search, so an entry has to be the exact literal rather than a
// whole file: exempting a file would hide every future miss inside it.
const allowlist = [
  // The NDA gate points at a real signed document hosted on the retired
  // brand's Railway app. This is a live URL, not copy: renaming the host
  // breaks the gate for the only visitors who are trying to read the
  // document. Retiring "payle" as a brand must not retire this string.
  "payle.up.railway.app",
];

// The only files allowed to name a retired brand. Both have to, and for
// opposite reasons: this one forbids the names, and test-brand.mjs uses them as
// the input that proves the gate still rejects them. Exempting them does not
// weaken the check, because that same test fails the gate on these exact
// strings inside an ordinary source file. Keep the list this short: a new entry
// is a place where a real miss can hide.
const owners = new Set(["scripts/check-brand.mjs", "scripts/test-brand.mjs"]);

function trackedFiles() {
  try {
    const out = execFileSync("git", ["ls-files", "-z"], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
    return out.toString("utf8").split("\0").filter(Boolean);
  } catch (error) {
    console.error("FAIL brand: cannot list tracked files, so no guarantee can be made.");
    console.error(`  git ls-files failed in ${root}: ${error.message}`);
    console.error("  This check reads the repo's own file list on purpose; without it it cannot run.");
    process.exit(1);
  }
}

/**
 * Binary files are skipped rather than decoded. A rebrand script that rewrites
 * files in place will happily corrupt a PNG signature or a TTF, and the build
 * then fails far away from the cause. A NUL byte is the usual tell.
 */
function readText(path) {
  const buffer = readFileSync(path);
  if (buffer.includes(0)) return null;
  return buffer.toString("utf8");
}

function mask(text) {
  let masked = text;
  for (const literal of allowlist) masked = masked.split(literal).join(" ");
  return masked;
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

// Un Set, non un array: un file che non si puo' leggere viene segnalato sia
// dalla scansione sia dal controllo del brand corrente, e la riga deve
// comparire una volta sola.
const failures = new Set();
let scanned = 0;
let skipped = 0;

for (const file of trackedFiles()) {
  if (owners.has(file)) continue;
  let text;
  try {
    text = readText(file);
  } catch (error) {
    failures.add(`${file}: could not be read (${error.message})`);
    continue;
  }
  if (text === null) {
    skipped += 1;
    continue;
  }
  scanned += 1;

  // Masking preserves newline positions, so line numbers stay accurate even
  // though the masked text is shorter than the original.
  const masked = mask(text);
  for (const brand of retired) {
    const pattern = new RegExp(brand, "gi");
    for (const match of masked.matchAll(pattern)) {
      failures.add(`${file}:${lineOf(masked, match.index)} still says the retired brand "${brand}"`);
    }
  }
}

// The guard is only as good as its idea of the current brand. If lib/site.ts
// stops naming it, either the rename missed the site config or this file was
// not updated, and both must fail the build rather than pass silently.
let siteSource = null;
let siteRead = true;
try {
  siteSource = readText(siteConfig);
} catch (error) {
  siteRead = false;
  failures.add(`${siteConfig}: could not be read (${error.message})`);
}
if (siteRead && siteSource === null) {
  failures.add(`${siteConfig}: unreadable as text, cannot confirm the current brand`);
} else if (siteRead) {
  for (const [field, value] of Object.entries(current)) {
    if (!siteSource.includes(value)) {
      failures.add(`${siteConfig}: no longer contains the current ${field} "${value}" - the brand guard is stale`);
    }
  }
}

if (failures.size) {
  console.error(`FAIL brand: ${failures.size} problem(s) with the brand tokens`);
  for (const failure of failures) console.error(`  ${failure}`);
  console.error("  A rebrand adds its retired name to `retired` and its new name to `current` in scripts/check-brand.mjs.");
  process.exit(1);
}

const allowNote = allowlist.length ? `, ${allowlist.length} allowlisted literal(s)` : "";
console.log(`PASS brand: no retired name in ${scanned} tracked text files (${skipped} binary skipped, ${owners.size} owner file(s) exempt${allowNote}); current brand is ${current.name} (${current.domain})`);