// Le rotte che esistono solo in locale non si pubblicano.
//
// Perche' cancellarle dall'export invece di lasciarle e proteggerle. Il pannello
// era esportato come pagina statica su `mattiaciuni.com` e difeso solo dal TOTP:
// la pagina esisteva per chiunque la chiedesse, il percorso di autenticazione era
// raggiungibile da internet, e un errore li' dentro era un errore nel punto piu'
// costoso del sito. Un file che non viene caricato non ha bisogno di essere
// difeso, e questa e' l'unica forma di protezione che non dipende dal fatto che
// qualcuno ricordi di applicarla.
//
// Perche' non basta il middleware: `functions/_middleware.ts` risponde 404 su
// `/admin/*` fuori da localhost, ed e' la regola che conta in esercizio. Questo
// passo fa l'altra meta' del lavoro — non spedire il file — e le due cose sono
// indipendenti di proposito: se un giorno una regola di routing smettesse di
// instradare il ramo privato, non ci sarebbe comunque niente da servire.
//
// Gira **prima** dei generatori in `postbuild`, non dopo: `gen-cards.mjs`,
// `gen-rag.mjs` e `gen-agent-files.mjs` leggono l'export, e un export potato
// prima non puo' finire indicizzato da nessuno di loro.
//
// `out/` puo' contenere cartelle di build precedenti (`out/admin/geo` era
// rimasta da una pagina poi rimossa, e sarebbe stata pubblicata): per questo la
// potatura e' ricorsiva su tutto il ramo e non su un elenco di file.

import { existsSync, readdirSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const out = join(root, "out");

// L'elenco e' chiuso di proposito: ogni voce e' un ramo che esiste solo in
// locale, e aggiungerne una e' una decisione, non un dettaglio.
const LOCAL_ONLY = ["admin"];

// Le sorgenti che devono restare al loro posto. Il pannello non e' stato
// rimosso: e' diventato locale. Se qualcuno cancellasse `app/admin/` credendo di
// fare la stessa cosa, questo script lo direbbe.
const SOURCES_THAT_MUST_EXIST = [
  "app/admin/feedback/page.tsx",
  "functions/api/admin/feedback.ts",
  "functions/api/admin/media.ts",
];

function countFiles(target) {
  let total = 0;
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory()) total += countFiles(join(target, entry.name));
    else total += 1;
  }
  return total;
}

if (!existsSync(out)) {
  console.error("FAIL prune: out/ does not exist. This step runs after the export, not before.");
  process.exit(1);
}

const missingSources = SOURCES_THAT_MUST_EXIST.filter((file) => !existsSync(join(root, file)));
if (missingSources.length) {
  console.error("FAIL prune: the local panel is gone, and that is not what this script does.");
  for (const file of missingSources) console.error(`  missing: ${file}`);
  process.exit(1);
}

// L'interruttore per il build che serve `localhost:8787`.
//
// Serve, e non e' un dettaglio: `npm run dev:pages` lancia `npm run build`, che
// lancia questo passo. Senza l'interruttore, l'unico comando con cui si apre il
// pannello comincerebbe col cancellare dall'export la pagina che sta per
// servire — `dev:pages` risponderebbe 404 e il pannello sembrerebbe rotto, non
// locale. La variabile la passa `scripts/dev-pages.mjs` a se stesso e non
// compare in nessun file di configurazione del repo: una build di produzione
// non la vede, e il controllo di `scripts/verify.js` lega le due copie.
//
// Il marcatore `out/.local-build` esiste per il controllo, non per il browser:
// dice a `scripts/verify.js` che l'export presente e' quello che `dev:pages`
// serve, quindi il ramo privato **deve** esserci. Senza marcatore, un export
// con `out/admin` dentro e' un export da pubblicare, ed e' un guasto. Le due
// scritture sono esplicite e opposte di proposito: lo stato non dipende dal
// fatto che `next build` pulisca o meno `out/` fra due build.
const LOCAL_BUILD = /^(?:0|false|no)$/i.test((process.env.PRUNE_LOCAL_ONLY || "").trim());
const marker = join(out, ".local-build");

if (LOCAL_BUILD) {
  const absent = LOCAL_ONLY.filter((name) => !existsSync(join(out, name)));
  if (absent.length) {
    console.error(`FAIL prune: local build, but the export has no such route: ${absent.join(", ")}`);
    console.error("  This build is the one dev:pages serves, and it is missing the panel it exists for.");
    process.exit(1);
  }
  writeFileSync(marker, "local build: this export is served by `npm run dev:pages`, never deployed\n");
  console.log(
    `prune: local build (PRUNE_LOCAL_ONLY=0), kept out/${LOCAL_ONLY.join(", out/")} — served locally, not deployed`,
  );
  process.exit(0);
}

// Un export da pubblicare non porta il marcatore di un export locale.
if (existsSync(marker)) unlinkSync(marker);

let removed = 0;
for (const name of LOCAL_ONLY) {
  const target = join(out, name);
  if (!existsSync(target) || !statSync(target).isDirectory()) continue;
  const files = countFiles(target);
  rmSync(target, { recursive: true, force: true });
  removed += files;
  console.log(`prune: removed out/${name} from the export (${files} file(s))`);
}

// Rilettura: un passo di potatura che non verifica se' stesso e' un passo che
// puo' smettere di funzionare in silenzio.
const left = LOCAL_ONLY.filter((name) => existsSync(join(out, name)));
if (left.length) {
  console.error(`FAIL prune: still in the export: ${left.join(", ")}`);
  process.exit(1);
}

console.log(`prune: no local-only route in the export (${LOCAL_ONLY.length} checked, ${removed} file(s) removed)`);
