// Il contratto del guard del brand: deve fallire quando un'identita' corrente
// resta indietro dopo un rebrand, e solo per quello.
//
// Il contratto e' cambiato con il passaggio Noesia -> Know Computer: i nomi
// vecchi non sono piu' vietati come tali (la storia del sito deve poterli
// contenere), lo e' presentarli come azienda, ruolo o indirizzo di contatto
// correnti. Quindi i test coprono due lati: la frase storica deve passare, la
// pretesa di identita' corrente deve cadere, e gli host devono combaciare con
// quelli dichiarati - il dominio corrente piu' l'host storico esatto.
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
    // core.autocrlf=false tiene muto il warning di fine riga che altrimenti
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

const SITE_OK =
  'export const email = "m@knowcomputer.com";\n' +
  'export const companyUrl = "https://knowcomputer.com";\n' +
  'export const role = "Founder & CEO at Know Computer";\n';

// 1. Il caso sano: il guard passa e dice cosa ha controllato.
{
  const { code, stdout, stderr } = run({
    "lib/site.ts": SITE_OK,
    "app/page.tsx": "const x = <p>Founder &amp; CEO at Know Computer</p>;\n",
  });
  assert.equal(code, 0, `un repository pulito deve passare\n${stderr}${stdout}`);
  assert.match(stdout, /PASS brand: no stale identity claim or wrong brand host in 2 tracked text files/);
  assert.match(stdout, /every brand host is knowcomputer\.com, declared in lib\/site\.ts/);
  PASS("a clean repo passes and reports what it scanned");
}

// 2. Il caso per cui il gate esiste: una pretesa di identita' corrente che
//    nomina un'azienda vecchia. I nomi vecchi da soli non contano: la frase
//    storica qui sotto deve passare.
for (const [label, needle] of [
  ["role claim", "Founder & CEO at Noesia"],
  ["escaped JSX role claim", "Founder &amp; CEO of Noesia"],
  ["prose role claim", "founder and CEO of Noesia"],
  ["localized role claim", "CEO di Noesia"],
  ["reverse order", "Noesia founder"],
  ["stale keyword", "Mattia Ciuni Noesia"],
  ["stale contact address", "m@withnoesia.com"],
  ["older brand role claim", "CEO of Payle"],
]) {
  const { code, stderr } = run({ "lib/site.ts": SITE_OK, "app/page.tsx": `const claim = "${needle}";\n` });
  assert.equal(code, 1, `${label}: il guard deve fallire`);
  assert.match(stderr, /FAIL brand/);
  assert.match(stderr, /app\/page\.tsx:1/, `${label}: il file e la riga devono essere indicati`);
  PASS(`the guard fails on a stale current-identity claim (${label}: "${needle}")`);
}

// 3. La storia resta pubblicabile: un articolo che nomina i progetti passati
//    per nome, con i suoi link e i suoi indirizzi, non e' un errore.
{
  const history = [
    ["the evolution in one sentence", "Before Know, I built Celeste and worked on financial infrastructure for AI agents through Payle, Ceilya and Noesia."],
    ["a preserved link", "So I stopped building the browser and started building [Noesia](https://withnoesia.com)."],
    ["the partner's address", "You can find Ghassen at g@withnoesia.com."],
    ["the old slogan in a quote", 'const quote = "the money layer for AI agents";'],
    ["the NDA host", 'const NDA_URL = "https://payle.up.railway.app/s/abc";'],
    ["an old article title", 'const t = "The money layer for AI agents";'],
  ];
  for (const [label, line] of history) {
    const { code, stderr } = run({ "lib/site.ts": SITE_OK, "lib/posts.ts": `${line}\n` });
    assert.equal(code, 0, `${label}: la storia deve passare\n${stderr}`);
  }
  PASS("historical mentions of Payle, Ceilya and Noesia (prose, links, addresses, titles) pass");
}

// 4. La riga riportata e' quella giusta, non solo "un file".
{
  const { code, stderr } = run({
    "lib/site.ts": SITE_OK,
    "app/a.ts": "one\ntwo\n",
    "app/b.ts": "safe\nconst x = 1;\nconst y = 'Noesia CEO';\n",
  });
  assert.equal(code, 1);
  assert.match(stderr, /app\/b\.ts:3 still claims the stale identity "Noesia CEO"/);
  PASS("the reported line number is the line the claim is on");
}

