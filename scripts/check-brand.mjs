// Contract: no stale identity claim and no wrong brand host in any tracked
// source file.
//
// This guard has outlived a rename before, and the Noesia -> Know Computer
// rename changed what "stale" means. The earlier renames retired a *name*:
// every occurrence was a miss, which is why the Ceilya pass left "Payle" in a
// committed log and nothing noticed until a gate existed to find it. This
// rename retires a *claim*, not the history. The articles, notes, feedback
// exchanges and archived audits must keep saying Payle, Ceilya and Noesia,
// because that is what actually happened: a personal site whose past has been
// scrubbed to match its present is worth nothing, and rewriting it would be
// the real bug. What must not survive is any surface presenting one of the
// old names as Mattia's current company, current role or current contact
// address. The symptom of a miss is invisible in review, because the build
// stays green and every page still renders: a site whose prose says one name
// while its title tag, its JSON-LD, its OG image and its RAG corpus say
// another, which is exactly the split search engines and agents index on.
//
// So the sweep matches stale identity *phrases* (the `retired` list: role
// claims in every language the site ships, keyword strings, the old contact
// address) rather than bare names; the current identity is verified against
// lib/site.ts; and every host carrying a brand token must be the host that
// brand really answers to - the current domain for Know Computer, and the one
// exact historical host for the Noesia links that belong inside preserved
// articles. Each failure reports file:line, because a failure nobody can find
// is a failure that gets suppressed.
//
// Derived files are excluded for sequencing, not for correctness: cards, RAG
// entries and agent files under public/ are rewritten from the sources below
// on every build (gen-cards, gen-rag and gen-agent-files run in postbuild), so
// in a prebuild gate they still hold the *previous* build's identity, and
// sweeping them would make the first build of any rename impossible to run -
// the gate would block the very command that fixes it. Ownership is per
// generator, not per folder: the files in public/ no generator owns (auth.md,
// webmcp.js) are tracked and this sweep still reaches them.
//
// The list of tracked files is read from git rather than assembled here,
// because a directory list is what let an earlier miss through.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

// Stale identity claims: phrases that present a former company as Mattia's
// current one. Matched case-insensitively, so one entry covers "CEO of Noesia"
// and "ceo of noesia", and the short cores cover the longer forms around them
// ("Founder & CEO at Noesia" and "&amp; CEO at Noesia" both contain
// "CEO at Noesia"). Bare mentions of the old names are history and pass:
// "Before Know, I built ... Payle, Ceilya and Noesia" is the truth, not a miss.
const retired = [
  // current-role claims, English plus the localized bios
  "CEO at Noesia",
  "CEO of Noesia",
  "CEO di Noesia",
  "CEO de Noesia",
  "CEO von Noesia",
  "CEO at Payle",
  "CEO of Payle",
  "CEO at Ceilya",
  "CEO of Ceilya",
  "Noesia founder",
  "Noesia CEO",
  "Payle founder",
  "Payle CEO",
  "Ceilya founder",
  "Ceilya CEO",
  // stale search keywords
  "Mattia Ciuni Noesia",
  // the old contact address, where m@ was Mattia's own
  "m@withnoesia.com",
  "m@usepayle.com",
  "m@ceilya.com",
];

// The brand the site answers to right now. Verified against lib/site.ts below:
// after the next rename, whoever updates `retired` and forgets this gets a hard
// failure instead of a guard that confidently checks the wrong string.
const current = { name: "Know Computer", domain: "knowcomputer.com" };
const siteConfig = "lib/site.ts";
// The panel can republish site settings, and `withSiteSettings` prefers a
// non-empty panel value over the code default. So `companyUrl` has two places it
// can be declared, and nothing aligns them on its own: a stale override left in
// site.json silently replaces the default at build time, long after anyone
// stopped looking at lib/site.ts.
const panelSettings = "content/cms/settings/site.json";

const host = current.domain.toLowerCase();

// Every host that carries a brand token must be exactly one of these. The
// current domain is the only place the current brand may live; the historical
// host is allowed verbatim because preserved articles link to it (rewriting
// those links would break the history the site promises to keep), while any
// *other* host containing the token - www., another TLD, http, a suffix trap -
// is a link that goes nowhere and a name spelled wrong.
const hostRules = [
  { token: "knowcomputer", host: "knowcomputer.com", era: "current" },
  { token: "noesia", host: "withnoesia.com", era: "historical" },
];

