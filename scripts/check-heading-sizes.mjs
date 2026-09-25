// Contract: every heading in the public site declares an explicit size.
//
// Tailwind's preflight sets `h1..h6 { font-size: inherit; font-weight: inherit }`,
// so a heading without a `text-*` utility renders at body size. That is not a
// stylistic preference, it is a bug: an `h2` at 16px next to 30px siblings
// reads as broken, and it is invisible in review because the markup looks right.
//
// This check is a build gate on purpose: it is cheaper to fail CI than to
// notice a shrunken section title from a screenshot.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const root = process.cwd();
const roots = ["app", "components"];
const extensions = new Set([".tsx"]);

// Headings that intentionally inherit their size from a parent component or
// are inside a shell that already sets a size. Keep this list short: every
// entry is a decision, not a loophole.
const allowed = [
  // The admin workspace is a private tool, not a public article; its headings
  // are laid out on a single scale of its own.
  "components/AdminWorkspace.tsx",
  "components/AdminContentEditor.tsx",
];

const headingPattern = /<(h[1-6])\b([^>]*)>/g;
// Negative lookahead instead of a trailing `\b`: an arbitrary value ends with
// `]` (non-word), so `\b` would reject `text-[28px]`.
const sizePattern = /\btext-(?:xs|sm|base|lg|xl|\d?xl|\[[^\]]+\])(?![a-zA-Z0-9-])/;

function* walk(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      if (entry === "ui") continue;
      yield* walk(path);
    } else if (extensions.has(extname(path))) {
      yield path;
    }
  }
}

const failures = [];
let checked = 0;

for (const directory of roots) {
  for (const file of walk(join(root, directory))) {
    const relative = file.slice(root.length + 1).split("\\").join("/");
    if (allowed.includes(relative)) continue;
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(headingPattern)) {
      checked += 1;
      if (!sizePattern.test(match[2])) {
        const line = source.slice(0, match.index).split("\n").length;
        failures.push(`${relative}:${line} <${match[1]}> has no text-* size`);
      }
    }
  }
}

if (failures.length) {
  console.error(`FAIL heading sizes: ${failures.length} of ${checked} headings have no explicit size`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(`PASS heading sizes: ${checked} headings declare an explicit size`);
