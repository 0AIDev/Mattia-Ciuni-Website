// L'avatar della home, dal master al file che la pagina serve davvero.
//
// Il master è `mattia.png` in root (1254×1254, come `og.png`, `Vector.svg` e
// `sfondo.svg`: i disegni a mano stanno lì, i file da servire stanno in
// `public/`). Qui diventa quello che serve: **80×80**, cioè il doppio dei 40px a
// cui la pagina lo mostra (`h-10 w-10`), quindi nitido sui display 2x e senza
// pixel sprecati.
//
// Perché conta. La versione precedente era un PNG 128×128 di ~10,5 KB servito a
// 40px: Lighthouse ne stimava ~10 KB di risparmio fra il ridimensionamento
// (128 → 40) e il formato. In WebP alla dimensione giusta sono ~2 KB, e non è
// solo peso: è una richiesta che finisce prima su mobile.
//
//   node scripts/gen-avatar.mjs            # rigenera public/mattia.webp
//
// Da rilanciare solo quando cambia il master: il risultato è **committato**
// (come le OG card), perché il build su Cloudflare non deve dipendere da `sharp`
// — che qui è disponibile perché lo porta Next, non perché sia una dipendenza
// dichiarata del progetto.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const master = join(root, "mattia.png");
const dest = join(root, "public", "mattia.webp");

if (!existsSync(master)) {
  console.error("avatar: manca il master mattia.png in root");
  process.exit(1);
}

// Quanto è grande il quadrato disegnato nella pagina, per il fattore 2.
const SIZE = 80;

const source = sharp(master);
const meta = await source.metadata();

await source
  .resize(SIZE, SIZE, { fit: "cover", position: "centre" })
  // In bianco e nero come il resto della testata: `grayscale` rifà quello che il
  // master colorato non dichiara da sé.
  .grayscale()
  .webp({ quality: 82, effort: 6 })
  .toFile(dest);

const bytes = readFileSync(dest).length;
console.log(
  `avatar: mattia.webp ${SIZE}×${SIZE} da ${meta.width}×${meta.height} · ${(bytes / 1024).toFixed(1)}KB`,
);
