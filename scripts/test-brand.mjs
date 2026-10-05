// Il contratto del guard del brand: deve fallire quando un nome ritirato
// ricompare, e solo per quello.
//
// Un gate che ha solo passato non e' mai stato provato a fermare niente, e un
// gate che non si puo' far fallire viene allentato al primo falso positivo. Per
// questo ogni caso gira il vero check-brand.mjs dentro un repository git
// usa-e-getta: nessuna scorciatoia, nessun path di test che salta la logica.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath e non un regex sulla lettera dell'unita: togliere lo slash a
// mano funziona finche' il gruppo non lo include per sbaglio, e allora
// sostituisce il match con se' stesso senza accorgersene.
const root = fileURLToPath(new URL("..", import.meta.url));
const guard = join(root, "scripts", "check-brand.mjs");

const PASS = (name) => console.log(`PASS ${name}`);

/**
 * Costruisce un repository git temporaneo con i file dati e ci gira dentro il
 * guard vero. `git add` basta: `git ls-files` legge l'indice, non serve un commit.
 */
function run(files, { track = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "brand-guard-"));
  try {
    // core.autocrlf=false tiene muto l'warning di fine riga che altrimenti
    // ogni `git add` di fixture stamperebbe sopra l'output della suite.
    const git = (...args) => execFileSync("git", ["-c", "core.autocrlf=false", ...args], { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
    execFileSync("git", ["-c", "core.autocrlf=false", "init", "-q"], { cwd: dir });
    for (const [path, content] of Object.entries(files)) {
      const target = join(dir, path);
      mkdirSync(join(target, ".."), { recursive: true });
      writeFileSync(target, content);
    }
    if (track) git("add", "-A", "-f");
    try {
      const out = execFileSync(process.execPath, [guard], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      return { code: 0, stdout: out, stderr: "" };
    } catch (error) {
      // uscita != 0: e' il caso che questo test esiste per coprire.
      return { code: error.status ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const SITE_OK = 'export const email = "m@withnoesia.com";\nexport const companyUrl = "https://withnoesia.com";\nexport const role = "Founder & CEO at Noesia";\n';

// 1. Il caso sano: il guard passa e dice cosa ha controllato.
{
  const { code, stdout, stderr } = run({ "lib/site.ts": SITE_OK, "app/page.tsx": "const x = <p>Founder &amp; CEO at Noesia</p>;\n" });
  assert.equal(code, 0, `un repository pulito deve passare\n${stderr}${stdout}`);
  assert.match(stdout, /PASS brand: no retired name or wrong product host in 2 tracked text files/);
  assert.match(stdout, /every brand host is withnoesia\.com, declared in lib\/site\.ts/);
  PASS("a clean repo passes and reports what it scanned");
}

// 2. Il caso per cui il gate esiste: un nome ritirato in un file sorgente.
for (const [label, needle] of [
  ["capitalized", "Ceilya"],
  ["lowercase domain", "ceilya.com"],
  ["agent compound", "ceilya-agent"],
  ["older brand", "Payle"],
]) {
  const { code, stderr } = run({ "lib/site.ts": SITE_OK, "app/page.tsx": `const brand = "${needle}";\n` });
  assert.equal(code, 1, `${label}: il guard deve fallire`);
  assert.match(stderr, /FAIL brand/);
  assert.match(stderr, /app\/page\.tsx:1/, `${label}: il file e la riga devono essere indicati`);
  PASS(`the guard fails on a retired name in any case (${label}: "${needle}")`);
}

// 3. La riga riportata e' quella giusta, non solo "un file".
{
  const { code, stderr } = run({ "lib/site.ts": SITE_OK, "app/a.ts": "one\ntwo\n", "app/b.ts": "safe\nconst x = 1;\nconst y = 'Ceilya';\n" });
  assert.equal(code, 1);
  assert.match(stderr, /app\/b\.ts:3 still says the retired brand "ceilya"/);
  PASS("the reported line number is the line the name is on");
}

// 4. L'allowlist e' la stringa esatta, non un file esentato: lo stesso file
//    che contiene l'host dell'NDA deve fallire se contiene anche altro.
{
  const nda = 'const NDA_URL = "https://payle.up.railway.app/s/abc";\n';
  const ok = run({ "lib/site.ts": SITE_OK, "functions/api/nda.ts": nda });
  assert.equal(ok.code, 0, "l'host Railway dell'NDA non deve far fallire il build");
  assert.match(ok.stdout, /1 allowlisted literal/);
  PASS("the NDA document host is allowlisted by literal");

  const dirty = run({ "lib/site.ts": SITE_OK, "functions/api/nda.ts": `${nda}const old = "usepayle.com";\n` });
  assert.equal(dirty.code, 1, "un allowlist per stringa non deve coprire il resto del file");
  PASS("an allowlisted literal does not exempt the rest of its file");
}

// 5. Un file binario che contiene il nome non viene segnalato e non viene
//    toccato: e' il caso che ha rotto la build durante il rebrand precedente.
{
  const { code } = run({ "lib/site.ts": SITE_OK, "app/icon.png": Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x43, 0x65, 0x69, 0x6c, 0x79, 0x61]) });
  assert.equal(code, 0, "un file binario non deve far fallire il build");
  PASS("binary files are skipped, not decoded");
}

// 6. Solo i file tracciati contano: la scratch list locale non deve poter
//    bloccare il build di nessuno.
{
  const { code } = run({ "lib/site.ts": SITE_OK, "notes.md": "still thinking about Ceilya\n" }, { track: false });
  assert.equal(code, 0, "un file non tracciato non deve far fallire il build");
  PASS("untracked files are ignored");
}

// 7. Il guard deve sapere quale e' il brand attuale. Se lib/site.ts smette di
//    nominarlo, il check e' semplicemente sbagliato: fallisce invece di passare
//    in silenzio controllando la stringa sbagliata.
{
  const { code, stderr } = run({ "lib/site.ts": 'export const companyUrl = "https://withnoesia.com";\n' });
  assert.equal(code, 1, "una configurazione di brand non allineata deve fallire");
  assert.match(stderr, /the brand guard is stale/);
  PASS("a stale current-brand declaration fails instead of passing quietly");
}

// 8. L'elenco di file esentati non deve crescere. Il modo tipico in cui un
//    gate viene neutralizzato non e' un bug: e' aggiungere un file all'elenco
//    delle eccezioni quando segnala un falso positivo. La lista resta quindi
//    chiusa, e i due file che la compongono sono gli unici che DEVONO citare
//    i nomi ritirati: questo per vietarli, quello per testarli.
{
  const source = readFileSync(guard, "utf8");
  const block = source.match(/const owners = new Set\(\[([^\]]*)\]/);
  assert.ok(block, "check-brand.mjs deve dichiarare gli esentati in una lista owners esplicita");
  const exempt = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(
    exempt,
    ["scripts/check-brand.mjs", "scripts/test-brand.mjs"],
    "la lista degli esentati deve contenere solo i due file che citano i nomi ritirati di proposito",
  );
  PASS("the exemption list is closed: only the two files that must name the brands");
}

// 9. Il dominio del prodotto. Un host che porta il nome del brand deve essere
//    esattamente quello dichiarato: ogni altro resta un URL ben formato, quindi
//    è un link che non porta da nessuna parte e che nessun altro check nota.
{
  const bad = [
    ["www in front", "https://www.withnoesia.com", /names the host "www\.withnoesia\.com"/],
    ["no 'with' prefix", "https://noesia.com", /names the host "noesia\.com"/],
    ["wrong tld", "https://withnoesia.io", /names the host "withnoesia\.io"/],
    ["suffix trap", "https://withnoesia.com.evil.com", /names the host "withnoesia\.com\.evil\.com"/],
    ["plain http", "http://withnoesia.com", /instead of https/],
    ["credentials in the url", "https://user:pw@withnoesia.com", /credentials/],
  ];
  for (const [label, url, expected] of bad) {
    const { code, stderr } = run({ "lib/site.ts": SITE_OK, "app/page.tsx": `const u = "${url}";\n` });
    assert.equal(code, 1, `${label}: il guard deve fallire su "${url}"`);
    assert.match(stderr, expected, `${label}: messaggio inatteso`);
    PASS(`the guard rejects a wrong product host (${label})`);
  }

  // Le forme che invece sono legittime non devono mai far fallire niente: un
  // gate che urlizza il traffico legittimo viene spento al primo falso positivo.
  const good = [
    ["https url", 'const u = "https://withnoesia.com";'],
    ["trailing slash", 'const u = "https://withnoesia.com/";'],
    ["contact address", 'const u = "m@withnoesia.com";'],
    ["partner address", 'const u = "g@withnoesia.com";'],
    ["bare host in a caption", 'const caption = "withnoesia.com";'],
    ["unrelated host", 'const u = "https://mattiaciuni.com/agent";'],
    ["a file name", 'const s = "gen-cards.mjs";'],
  ];
  for (const [label, line] of good) {
    const { code, stderr } = run({ "lib/site.ts": SITE_OK, "app/page.tsx": `${line}\n` });
    assert.equal(code, 0, `${label}: non deve far fallire il build\n${stderr}`);
  }
  PASS("the guard accepts https, emails, bare hosts in copy and unrelated domains");
}

// 10. La dichiarazione in lib/site.ts è la fonte della verità, quindi viene
//     confrontata con current.domain e non solo cercata.
{
  const wrong = run({ "lib/site.ts": SITE_OK.replace("https://withnoesia.com", "https://noesia.com") });
  assert.equal(wrong.code, 1, "companyUrl deve combaciare con il dominio dichiarato");
  assert.match(wrong.stderr, /lib\/site\.ts companyUrl: points to "noesia\.com"/);
  PASS("a companyUrl that disagrees with the declared domain fails");

  const insecure = run({ "lib/site.ts": SITE_OK.replace("https://withnoesia.com", "http://withnoesia.com") });
  assert.equal(insecure.code, 1, "companyUrl non può essere http");
  PASS("an insecure companyUrl fails");

  const missing = run({ "lib/site.ts": 'export const role = "Founder & CEO at Noesia";\n' });
  assert.equal(missing.code, 1, "l'assenza di companyUrl deve fallire, non passare in silenzio");
  assert.match(missing.stderr, /declares no companyUrl/);
  PASS("a missing companyUrl fails instead of passing quietly");
}

// 11. Il pannello pubblica impostazioni che sovrascrivono il default: un
//     override rimasto indietro durante un rebrand silenzierebbe il link.
{
  const wrong = run({ "lib/site.ts": SITE_OK, "content/cms/settings/site.json": JSON.stringify({ companyUrl: "https://ceilya.com" }) });
  assert.equal(wrong.code, 1, "un override del pannello con un dominio vecchio deve fallire");
  assert.match(wrong.stderr, /site\.json companyUrl/);
  PASS("a stale panel override fails the build");

  const right = run({ "lib/site.ts": SITE_OK, "content/cms/settings/site.json": JSON.stringify({ companyUrl: "https://withnoesia.com" }) });
  assert.equal(right.code, 0, "un override allineato al default deve passare");
  PASS("a panel override that agrees with the default passes");

  // withSiteSettings ignora una stringa vuota, quindi vuoto e assente sono
  // "torna al default" e non un errore.
  const empty = run({ "lib/site.ts": SITE_OK, "content/cms/settings/site.json": JSON.stringify({ companyUrl: "" }) });
  assert.equal(empty.code, 0, "un override vuoto deve passare");
  PASS("an empty panel override falls back to the default silently");

  const broken = run({ "lib/site.ts": SITE_OK, "content/cms/settings/site.json": "{ not json" });
  assert.equal(broken.code, 1, "un site.json illeggibile deve fallire");
  assert.match(broken.stderr, /could not be parsed/);
  PASS("an unparseable site.json fails instead of being ignored");
}

console.log("brand: the gate fails on a retired name or a wrong product host, allowlists only the NDA literal, skips binaries and untracked files");
console.log("brand: i contratti sono verificati offline; il comportamento su Cloudflare Pages resta UNVERIFIED finche' non si mergia e non si guarda il build");