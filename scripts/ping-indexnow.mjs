import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const origin = (process.env.NEXT_PUBLIC_SITE_URL || "https://mattiaciuni.pages.dev").replace(/\/$/, "");
const key = process.env.INDEXNOW_KEY?.trim();

if (!key) {
  console.log("indexnow: skipped (INDEXNOW_KEY is not configured)");
  process.exit(0);
}

const out = join(process.cwd(), "out");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, `${key}.txt`), key + "\n", "utf8");

const urls = [
  `${origin}/`,
  `${origin}/thoughts/`,
  `${origin}/notes/`,
  `${origin}/sitemap.xml`,
  `${origin}/news-sitemap.xml`,
];
const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(origin).hostname, key, keyLocation: `${origin}/${key}.txt`, urlList: urls }),
});
if (!response.ok && response.status !== 202) {
  console.warn(`indexnow: provider returned ${response.status}; build continues`);
} else {
  console.log(`indexnow: submitted ${urls.length} URLs`);
}
