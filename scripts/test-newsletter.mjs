import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const read = (file) => readFileSync(join(root, file), "utf8");
const component = read("components/NewsletterSection.tsx");
const endpoint = read("functions/api/subscribe.ts");
const analytics = read("components/GoogleAnalytics.tsx");

assert.match(component, /Every Sunday I send one email: what I shipped, what broke, what I decided and why\./);
assert.match(component, /name="company_website"/);
assert.match(component, /aria-live="polite"/);
assert.match(component, /localStorage\.getItem\(SUBSCRIBED_KEY\)/);
assert.match(component, /localStorage\.setItem\(SUBSCRIBED_KEY, "1"\)/);
assert.match(component, /Subscribing\.\.\./);
assert.match(component, /utm_campaign/);
assert.match(component, /referrer/);
assert.match(component, /rate_limited/);

assert.match(endpoint, /api\.resend\.com\/emails/);
assert.match(endpoint, /RESEND_API_KEY/);
assert.match(endpoint, /RESEND_WELCOME_TEMPLATE_ID/);
assert.match(endpoint, /template: \{ id: env\.RESEND_WELCOME_TEMPLATE_ID/);
assert.match(endpoint, /api\.brevo\.com\/v3\/contacts/);
assert.match(endpoint, /BREVO_API_KEY/);
assert.match(endpoint, /BEEHIIV_API_KEY/);
assert.match(endpoint, /BEEHIIV_PUBLICATION_ID/);
assert.match(endpoint, /api\.beehiiv\.com\/v2\/publications/);
assert.match(endpoint, /send_welcome_email: false/);
assert.match(endpoint, /updateEnabled: true/);
assert.match(endpoint, /MAX_REQUESTS = 5/);
assert.match(endpoint, /RATE_LIMIT/);
assert.match(endpoint, /Retry-After/);
assert.match(endpoint, /SOURCE/);
assert.match(endpoint, /LANDING_PAGE/);
assert.doesNotMatch(endpoint, /console\.log\([^)]*email/);

assert.match(analytics, /G-YQS0R94ZQP/);
assert.match(analytics, /analytics_storage: "granted"/);
assert.match(analytics, /traffic_source/);
assert.match(analytics, /outbound_click/);
assert.match(analytics, /localStorage/);

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
  assert.ok(newsletter >= 0, `${page} has no newsletter section`);
  assert.ok(footer >= 0 && newsletter < footer, `${page} does not place newsletter before footer`);
}

console.log(`newsletter: ${pages.length} pages contain the newsletter before the footer`);
console.log("newsletter: offline contract checks passed (Resend/Brevo delivery, secrets, DNS, and live KV are UNVERIFIED)");
