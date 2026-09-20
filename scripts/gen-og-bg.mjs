// Rasterizza il master SVG dello sfondo delle OG: sfondo.svg -> og-sfondo.png.
//
// Perché serve un passo separato: GDI+ (scripts/og.ps1) disegna il testo ma non sa
// leggere un SVG, quindi lo sfondo si rasterizza una volta qui e resta come master
// accanto agli altri (Vector.svg -> public/logo.svg, og.png -> public/og.png).
//
// Uso:  node scripts/gen-og-bg.mjs
// Serve `sharp` (arriva con next come dipendenza opzionale: `npm i -D sharp` se manca).
//
// Quando sfondo.svg cambia, rilanciare questo comando: og.ps1 avvisa se lo sfondo
// rasterizzato è più vecchio dell'SVG.

import { existsSync } from "node:fs";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "sfondo.svg");
const dest = join(root, "og-sfondo.png");

if (!existsSync(src)) {
  console.log("og-sfondo: sfondo.svg non trovato in root — niente da rasterizzare");
  process.exit(0);
}

let sharp;
try {
  ({ default: sharp } = await import("sharp"));
} catch {
  console.error("og-sfondo: manca sharp. Installa con `npm i -D sharp` e riprova.");
  process.exit(1);
}

// 1920x1008 = il doppio esatto di 1200x630 (stesso rapporto, nessun ritaglio).
const png = await sharp(readFileSync(src), { density: 144 })
  .resize(1920, 1008, { fit: "fill" })
  .png({ compressionLevel: 9 })
  .toBuffer();

writeFileSync(dest, png);
console.log(`og-sfondo: og-sfondo.png ${(png.length / 1024).toFixed(1)}KB (da sfondo.svg)`);