// 5. Gli archivi quotano: un audit generato o uno snapshot di Search Console
//    registrano cosa una pagina diceva a una data, e aggiornarli sarebbe
//    falsificarli. La quotazione e' per file e per literal esatta, non un
//    file esentato: la stessa frase in un sorgente cade lo stesso.
{
  const archive =
    run({ "lib/site.ts": SITE_OK, "docs/search-console.md": "| titolo `Mattia Ciuni \\| Founder & CEO at Noesia, AI agent payments` |\n" });
  assert.equal(archive.code, 0, "lo snapshot datato deve poter citare il titolo di allora");
  PASS("a dated Search Console snapshot may quote the stale title");

  const audit = run({ "lib/site.ts": SITE_OK, "docs/SEO-LIVE-AUDIT.md": "| PASS About Mattia Ciuni | Founder &amp; CEO of Noesia | PASS |\n" });
  assert.equal(audit.code, 0, "l'audit generato deve poter citare il titolo di allora");
  PASS("a generated audit may quote the stale title");

  const scoped = run({
    "lib/site.ts": SITE_OK,
    "docs/search-console.md": "| titolo `Founder & CEO at Noesia` |\n",
    "app/page.tsx": 'const claim = "Founder & CEO at Noesia";\n',
  });
  assert.equal(scoped.code, 1, "la quotazione non deve coprire un sorgente");
  assert.match(scoped.stderr, /app\/page\.tsx:1/);
  PASS("archive quoting is scoped: the same phrase in a source still fails");
}

// 6. I file derivati non sono un esento: sono rimossi per sequenziamento. Le
//    card e gli indici sotto public/ li riscrive il build, quindi in un gate
//    prebuild contengono ancora l'identita' del build precedente - se il gate
//    li scansisse, il primo build di un rebrand non potrebbe mai partire. I
//    file di public/ che nessun generatore possiede restano nella scansione.
{
  const stale = 'const role = "Founder & CEO at Noesia";\n';
  const derivedOk = run({
    "lib/site.ts": SITE_OK,
    "public/about.md": stale,
    "public/rag/index.json": `{"policy":"${stale.trim()}"}`,
    "public/.well-known/agent-skills/x/SKILL.md": stale,
  });
  assert.equal(derivedOk.code, 0, `i file derivati devono stare fuori dalla scansione\n${derivedOk.stderr}`);
  assert.match(derivedOk.stdout, /3 derived skipped/);
  PASS("generator-owned files under public/ are skipped for sequencing, and counted");

  const handOwned = run({ "lib/site.ts": SITE_OK, "public/auth.md": stale, "public/webmcp.js": stale });
  assert.equal(handOwned.code, 1, "i file a mano di public/ devono restare nella scansione");
  assert.match(handOwned.stderr, /public\/auth\.md:1/);
  assert.match(handOwned.stderr, /public\/webmcp\.js:1/);
  PASS("hand-written files under public/ stay in the sweep");
}

// 7. Un file binario che contiene il nome non viene segnalato e non viene
//    toccato: e' il caso che ha rotto la build durante un rebrand precedente.
{
  const { code } = run({ "lib/site.ts": SITE_OK, "app/icon.png": Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x43, 0x65, 0x69, 0x6c, 0x79, 0x61]) });
  assert.equal(code, 0, "un file binario non deve far fallire il build");
  PASS("binary files are skipped, not decoded");
}

// 8. Solo i file tracciati contano: la scratch list locale non deve poter
//    bloccare il build di nessuno.
{
  const { code } = run({ "lib/site.ts": SITE_OK, "notes.md": 'still thinking about "CEO of Noesia"\n' }, { track: false });
  assert.equal(code, 0, "un file non tracciato non deve far fallire il build");
  PASS("untracked files are ignored");
}