// Archived records quote what a page said on a given date, and the quote is the
// record: a Search Console snapshot or a generated audit cannot be updated
// without becoming a lie about the past. Masked per file and by exact literal,
// so the stale phrase is tolerated *there* and nowhere else - the same string
// in an app/ source still fails the build.
const quoted = new Map([
  ["docs/search-console.md", ["CEO at Noesia"]],
  ["docs/SEO-LIVE-AUDIT.md", ["CEO at Noesia", "CEO of Noesia"]],
]);

// The card sources are held to a stricter rule than the rest of the repo: no
// retired brand name at all, not even historical. Everywhere else a bare
// "Noesia" is history and passes, but none of these files draws history: card
// titles come from lib/posts.ts at run time and the hand-drawn masters live in
// design/*.png. A retired name in here can only be the current identity baked
// into an artifact this sweep cannot reach - a PNG has a NUL byte and is
// skipped, and the public/ cards these scripts emit are excluded as derived.
// The last miss of exactly this kind was "Founder & CEO at Payle" drawn into
// the home card, green build, every share carrying it, visible only to an OCR
// pass run by hand. This rule makes the miss impossible to commit instead of
// slow to notice.
const cardSources = new Map([
  ["scripts/og.ps1", "the card script"],
  ["scripts/og-media.ps1", "the media card script"],
  ["scripts/gen-cards.mjs", "the markdown card generator"],
  ["design/README.md", "the design docs"],
  ["design/sfondo.svg", "a design source"],
  ["design/Vector.svg", "a design source"],
]);
const retiredName = /\b(?:Noesia|Payle|Ceilya|withnoesia|usepayle)\b/gi;

// Files under public/ that a generator owns, listed by the generator's own
// rules (see the header): gen-cards rewrites every public/**\/*.md except
// auth.md, gen-rag owns public/rag/, gen-agent-files owns public/.well-known/.
// Everything else in public/ is hand-written and stays in the sweep.
const derived = (file) => {
  if (!file.startsWith("public/")) return false;
  if (file.endsWith(".md")) return file !== "public/auth.md";
  if (file.startsWith("public/rag/")) return true;
  if (file.startsWith("public/.well-known/")) return true;
  return false;
};

// The only files allowed to contain a stale identity claim. Both have to, and
// for opposite reasons: this one forbids the phrases, and test-brand.mjs uses
// them as the input that proves the gate still rejects them. Exempting them
// does not weaken the check, because that same test fails the gate on these
// exact strings inside an ordinary source file. Keep the list this short: a new
// entry is a place where a real miss can hide.
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

