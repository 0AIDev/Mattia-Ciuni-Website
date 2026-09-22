// Il contratto del tracciamento: quali eventi esistono, con quali nomi, e le
// promesse che non devono rompersi in silenzio.
//
//  1. Niente Google Analytics prima del consenso: nel sito esportato non deve
//     esserci nessuna traccia di googletagmanager. È ciò che la privacy policy
//     dichiara.
//  2. Umami invece è sempre in pagina: non conserva niente sul dispositivo, non
//     c'è niente da accettare, e per questo il suo script non deve sparire dietro
//     un consenso che non gli serve.
//  3. Ogni evento deve partire da `track()` di lib/analytics.ts, così la
//     diramazione verso i due strumenti è una sola e vale per tutti.
//  4. La copia nel database del sito è l'unica destinazione che riceve anche la
//     pageview, e deve partire per lotti: un evento alla volta sarebbe una
//     richiesta per riga. E deve svuotarsi all'uscita, altrimenti la fine di ogni
//     visita sparirebbe in silenzio.
//
// Gli eventi sono elencati qui sotto: aggiungerne uno senza registrarlo fa
// fallire il test, ed è voluto. Un nome di evento scritto a mano ("ctaClick",
// "newsletter-signup") vive in un report a parte e non lo vede nessuno.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const read = (file) => readFileSync(join(root, file), "utf8");

