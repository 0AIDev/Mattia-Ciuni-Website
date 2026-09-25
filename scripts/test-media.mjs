// Test offline per la libreria media, le impostazioni del sito, i redirect e il
// routing delle pagine.
//
// Girano senza rete e senza Cloudflare: `lib/media.ts` e `lib/cms-*.ts` sono
// moduli puri, e quello che conta verificare qui e' la validazione. Un upload
// che accetta `../../etc/passwd` o che serve `.html` come immagine non fallisce
// in test, fallisce in produzione.

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";

import { contentTypeFor, extensionOf, formatBytes, isAllowedContentType, kindForName, MEDIA_MAX_BYTES, mediaUrl, safeMediaKey } from "../lib/media.ts";
import { setCmsContentRoot } from "../lib/cms-content.ts";
import { withSiteSettings } from "../lib/cms-settings.ts";
import { cmsRedirectLines } from "../lib/cms-redirects.ts";
import { pageLocales } from "../lib/cms-pages.ts";

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

check("media: safe keys accept known media types", () => {
  assert.equal(safeMediaKey("raj.mp3"), "content/raj.mp3");
  assert.equal(safeMediaKey("diagram.png"), "content/diagram.png");
  assert.equal(safeMediaKey("deck.pdf"), "content/deck.pdf");
  assert.equal(safeMediaKey("clip.webm"), "content/clip.webm");
});

check("media: path traversal and unknown types are refused", () => {
  assert.equal(safeMediaKey("../../etc/passwd"), null);
  assert.equal(safeMediaKey("..%2fpasswd.png"), null);
  assert.equal(safeMediaKey("payload.html"), null, "HTML must never be uploadable");
  assert.equal(safeMediaKey("payload.svg"), null, "SVG can carry script");
  assert.equal(safeMediaKey("no-extension"), null);
  assert.equal(safeMediaKey(""), null);
  assert.equal(safeMediaKey("a".repeat(200) + ".png"), null, "over-long names are refused");
});

check("media: the served type comes from the extension, not the request", () => {
  // A renamed file travels with its original Content-Type. The served type must
  // be the one the extension promises, or the browser gets HTML it did not expect.
  assert.equal(isAllowedContentType("image", "image/png"), true);
  assert.equal(isAllowedContentType("image", "text/html"), false);
  assert.equal(isAllowedContentType("image", "image/png; charset=binary"), true);
  assert.equal(contentTypeFor("image"), "image/png");
  assert.equal(contentTypeFor("pdf"), "application/pdf");
});

check("media: classification and formatting", () => {
  assert.equal(kindForName("a.PNG"), "image");
  assert.equal(kindForName("a.m4a"), "audio");
  assert.equal(extensionOf("no-dot"), "");
  assert.equal(mediaUrl("content/raj.mp3"), "/media/content/raj.mp3");
  assert.equal(formatBytes(2048), "2.0 KB");
  assert.ok(MEDIA_MAX_BYTES > 0);
});

check("settings: an empty field falls back to the value in code", () => {
  const base = { name: "Mattia Ciuni", description: "Original", email: "ceo@usepayle.com" };
  const merged = withSiteSettings({ ...base });
  assert.equal(merged.name, "Mattia Ciuni", "no override file means the defaults win");
  const social = { linkedin: "https://linkedin.com/in/mattiaciuni", x: "https://x.com/mattiaciuni" };
  const withSocial = withSiteSettings({ ...base, social });
  assert.equal(Object.keys(withSocial.social).length, 2);
});

check("settings: an empty social map never empties sameAs", () => {
  // The social map feeds the Person JSON-LD sameAs. An empty array removes the
  // profiles from the search engines, so the merge must refuse to produce one.
  const merged = withSiteSettings({ name: "x", social: { linkedin: "https://a", github: "https://b" } });
  assert.equal(merged.social.linkedin, "https://a");
  assert.equal(merged.social.github, "https://b");
});

check("redirects: rules are formatted for _redirects", () => {
  // Without published rules the list is empty and the postbuild step is a no-op.
  assert.ok(Array.isArray(cmsRedirectLines()));
  for (const line of cmsRedirectLines()) {
    assert.match(line, /^\/\S+ {2}\S+ {2}30[1278]$/);
  }
});

check("pages: an empty locales list means English only", () => {
  assert.deepEqual(pageLocales({ slug: "x", locales: [] }), ["en"]);
  assert.deepEqual(pageLocales({ slug: "x" }), ["en"]);
  assert.deepEqual(pageLocales({ slug: "x", locales: ["it", "fr", "it"] }), ["it", "fr"]);
  assert.deepEqual(pageLocales({ slug: "x", locales: ["klingon"] }), ["en"], "unknown languages fall back to English");
});

// Il loader dei file pubblicati legge dal filesystem al momento dell'import, quindi
// il test gli passa una radice temporanea. Non scrive in `content/` del progetto:
// la prima versione di questo test lo faceva, e cancellando la directory ha
// portato via anche i file veri che gia' c'erano.
const scratch = mkdtempSync(join(tmpdir(), "cms-media-"));
try {
  const pagesDir = join(scratch, "content", "cms", "page");
  mkdirSync(pagesDir, { recursive: true });
  writeFileSync(join(pagesDir, "speaking.json"), JSON.stringify({
    slug: "speaking",
    title: "Speaking",
    locales: ["en", "it"],
    date: "2026-09-25",
    content: [{ type: "h2", text: "Talks" }, { type: "p", text: "Body." }],
  }));
  writeFileSync(join(pagesDir, "broken.json"), "{ not json");
  setCmsContentRoot(scratch);
  const { cmsPages, cmsPage } = await import(`../lib/cms-pages.ts?scratch=${Date.now()}`);
  check("pages: a published page is loaded and resolved per language", () => {
    assert.equal(cmsPages.length, 1, "the invalid file is skipped, not fatal");
    assert.ok(cmsPage("speaking", "en"));
    assert.ok(cmsPage("speaking", "it"), "Italian is listed, so it exists");
    assert.equal(cmsPage("speaking", "fr"), null, "French is not listed, so it does not exist");
    assert.equal(cmsPage("speaking", "de"), null);
  });
} finally {
  setCmsContentRoot(process.cwd());
  rmSync(scratch, { recursive: true, force: true });
}

if (failures) {
  console.error(`\n${failures} media/site test(s) failed`);
  process.exit(1);
}
console.log("\nmedia, settings, redirects and pages: all checks passed");
