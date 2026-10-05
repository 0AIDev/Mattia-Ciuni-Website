/**
 * Oggi esce qualcosa?
 *
 * Il sito e' statico e la data di pubblicazione e' un campo dei registri, come
 * in `lib/publication.ts`: un pezzo diventa pagina quando una build gira dopo
 * la sua data. La build e' quella di Cloudflare, e Cloudflare la fa partire da
 * un push. Percio' la domanda che questo script risponde e' l'unica che conta
 * per il workflow: oggi esce un pezzo, e quindi vale la pena di spingere?
 *
 * Se la risposta fosse sempre si', quattro build a settimana finirebbero per
 * lasciare in cronologia duecento commit vuoti che non cambiavano nulla, e un
 * registro di commit illeggibile e' il modo piu' rapido per far smettere di
 * usare la cronologia. Il workflow ricostruisce solo quando questo script dice
 * che qualcosa esce davvero.
 *
 * I registri si leggono come testo e non si importano: `scripts/verify.js`
 * gia' fa cosi' perche' non puo' importare TypeScript, e la finestra usata qui
 * e' la stessa, cioe' `slug` e la prima `date` che lo segue appartengono allo
 * stesso oggetto. Il prezzo e' che questa copia della regola puo' separarsi da
 * quella in `lib/publication.ts`, ed e' un rischio noto: se i due si separano,
 * il controllo di `verify.js` che confronta le pagine esportate con i pezzi
 * pubblicati cade, e dice perche'.
 *
 * L'uscita e' su stdout perche' sia il workflow GitHub sia una persona dal
 * terminale la possano leggere: `due=true`, `due=false`, o un elenco di slug
 * quando qualcosa non torna.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Gli stessi registri che esportano pagine. Le offerte di lavoro hanno una data
// di pubblicazione propria ma non fanno parte della coda: `careers` le genera
// dal pannello e non ha pezzi con data futura da sbloccare.
const REGISTRIES = ["lib/posts.ts", "lib/notes.ts", "lib/feedback.ts"];

const day = (process.argv[2] || new Date().toISOString().slice(0, 10)).trim();
if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
  console.log("due=false");
  console.log(`is-anything-due-today: ${day} non e' una data YYYY-MM-DD`);
  process.exit(1);
}

const due = [];
for (const file of REGISTRIES) {
  const source = readFileSync(join(root, file), "utf8");
  for (const match of source.matchAll(/slug:\s*"([^"]+)"[\s\S]*?date:\s*"([^"]+)"/g)) {
    if (match[2] === day) due.push(`${file.replace("lib/", "").replace(".ts", "")}/${match[1]}`);
  }
}

if (due.length > 0) console.log(`due=true\n- ${due.join("\n- ")}`);
else console.log("due=false");