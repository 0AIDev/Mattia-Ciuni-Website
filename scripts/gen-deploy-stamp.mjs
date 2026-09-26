// L'ora in cui questa build e' finita, scritta nel sito.
//
// Il pannello chiede "la mia modifica e' online?" e questa e' l'unica risposta
// che puo' dare da solo: il commit su Git e' l'*inizio* della build, non la fine,
// e senza questo l'unica verita' era aprire il sito e ricaricare a mano.
//
// Va in `out/` e **mai** in `public/`: cambia a ogni build, quindi in `public/`
// diventerebbe un file da committare a ogni deploy e una fonte di diff.
//
// `CF_PAGES_COMMIT_SHA` e' la variabile che Cloudflare Pages espone alla build.
// Per un build lanciato dal deploy hook arriva lo stesso: il branch viene
// clonato dal suo HEAD. Se un giorno non ci fosse, `commit` resta null e il
// pannello si appoggia solo sull'orario, che e' quello che gli serve.

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const out = join(process.cwd(), "out");
mkdirSync(out, { recursive: true });

const stamp = {
  built_at: new Date().toISOString(),
  commit: process.env.CF_PAGES_COMMIT_SHA || null,
};

const destination = join(out, "deploy.json");
const payload = `${JSON.stringify(stamp, null, 2)}\n`;
if (!existsSync(destination)) writeFileSync(destination, payload);
else {
  const { readFileSync } = await import("node:fs");
  if (readFileSync(destination, "utf8") !== payload) writeFileSync(destination, payload);
}

console.log(`deploy stamp: built_at ${stamp.built_at}${stamp.commit ? ` at ${stamp.commit.slice(0, 7)}` : ""}`);