function mask(text, file) {
  let masked = text;
  for (const literal of quoted.get(file) ?? []) masked = masked.split(literal).join(" ");
  return masked;
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

function escapeRegExp(literal) {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// A dotted host, anywhere: inside a URL, inside an email address, or written
// bare in a caption or a policy string. The final label has to be alphabetic so
// version numbers and file names like 1.0.0 or gen-cards.mjs do not match.
const HOST = /[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const URL_IN_TEXT = /https?:\/\/[^\s"'`)<> \]]+/gi;

/**
 * Checks one declared brand URL. The host is the part that matters: a wrong
 * host is a dead link, and a non-https one leaks a referral on every click.
 * Port, credentials and "www." all change the host, so one comparison covers
 * them, and `URL` lowercases for us, so a stray capital cannot hide a mismatch.
 */
function checkDeclaration(where, raw) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    failures.add(`${where}: "${raw}" is not a URL`);
    return;
  }
  if (parsed.protocol !== "https:") {
    failures.add(`${where}: uses ${parsed.protocol}// where https is required ("${raw}")`);
  }
  if (parsed.host.toLowerCase() !== host) {
    failures.add(`${where}: points to "${parsed.host}" but the declared current host is "${host}"`);
  }
  if (parsed.username || parsed.password) {
    failures.add(`${where}: carries credentials in the URL ("${raw}")`);
  }
}

// Un Set, non un array: un file che non si puo' leggere viene segnalato sia
// dalla scansione sia dal controllo del brand corrente, e la riga deve
// comparire una volta sola.
const failures = new Set();
let scanned = 0;
let skipped = 0;
let derivedSkipped = 0;

for (const file of trackedFiles()) {
  if (owners.has(file)) continue;
  if (derived(file)) {
    derivedSkipped += 1;
    continue;
  }
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
  const masked = mask(text, file);

  for (const phrase of retired) {
    const pattern = new RegExp(escapeRegExp(phrase), "gi");
    for (const match of masked.matchAll(pattern)) {
      failures.add(`${file}:${lineOf(masked, match.index)} still claims the stale identity "${phrase}"`);
    }
  }

  // Stricter rule for the sources that draw identity into artifacts the sweep
  // never sees (see `cardSources`): the bare retired name fails here, with no
  // phrase and no current-identity context required.
  const cardLabel = cardSources.get(file);
  if (cardLabel) {
    for (const match of masked.matchAll(retiredName)) {
      failures.add(
        `${file}:${lineOf(masked, match.index)}: ${cardLabel} must not name the retired brand "${match[0]}" ` +
          `(card sources emit artifacts this sweep skips, so the name would reach every share uncaught)`,
      );
    }
  }

  // A brand host appears in dozens of places: the link on every home page, the
  // careers apply button, the contact address, the RAG policy string, the
  // system prompt in api/chat.ts. "www." in front of it, a different TLD,
  // http instead of https: each of those is still a well-formed URL, so
  // nothing else notices, and the page renders a link that goes nowhere.
  for (const match of masked.matchAll(HOST)) {
    const found = match[0].toLowerCase();
    const rule = hostRules.find((r) => found.includes(r.token));
    if (!rule) continue;
    if (found !== rule.host) {
      failures.add(`${file}:${lineOf(masked, match.index)} names the host "${match[0]}" but the ${rule.era} brand host is "${rule.host}"`);
    }
  }

  for (const match of masked.matchAll(URL_IN_TEXT)) {
    let parsed;
    try {
      parsed = new URL(match[0]);
    } catch {
      continue;
    }
    const found = parsed.host.toLowerCase();
    const rule = hostRules.find((r) => found.includes(r.token));
    if (!rule) continue;
    if (parsed.protocol !== "https:") {
      failures.add(`${file}:${lineOf(masked, match.index)} links to the brand over ${parsed.protocol}// instead of https`);
    }
    if (parsed.username || parsed.password) {
      failures.add(`${file}:${lineOf(masked, match.index)} puts credentials in a brand URL`);
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
  // The declaration itself, not just its presence. A rename that updates
  // `current.domain` but leaves companyUrl pointing at the old domain would
  // otherwise pass: the phrase sweep catches the old *role claim*, but only a
  // declared-host check catches a wrong link target.
  // Accetta sia `companyUrl: "..."` (come e' oggi nel siteDefaults) sia
  // `companyUrl = "..."`: il contratto e' che il valore dichiarato sia quello, non
  // che resti scritto con un certo segno.
  const declared = siteSource.match(/companyUrl\s*[:=]\s*"([^"]+)"/);
  if (!declared) {
    failures.add(`${siteConfig}: declares no companyUrl, so the product link has no source of truth`);
  } else {
    checkDeclaration(`${siteConfig} companyUrl`, declared[1]);
  }
}

// The panel's override wins over the code default whenever it is a non-empty
// string, so it is checked with the same rule. Absent or empty means "keep the
// default" and is not a failure.
if (existsSync(join(root, panelSettings))) {
  let settings = null;
  try {
    settings = JSON.parse(readFileSync(join(root, panelSettings), "utf8"));
  } catch (error) {
    failures.add(`${panelSettings}: could not be parsed (${error.message})`);
  }
  const override = settings && typeof settings.companyUrl === "string" ? settings.companyUrl.trim() : "";
  if (override) checkDeclaration(`${panelSettings} companyUrl`, override);
}

if (failures.size) {
  console.error(`FAIL brand: ${failures.size} problem(s) with the brand tokens`);
  for (const failure of failures) console.error(`  ${failure}`);
  console.error(`  Brand hosts are declared once, in \`hostRules\`, and every host carrying a brand token must match one of them.`);
  console.error("  A rebrand adds its stale phrases to `retired`, its hosts to `hostRules` and its new name to `current` in scripts/check-brand.mjs.");
  process.exit(1);
}

console.log(
  `PASS brand: no stale identity claim or wrong brand host in ${scanned} tracked text files ` +
    `(${skipped} binary skipped, ${derivedSkipped} derived skipped, ${owners.size} owner file(s) exempt); ` +
    `every brand host is ${host}, declared in ${siteConfig}`,
);
