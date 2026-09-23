// Il contratto del tracciamento: quali eventi esistono, con quali nomi, e le
// promesse che non devono rompersi in silenzio.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const read = (file) => readFileSync(join(root, file), "utf8");

const EVENTI = [
  "page_view", "page_leave", "traffic_source", "navigation_click", "cta_click", "outbound_click", "social_click", "email_click", "copy_link", "scroll_depth", "form_start", "form_field_interaction", "form_submit", "form_success", "form_error", "newsletter_signup", "newsletter_already_subscribed", "newsletter_error", "feedback_open", "feedback_submitted", "feedback_error", "carousel_step", "media_play", "media_progress", "media_complete",
  "analytics_consent_choice", "language_suggestion_ready", "language_suggestion_dismiss", "language_suggestion_switch", "language_switch", "role_search_open", "role_search_query", "role_filter_change", "role_select", "application_view", "application_close", "application_step_view", "application_step_change", "application_custom_answer", "application_cv_selected", "application_cv_removed", "toc_click", "toc_toggle",
];

const helper = read("lib/analytics.ts");
const analytics = read("components/GoogleAnalytics.tsx");
const umami = read("components/UmamiAnalytics.tsx");
const layout = read("app/layout.tsx");
const deferred = read("components/DeferredAnalytics.tsx");
const newsletter = read("components/NewsletterSection.tsx");
const feedback = read("components/FeedbackForm.tsx");
const carousel = read("components/NotesCarousel.tsx");
const media = read("components/MediaPlayers.tsx");
const copyLink = read("components/CopyPostLink.tsx");
const copyEmail = read("components/CopyEmail.tsx");
const componentSources = [
  newsletter, feedback, carousel, media, copyLink, copyEmail,
  read("components/LanguageSuggestion.tsx"), read("components/LanguageSwitcher.tsx"), read("components/CareersRoleSearch.tsx"), read("components/CareersApplicationModal.tsx"), read("components/CareersApplicationForm.tsx"), read("components/TableOfContents.tsx"),
];

assert.match(helper, /window\.gtag\?\.\("event", event, forUmami\(enrichedParams\)\)/);
assert.match(helper, /typeof window === "undefined"/);
for (const [name, source] of Object.entries({ newsletter, feedback, carousel, media })) assert.doesNotMatch(source, /window\.gtag\?\.\(/, `${name} deve usare track(), non window.gtag`);
for (const file of ["out/index.html", "out/link/index.html"]) {
  if (!existsSync(join(root, file))) continue;
  const html = read(file);
  assert.doesNotMatch(html, /googletagmanager/, `${file} non deve contenere il tag prima del consenso`);
  assert.doesNotMatch(html, /data-ga=/, `${file} non deve montare lo script di Analytics nell'export`);
}
assert.match(deferred, /pathname\?\.startsWith\("\/admin"\)/);
assert.match(layout, /<UmamiAnalytics \/>/);
assert.match(umami, /cloud\.umami\.is\/script\.js/);
assert.match(umami, /data-website-id="[0-9a-f-]{36}"/);
assert.match(umami, /pathname\?\.startsWith\("\/admin"\)/);
assert.doesNotMatch(umami, /useSyncExternalStore|"declined"/);
assert.match(helper, /window\.umami\?\.track\(event, cleanParams\)/);
assert.match(helper, /if \(event === "page_view"\) return;/);
assert.match(helper, /forUmami/);
assert.match(helper, /window\.dataLayer\.push\(\{ event/);
assert.match(helper, /currentAttribution/);
assert.match(analytics, /attributionParams/);
assert.match(analytics, /document\.addEventListener\("click", onClick/);
assert.match(helper, /COLLECT_ENDPOINT = "\/api\/collect"/);
assert.match(helper, /function pagesCollectorAvailable\(\)/);
assert.match(helper, /window\.location\.port === "8787"/);
assert.match(helper, /enqueueCollect\(event, enrichedParams\)/);
assert.match(helper, /navigator\.sendBeacon\(COLLECT_ENDPOINT/);
assert.match(helper, /collectQueue = \[\.\.\.batch, \.\.\.collectQueue\]/);
assert.match(helper, /response\.status >= 500 \|\| response\.status === 429/);
assert.ok(helper.indexOf("enqueueCollect(event, enrichedParams);") < helper.indexOf('if (event === "page_view") return;'), "la pageview deve entrare nella copia prima del ritorno per Umami");
assert.match(analytics, /flushCollect\(true\)/);
assert.match(analytics, /usePathname/);
assert.match(analytics, /requestAnimationFrame/);
assert.match(analytics, /content_kind: contentKindOf\(current\)/);
assert.match(analytics, /const marks = \[25, 50, 75, 100\]/);
assert.match(analytics, /if \(scrollable <= 4\) return;/);
assert.match(analytics, /from_path/);
assert.match(analytics, /markPageEnter\(\)/);
assert.match(analytics, /pageLeavePayload\(/);
assert.match(analytics, /noteNextPage\(/);
assert.match(helper, /session_seconds/);
assert.match(helper, /dwell_seconds/);
assert.match(helper, /max_scroll_percent/);
assert.match(helper, /next_page/);
assert.match(analytics, /"pagehide"/);
assert.match(analytics, /visibilitychange/);

const found = new Set();
for (const source of [analytics, ...componentSources]) for (const match of source.matchAll(/\btrack(?:Event)?\(\s*"([a-z_]+)"/g)) found.add(match[1]);
for (const name of found) assert.ok(EVENTI.includes(name), `evento non registrato in test-analytics.mjs: ${name}`);
for (const name of EVENTI) assert.ok(found.has(name), `evento dichiarato ma mai usato: ${name}`);
assert.match(helper, /window\.dataLayer\.push\(\{ event/);
assert.match(helper, /currentAttribution/);
assert.match(analytics, /attributionParams/);
assert.match(analytics, /document\.addEventListener\("click", onClick/);
assert.match(media, /track\("media_progress"/);

const pages = readdirSync(join(root, "out"), { withFileTypes: true }).filter((e) => e.isDirectory()).length;
console.log(`analytics: ${EVENTI.length} eventi, un solo punto di uscita verso GA, Umami e la copia nel database, nessun tag GA prima del consenso (${pages} cartelle nell'export)`);
console.log("analytics: controlli offline passati; invio reale a GA4, Umami e /api/collect resta UNVERIFIED in locale");
