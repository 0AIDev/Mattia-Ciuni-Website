// Il controllo che guarda il sito **dal vivo**, non l'export.
//
// `verify.js` è offline, e per questo non poteva vedere il guasto del 2026-09-21:
// il sito dichiarava `https://mattiaciuni.xyz` — un dominio senza DNS (NXDOMAIN
// dal registro `.xyz`) — mentre rispondeva su un altro host. Dentro il build era
// tutto verde; fuori, la sitemap elencava indirizzi che non risolvono e Discord e
// X non mostravano nessuna anteprima, perché chiedevano la card a un dominio
// inesistente.
//
// Da allora il dominio segue l'host che serve la pagina (`functions/_middleware.ts`),
// quindi questo controllo non dovrebbe più trovare quel guasto. Resta perché è
// l'unico che guarda **da fuori**: il DNS, il deploy che serve l'export di un
// altro commit, un dominio custom che dichiara il `.pages.dev`.
//
// Per questo si legge **prima dal sito pubblicato**: la sitemap viva dice qual è
// il dominio che il deploy dichiara davvero, le pagine vive dicono quale
// `og:image` dichiarano. Confrontarlo con l'export locale direbbe solo che il
// computer è d'accordo con sé stesso.
//
//   node scripts/check-live.mjs                                    # dominio dall'export
//   node scripts/check-live.mjs --site=https://esempio.workers.dev
//
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { lookup } from "node:dns/promises";

const baseDir = dirname(fileURLToPath(import.meta.url));
const outDir = join(baseDir, "..", "out");

// Il dominio: dal `--site=`, altrimenti da quello che dichiara la home costruita.
const arg = process.argv.find((a) => a.startsWith("--site="));
const declared = (() => {
  if (arg) return arg.slice("--site=".length);
  const file = join(outDir, "index.html");
  if (!existsSync(file)) return "";
  const html = readFileSync(file, "utf8");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] || "";
  const og = html.match(/property="og:image" content="([^"]+)"/)?.[1] || "";
  return canonical || og.replace(/\/og\.png$/, "");
})();
const site = declared.replace(/\/$/, "");

if (!/^https?:\/\//.test(site)) {
  console.error("live: non trovo il dominio (usa --site=https://… oppure lancia prima il build)");
  process.exit(1);
}
const host = new URL(site).hostname;

let fail = 0;
const check = (name, cond, detail = "") => {
  console.log((cond ? "PASS " : "FAIL ") + name + (cond || !detail ? "" : " — " + detail));
  if (!cond) fail++;
};

const fetchText = async (url) => {
  try {
    const res = await fetch(url, { redirect: "follow" });
    return { ok: res.ok, status: res.status, body: await res.text(), type: res.headers.get("content-type") || "" };
  } catch (e) {
    return { ok: false, status: 0, body: "", type: "", error: String(e.cause?.code ?? e.cause ?? e.message) };
  }
};
const head = async (url) => {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return { ok: res.ok, status: res.status, type: res.headers.get("content-type") || "" };
  } catch (e) {
    return { ok: false, status: 0, type: "", error: String(e.cause?.code ?? e.cause ?? e.message) };
  }
};

// 1 · Il dominio esiste. È il controllo che mancava: senza questo, tutto il resto
// prova indirizzi che nessuno può raggiungere.
let addresses = [];
try {
  addresses = await lookup(host, { all: true });
} catch {
  addresses = [];
}
check(
  `live: ${host} resolves in DNS`,
  addresses.length > 0,
  addresses.length === 0 ? "NXDOMAIN: il dominio dichiarato non esiste" : "",
);

// 2 · La sitemap pubblicata non nomina un dominio diverso da quello che risponde.
const index = await fetchText(`${site}/sitemap.xml`);
check(`live: /sitemap.xml answers 200 (${index.status})`, index.ok, index.error);
const children = [...index.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const foreign = children.filter((u) => !u.startsWith(site + "/") && u !== site);
check(
  `live: the published sitemap declares this domain (${children.length} children)`,
  children.length > 0 && foreign.length === 0,
  foreign.slice(0, 2).join(", "),
);

const urls = [];
for (const child of children) {
  const res = await fetchText(child);
  check(`live: child sitemap ${child.replace(site, "")} answers 200 (${res.status})`, res.ok, res.error);
  urls.push(...[...res.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
}

// 3 · Ogni pagina elencata risponde, dice di essere sé stessa (canonical) e
// dichiara una card completa sullo **stesso dominio**.
const images = new Map();
const problems = [];
for (const url of urls) {
  const res = await fetchText(url);
  const canonical = res.body.match(/<link rel="canonical" href="([^"]+)"/)?.[1] || "";
  const og = res.body.match(/property="og:image" content="([^"]+)"/)?.[1] || "";
  const complete =
    /property="og:image:width"/.test(res.body) &&
    /property="og:image:height"/.test(res.body) &&
    /property="og:image:type"/.test(res.body);
  if (!res.ok) problems.push(`${url.replace(site, "")} (${res.status})`);
  else if (canonical !== url && canonical !== url.replace(/\/$/, "")) problems.push(`${url.replace(site, "")} (canonical diversa)`);
  else if (!og.startsWith(site)) problems.push(`${url.replace(site, "")} (og:image su un altro dominio)`);
  else if (!complete) problems.push(`${url.replace(site, "")} (og:image senza width/height/type)`);
  if (og.startsWith(site)) images.set(og, [...(images.get(og) || []), url]);
}
check(
  `live: every sitemap page answers and declares its own complete og:image (${urls.length} pages)`,
  urls.length > 0 && problems.length === 0,
  problems.slice(0, 4).join(", "),
);

// 4 · Le card dichiarate sono raggiungibili e sono immagini: è la prima cosa che
// chiede un'anteprima (Discord, X, Slack, LinkedIn).
for (const url of images.keys()) {
  const res = await head(url);
  check(
    `live: ${url.replace(site, "")} is reachable and an image (${res.status})`,
    res.ok && res.type.startsWith("image/"),
    res.error || res.type,
  );
}

console.log(
  fail === 0
    ? `live: tutto a posto su ${site} (${urls.length} pagine, ${images.size} card)`
    : `live: ${fail} controlli rossi su ${site}`,
);
process.exit(fail === 0 ? 0 : 1);
