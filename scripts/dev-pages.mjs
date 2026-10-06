import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

if (!existsSync(".dev.vars")) {
  console.error("Missing .dev.vars. Copy .dev.vars.example to .dev.vars and set a local ADMIN_TOKEN before starting Pages.");
  process.exit(1);
}

const vars = readFileSync(".dev.vars", "utf8");
const token = vars.match(/^ADMIN_TOKEN\s*=\s*(.+)$/m)?.[1]?.trim();
if (!token || token === "replace-with-a-long-local-token") {
  console.error(".dev.vars needs a real local ADMIN_TOKEN. Do not copy the production token into the repository.");
  process.exit(1);
}

const IS_WINDOWS = process.platform === "win32";

/**
 * Lancia un comando del progetto con l'output nel terminale.
 *
 * `shell: IS_WINDOWS` non e' una preferenza: su Windows un file `.cmd` non si
 * lancia piu' senza shell. Il fix di CVE-2024-27980 in Node rende `EINVAL` uno
 * spawn di `npm` con estensione e senza shell, quindi `dev:pages` moriva sulla
 * prima riga — un comando che non apriva il pannello, e per un motivo che dal
 * messaggio d'errore non si capisce. Con la shell dichiarata il nome non porta
 * l'estensione e la risoluzione passa dal `PATH`. Gli argomenti qui sotto sono
 * letterali e senza spazi, quindi non c'e' niente da quotare.
 */
function run(command, args, options = {}) {
  return spawn(command, args, { stdio: "inherit", shell: IS_WINDOWS, ...options });
}

// `PRUNE_LOCAL_ONLY=0` spegne la potatura del ramo locale in `postbuild`.
//
// Questo e' l'unico build che serve il pannello: senza la variabile, `postbuild`
// cancellerebbe `out/admin` un istante prima che `wrangler pages dev out` lo
// serva, e `dev:pages` diventerebbe un comando che non apre la cosa per cui
// esiste. La variabile vive qui e solo qui — non in un file di configurazione,
// non in `.env` — quindi una build di produzione non puo' ereditarla. Il legame
// fra questa riga e `scripts/prune-local-only.mjs` e' un controllo di
// `scripts/verify.js`.
const build = run("npm", ["run", "build"], {
  env: { ...process.env, PRUNE_LOCAL_ONLY: "0" },
});

build.on("exit", (code, signal) => {
  if (code !== 0 || signal) process.exit(code ?? 1);
  const pages = run("npx", ["wrangler", "pages", "dev", "out", "--port", "8787"]);
  pages.on("exit", (pagesCode, pagesSignal) => process.exit(pagesCode ?? (pagesSignal ? 1 : 0)));
});
