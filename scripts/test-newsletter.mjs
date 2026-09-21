import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const read = (file) => readFileSync(join(root, file), "utf8");
const component = read("components/NewsletterSection.tsx");
const endpoint = read("functions/api/subscribe.ts");

assert.match(component, /Every Sunday I send one email: what I shipped, what broke, what I decided and why\./);
assert.match(component, /No spam, no growth hacks\. Just the log\./);
assert.match(component, /placeholder="your@email\.com"/);
assert.match(component, /name="company_website"/);
assert.match(component, /aria-live="polite"/);
assert.match(component, /localStorage\.getItem\(SUBSCRIBED_KEY\)/);
assert.match(component, /localStorage\.setItem\(SUBSCRIBED_KEY, "1"\)/);
assert.doesNotMatch(component, />Sundays<\/p>/);
assert.match(component, /Subscribing\.\.\./);
assert.match(component, /Check your inbox/);
assert.match(component, /You're already on the list/);
assert.match(component, /href="\/privacy\/"/);

assert.match(endpoint, /api\.buttondown\.email\/v1\/subscribers/);
assert.match(endpoint, /Authorization: `Token \$\{env\.BUTTONDOWN_API_KEY\}`/);
assert.match(endpoint, /pending_confirmation|subscribers/);
assert.match(endpoint, /status === 409/);
assert.match(endpoint, /MAX_REQUESTS = 3/);
assert.match(endpoint, /RATE_LIMIT/);
assert.match(endpoint, /rl:sub:/);
assert.match(endpoint, /Retry-After/);
assert.match(endpoint, /company_website/);
assert.match(endpoint, /source: mattiaciuni\.it/);
assert.doesNotMatch(endpoint, /console\.log\([^)]*email/);

const out = join(root, "out");
const pages = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith("_")) walk(file);
    else if (entry.name === "index.html") pages.push(file);
  }
}
walk(out);
assert.ok(pages.length >= 9, "expected the exported site pages");
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const newsletter = html.indexOf("newsletter-title");
  const footer = html.indexOf("© 2026 Mattia Ciuni");
  assert.ok(newsletter >= 0, `${page} has no Sundays section`);
  assert.ok(footer >= 0 && newsletter < footer, `${page} does not place Sundays before footer`);
}

console.log(`newsletter: ${pages.length} pages contain Sundays before the footer`);
console.log("newsletter: offline contract checks passed (Buttondown delivery, email receipt, DNS/KV configuration are UNVERIFIED)");
