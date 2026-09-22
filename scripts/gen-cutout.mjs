// La figura del header di /link, dal master al file che la pagina serve davvero.
//
// Il master è `mattia 1.png` in root (1004×1000, PNG con trasparenza: la figura
// ritagliata senza sfondo). Qui diventa **560px di larghezza**, cioè il doppio
// dei 280px a cui la pagina la mostra, quindi nitida sui display 2x e senza
// pixel sprecati. Stessa regola dell'avatar (vedi `scripts/gen-avatar.mjs`):
//
//   i disegni a mano stanno in root, i file da servire stanno in `public/`.
//
//   node scripts/gen-cutout.mjs            # rigenera public/mattia-cutout.webp
//
// Il risultato è **committato**: il build su Cloudflare non deve dipendere da
// `sharp`, che qui c'è perché lo porta Next, non perché sia una dipendenza
// dichiarata del progetto. Rilanciare solo quando cambia il master.
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const master = join(root, "mattia 1.png");
const dest = join(root, "public", "mattia-cutout.webp");

if (!existsSync(master)) {
  console.error("cutout: manca il master 'mattia 1.png' in root");
  process.exit(1);
}

const WIDTH = 560;
// Il master contiene una vecchia scritta nera nella fascia inferiore. La pagina
// aggiunge il nome come testo HTML, quindi il ritaglio la elimina alla fonte e
// lascia il titolo bianco pulito, senza sovrapporre due nomi.
const CROP_HEIGHT = 470;

const source = sharp(master);
const meta = await source.metadata();

await source
  .extract({ left: 0, top: 0, width: meta.width || WIDTH, height: Math.min(meta.height || CROP_HEIGHT, CROP_HEIGHT) })
  .resize({ width: WIDTH, withoutEnlargement: true })
  .webp({ quality: 80, effort: 6, alphaQuality: 90 })
  .toFile(dest);

console.log(`cutout: ${meta.width}x${meta.height} -> ${WIDTH}px di larghezza in public/mattia-cutout.webp`);