const EVENTI = [
  "page_view",
  "page_leave",
  "traffic_source",
  "navigation_click",
  "cta_click",
  "outbound_click",
  "social_click",
  "email_click",
  "copy_link",
  "scroll_depth",
  "form_start",
  "form_field_interaction",
  "form_submit",
  "form_success",
  "form_error",
  "newsletter_signup",
  "newsletter_already_subscribed",
  "newsletter_error",
  "feedback_open",
  "feedback_submitted",
  "feedback_error",
  "carousel_step",
  "media_play",
  "media_progress",
  "media_complete",
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

// La guardia: senza consenso `window.gtag` non esiste e l'evento si scarta da
// solo. Nessun componente deve chiamarlo direttamente.
assert.match(helper, /window\.gtag\?\.\("event", event, forUmami\(enrichedParams\)\)/);
assert.match(helper, /typeof window === "undefined"/);

// Chi legge i file dei componenti non deve chiamare gtag per conto proprio:
// è il punto in cui sono nati i tre nomi diversi del passato.
for (const [name, source] of Object.entries({ newsletter, feedback, carousel, media })) {
  assert.doesNotMatch(source, /window\.gtag\?\.\(/, `${name} deve usare track(), non window.gtag`);
}

// Analytics è consent-gated: il tag non esiste nell'HTML statico.
for (const file of ["out/index.html", "out/link/index.html"]) {
  if (!existsSync(join(root, file))) continue;
  const html = read(file);
  assert.doesNotMatch(html, /googletagmanager/, `${file} non deve contenere il tag prima del consenso`);
  assert.doesNotMatch(html, /data-ga=/, `${file} non deve montare lo script di Analytics nell'export`);
}

// E non gira nemmeno nella dashboard privata.
assert.match(deferred, /pathname\?\.startsWith\("\/admin"\)/);

// Umami: sempre in pagina (nessun consenso da chiedere) ma mai nella dashboard,
// con l'ID dichiarato nel componente e il componente montato nel layout.
assert.match(layout, /<UmamiAnalytics \/>/);
assert.match(umami, /cloud\.umami\.is\/script\.js/);
assert.match(umami, /data-website-id="[0-9a-f-]{36}"/);
assert.match(umami, /pathname\?\.startsWith\("\/admin"\)/);
assert.doesNotMatch(umami, /useSyncExternalStore|"declined"/, "Umami non deve essere condizionato al consenso");

// La diramazione: `track()` parla a tutti e due, e la pageview la lascia al
// tracker di Umami per non contare due volte la stessa pagina.
assert.match(helper, /window\.umami\?\.track\(event, cleanParams\)/);
assert.match(helper, /if \(event === "page_view"\) return;/);
assert.match(helper, /forUmami/);
assert.match(helper, /window\.dataLayer\.push\(\{ event/);
assert.match(helper, /currentAttribution/);
assert.match(analytics, /attributionParams/);
assert.match(analytics, /document\.addEventListener\("click", onClick/);

// La copia nel database del sito: lotto, coda, ritentativo, e la pageview dentro
// (è l'unica destinazione che la riceve da noi).
assert.match(helper, /COLLECT_ENDPOINT = "\/api\/collect"/);
assert.match(helper, /enqueueCollect\(event, enrichedParams\)/);
assert.match(helper, /navigator\.sendBeacon\(COLLECT_ENDPOINT/);
assert.match(helper, /collectQueue = \[\.\.\.batch, \.\.\.collectQueue\]/);
// Il ritentativo vale solo per un guasto temporaneo: su un 4xx (endpoint non
// pubblicato, corpo rifiutato) riprovare sarebbe un ciclo infinito ogni tre secondi.
assert.match(helper, /response\.status >= 500 \|\| response\.status === 429/);
// L'ordine conta: la pageview deve entrare in coda **prima** dell'uscita anticipata
// verso Umami, altrimenti la copia perderebbe ogni pagina aperta.
assert.ok(
  helper.indexOf("enqueueCollect(event, params);") < helper.indexOf('if (event === "page_view") return;'),
  "la pageview deve entrare nella copia prima del ritorno per Umami",
);
assert.match(analytics, /flushCollect\(true\)/);

// Le navigazioni client-side devono produrre un page_view: è un export statico
// con link `next/link`, quindi senza questo la pagina di arrivo non viene mai
// registrata.
assert.match(analytics, /usePathname/);
assert.match(analytics, /requestAnimationFrame/);
assert.match(analytics, /content_kind: contentKindOf\(current\)/);

// Profondità di lettura: quattro traguardi, e niente su una pagina che non scorre.
assert.match(analytics, /const marks = \[25, 50, 75, 100\]/);
assert.match(analytics, /if \(scrollable <= 4\) return;/);

// Il flusso fra le pagine: ogni pagina dichiara da dove si arriva, e a ognuna
// resta attaccato il tempo che ci è stato.
assert.match(analytics, /from_path/);
assert.match(analytics, /markPageEnter\(\)/);
assert.match(analytics, /pageLeavePayload\(/);
assert.match(analytics, /noteNextPage\(/);
assert.match(helper, /session_seconds/);
assert.match(helper, /dwell_seconds/);
assert.match(helper, /max_scroll_percent/);
assert.match(helper, /next_page/);
// L'uscita deve partire anche quando si chiude la scheda, non solo quando si
// clicca un link: senza `pagehide` l'ultima pagina della visita non lascia
// traccia del tempo passato lì.
assert.match(analytics, /"pagehide"/);
assert.match(analytics, /visibilitychange/);

// Ogni evento usato nei componenti deve essere registrato in questo file.
const sources = { analytics, newsletter, feedback, carousel, media, copyLink, copyEmail };
const found = new Set();
for (const source of Object.values(sources)) {
  for (const match of source.matchAll(/\btrack(?:Event)?\(\s*"([a-z_]+)"/g)) found.add(match[1]);
}
for (const name of found) {
  assert.ok(EVENTI.includes(name), `evento non registrato in test-analytics.mjs: ${name}`);
}
for (const name of EVENTI) {
  assert.ok(found.has(name), `evento dichiarato ma mai usato: ${name}`);
}
assert.match(helper, /window\.dataLayer\.push\(\{ event/);
assert.match(helper, /currentAttribution/);
assert.match(analytics, /attributionParams/);
assert.match(analytics, /document\.addEventListener\("click", onClick/);
assert.match(media, /track\("media_progress"/);

const pages = readdirSync(join(root, "out"), { withFileTypes: true }).filter((e) => e.isDirectory()).length;
console.log(`analytics: ${EVENTI.length} eventi (incluse partenza, permanenza e uscita), un solo punto di uscita verso GA, Umami e la copia nel database, nessun tag GA prima del consenso, Umami sempre attivo fuori da /admin (${pages} cartelle nell'export)`);
console.log("analytics: i controlli offline passano (l'invio reale a GA4, a Umami e a /api/collect è UNVERIFIED qui: prova in Realtime e nella tabella Supabase)");