// 9. Il guard deve sapere quale e' il brand attuale. Se lib/site.ts smette di
//    nominarlo, il check e' semplicemente sbagliato: fallisce invece di passare
//    in silenzio controllando la stringa sbagliata.
{
  const { code, stderr } = run({ "lib/site.ts": 'export const companyUrl = "https://knowcomputer.com";\n' });
  assert.equal(code, 1, "una configurazione di brand non allineata deve fallire");
  assert.match(stderr, /the brand guard is stale/);
  PASS("a stale current-brand declaration fails instead of passing quietly");
}

// 10. L'elenco di file esentati non deve crescere. Il modo tipico in cui un
//     gate viene neutralizzato non e' un bug: e' aggiungere un file all'elenco
//     delle eccezioni quando segnala un falso positivo. La lista resta quindi
//     chiusa, e i due file che la compongono sono gli unici che DEVONO citare
//     le frasi vietate: questo per vietarle, quello per testarle.
{
  const source = readFileSync(guard, "utf8");
  const block = source.match(/const owners = new Set\(\[([^\]]*)\]/);
  assert.ok(block, "check-brand.mjs deve dichiarare gli esentati in una lista owners esplicita");
  const exempt = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(
    exempt,
    ["scripts/check-brand.mjs", "scripts/test-brand.mjs"],
    "la lista degli esentati deve contenere solo i due file che citano le frasi vietate di proposito",
  );
  PASS("the exemption list is closed: only the two files that must name the claims");
}

// 11. Gli host. Ogni host che porta un nome del brand deve essere esattamente
//     quello dichiarato: il dominio corrente per Know Computer, l'host
//     storico esatto per i link che la storia contiene. Il resto sono URL ben
//     formati che non portano da nessuna parte e che nessun altro check nota.
{
  const bad = [
    ["www in front", "https://www.knowcomputer.com", /names the host "www\.knowcomputer\.com"/],
    ["wrong tld", "https://knowcomputer.io", /names the host "knowcomputer\.io"/],
    ["suffix trap", "https://knowcomputer.com.evil.com", /names the host "knowcomputer\.com\.evil\.com"/],
    ["plain http", "http://knowcomputer.com", /instead of https/],
    ["credentials in the url", "https://user:pw@knowcomputer.com", /credentials/],
    ["historical host with www", "https://www.withnoesia.com", /names the host "www\.withnoesia\.com"/],
    ["historical host wrong tld", "https://withnoesia.io", /names the host "withnoesia\.io"/],
    ["historical host no 'with' prefix", "https://noesia.com", /names the host "noesia\.com"/],
    ["historical host plain http", "http://withnoesia.com", /instead of https/],
  ];
  for (const [label, url, expected] of bad) {
    const { code, stderr } = run({ "lib/site.ts": SITE_OK, "app/page.tsx": `const u = "${url}";\n` });
    assert.equal(code, 1, `${label}: il guard deve fallire su "${url}"`);
    assert.match(stderr, expected, `${label}: messaggio inatteso`);
    PASS(`the guard rejects a wrong brand host (${label})`);
  }

  // Le forme che invece sono legittime non devono mai far fallire niente: un
  // gate che urlizza il traffico legittimo viene spento al primo falso positivo.
  const good = [
    ["current https url", 'const u = "https://knowcomputer.com";'],
    ["trailing slash", 'const u = "https://knowcomputer.com/";'],
    ["current contact address", 'const u = "m@knowcomputer.com";'],
    ["historical link in an article", 'const u = "https://withnoesia.com";'],
    ["partner address", 'const u = "g@withnoesia.com";'],
    ["bare current host in a caption", 'const caption = "knowcomputer.com";'],
    ["bare historical host in a caption", 'const caption = "withnoesia.com";'],
    ["unrelated host", 'const u = "https://mattiaciuni.com/agent";'],
    ["a file name", 'const s = "gen-cards.mjs";'],
  ];
  for (const [label, line] of good) {
    const { code, stderr } = run({ "lib/site.ts": SITE_OK, "app/page.tsx": `${line}\n` });
    assert.equal(code, 0, `${label}: non deve far fallire il build\n${stderr}`);
  }
  PASS("the guard accepts https, emails, bare hosts in copy, historical links and unrelated domains");
}

