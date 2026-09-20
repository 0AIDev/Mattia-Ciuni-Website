// Genera public/logo.svg a partire da Vector.svg (nuovo logo, in root).
// Esegui con: node scripts/gen-logo.mjs
// Il file sorgente ha canvas 1298x670 ma il tratto sborda a ~1225 di altezza
// e un filtro ombra sfocata: qui ritagliamo il viewBox sul tratto (con padding)
// e togliamo il filtro, colorando il tratto con il grigio del footer (#686868).
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "Vector.svg"), "utf8");
const m = src.match(/<path d="([^"]*)"/);
if (!m) {
  console.error("Vector.svg non trovato o path non valido");
  process.exit(1);
}
const d = m[1];
const nums = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
const xs = nums.filter((_, i) => i % 2 === 0);
const ys = nums.filter((_, i) => i % 2 === 1);
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const minY = Math.min(...ys);
const maxY = Math.max(...ys);
const pad = 40;
const viewBox = [
  Math.floor(minX - pad),
  Math.floor(minY - pad),
  Math.ceil(maxX - minX + pad * 2),
  Math.ceil(maxY - minY + pad * 2),
].join(" ");
writeFileSync(
  join(root, "public", "logo.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none"><path d="${d}" fill="#686868"/></svg>\n`,
  "utf8"
);
console.log("public/logo.svg rigenerato (viewBox " + viewBox + ")");