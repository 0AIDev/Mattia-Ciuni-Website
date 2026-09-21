// Rasterizza i master SVG dello sfondo: sfondo.svg -> og-sfondo.png + og-sfondo-cover.png.
//
// Perché serve un passo separato: GDI+ (scripts/og.ps1) disegna il testo ma non sa
// leggere un SVG, quindi lo sfondo si rasterizza una volta qui e resta come master
// accanto agli altri (Vector.svg -> public/logo.svg, og.png -> public/og.png).
//
// Due raster, dallo stesso disegno:
//   og-sfondo.png        com'è: logo in alto al centro, per le card social (og.png);
//   og-sfondo-cover.png  senza il logo, per l'immagine che sta in pagina sopra il
//                        titolo (`cover.png`): lì il logo sarebbe di troppo, e senza
//                        di lui il testo può stare al centro del riquadro.
//
// Uso:  node scripts/gen-og-bg.mjs
// Serve `sharp` (arriva con next come dipendenza opzionale: `npm i -D sharp` se manca).
//
// Quando sfondo.svg cambia, rilanciare questo comando: og.ps1 avvisa se lo sfondo
// rasterizzato è più vecchio dell'SVG.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "sfondo.svg");

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

const svg = readFileSync(src, "utf8");

// Il logo è l'unico <path> del disegno (il file ha un solo path, con opacity
// 0.992157): se un giorno non c'è più, è meglio fermarsi che generare in silenzio
// una copertina col logo dentro.
const logoPath = svg.match(/<path[^>]*opacity="0\.992157"[^>]*\/?>/);
if (!logoPath) {
  console.error(
    "og-sfondo: in sfondo.svg non trovo il path del logo (opacity 0.992157).\n" +
      "Se hai rifatto il disegno, aggiorna questo script: la copertina deve restare senza logo.",
  );
  process.exit(1);
}
const svgCover = svg.replace(logoPath[0], "");

// 1920x1008 = il doppio esatto di 1200x630 (stesso rapporto, nessun ritaglio).
const render = (input) => sharp(input, { density: 144 }).resize(1920, 1008, { fit: "fill" }).png({ compressionLevel: 9 }).toBuffer();

const withLogo = await render(Buffer.from(svg));
writeFileSync(join(root, "og-sfondo.png"), withLogo);

const withoutLogo = await render(Buffer.from(svgCover));
writeFileSync(join(root, "og-sfondo-cover.png"), withoutLogo);

console.log(
  `og-sfondo: og-sfondo.png ${(withLogo.length / 1024).toFixed(1)}KB · ` +
    `og-sfondo-cover.png ${(withoutLogo.length / 1024).toFixed(1)}KB (da sfondo.svg)`,
);