// 12. La dichiarazione in lib/site.ts è la fonte della verita', quindi viene
//     confrontata con current.domain e non solo cercata.
{
  const wrong = run({ "lib/site.ts": SITE_OK.replace("https://knowcomputer.com", "https://knowcomputer.io") });
  assert.equal(wrong.code, 1, "companyUrl deve combaciare con il dominio dichiarato");
  assert.match(wrong.stderr, /lib\/site\.ts companyUrl: points to "knowcomputer\.io"/);
  PASS("a companyUrl that disagrees with the declared domain fails");

  const insecure = run({ "lib/site.ts": SITE_OK.replace("https://knowcomputer.com", "http://knowcomputer.com") });
  assert.equal(insecure.code, 1, "companyUrl non può essere http");
  PASS("an insecure companyUrl fails");

  const missing = run({
    "lib/site.ts": 'export const role = "Founder & CEO at Know Computer";\nexport const domain = "knowcomputer.com";\n',
  });
  assert.equal(missing.code, 1, "l'assenza di companyUrl deve fallire, non passare in silenzio");
  assert.match(missing.stderr, /declares no companyUrl/);
  PASS("a missing companyUrl fails instead of passing quietly");
}

// 13. Il pannello pubblica impostazioni che sovrascrivono il default: un
//     override rimasto indietro durante un rebrand silenzierebbe il link.
{
  const wrong = run({ "lib/site.ts": SITE_OK, "content/cms/settings/site.json": JSON.stringify({ companyUrl: "https://ceilya.com" }) });
  assert.equal(wrong.code, 1, "un override del pannello con un dominio vecchio deve fallire");
  assert.match(wrong.stderr, /site\.json companyUrl/);
  PASS("a stale panel override fails the build");

  const right = run({ "lib/site.ts": SITE_OK, "content/cms/settings/site.json": JSON.stringify({ companyUrl: "https://knowcomputer.com" }) });
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

// 14. Le sorgenti delle card cuciscono l'identita' in artefatti che questo
//     sweep non legge mai: un PNG ha un byte NUL e viene saltato, i public/*.md
//     che gen-cards emette sono esclusi come derivati. Quindi, in quei soli
//     file, il nome vecchio vietato e' nome vecchio e basta: niente frase di
//     identita' corrente, niente contesto. E' la regola che avrebbe fermato
//     "Founder & CEO at Payle" disegnato nella card della home.
{
  const card = run({
    "lib/site.ts": SITE_OK,
    "scripts/og.ps1": '$g.DrawString("Build with Noesia - Careers", $f, $b, 230, 604);\n',
  });
  assert.equal(card.code, 1, "lo script delle card deve fallire sul nome vecchio, anche senza frase di identita'");
  assert.match(card.stderr, /scripts\/og\.ps1:1: the card script must not name the retired brand "Noesia"/);
  PASS("the card script fails on a bare retired name, with no identity phrase required");

  const docs = run({ "lib/site.ts": SITE_OK, "design/README.md": "| `og.png` | card della home di Payle |\n" });
  assert.equal(docs.code, 1, "i design docs devono fallire sul nome vecchio");
  assert.match(docs.stderr, /design\/README\.md:1: the design docs must not name the retired brand "Payle"/);
  PASS("the design docs fail on a bare retired name");

  const source = run({ "lib/site.ts": SITE_OK, "design/Vector.svg": '<text>withnoesia</text>\n' });
  assert.equal(source.code, 1, "un design source deve fallire sul nome vecchio");
  assert.match(source.stderr, /design\/Vector\.svg:1/);
  PASS("a design source fails on a bare retired name");

  const elsewhere = run({ "lib/site.ts": SITE_OK, "lib/posts.ts": 'const history = "Build with Noesia - Careers";\n' });
  assert.equal(elsewhere.code, 0, "altrove il nome vecchio resta storia pubblicabile\n" + elsewhere.stderr);
  PASS("the bare-name ban is scoped to card sources: the same string in history passes");
}

console.log("brand: the gate fails on a stale identity claim or a wrong brand host, keeps history publishable, skips derived files, binaries and untracked files");
console.log("brand: i contratti sono verificati offline; il comportamento su Cloudflare Pages resta UNVERIFIED finche' non si mergia e non si guarda il build");
