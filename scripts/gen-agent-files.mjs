// I documenti di scoperta per gli agenti, generati da fonti vere.
//
//   /.well-known/api-catalog            linkset RFC 9727: cosa c'e' di leggibile da una macchina
//   /.well-known/oauth-protected-resource  RFC 9728: il sito e' una risorsa pubblica, senza issuer
//   /.well-known/agent-skills/index.json indice delle skill, con il digest di ogni artefatto
//   /.well-known/agent-skills/<name>/SKILL.md  la skill (copia dell'originale in agent-skills/)
//
// Regola, la stessa del resto del sito: si pubblica solo quello che esiste. Il
// linkset nomina due documenti che rispondono 200, l'indice nomina una skill il
// cui file e' pubblicato accanto, e il digest e' calcolato **sugli stessi byte**
// che finiscono in out/ e public/ (se non combaciasse, un agente scaricherebbe
// un artefatto che non e' quello dichiarato).
//
// Le fonti stanno in `agent-skills/<name>/SKILL.md` (a mano, come gli altri
// master in root: `Vector.svg`, `sfondo.svg`). L'indirizzo esce da `lib/site.ts`,
// come per sitemap e canonical.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const baseDir = dirname(fileURLToPath(import.meta.url));
const root = join(baseDir, "..");
const outDir = join(root, "out");
const pubDir = join(root, "public");
const srcDir = join(root, "agent-skills");

// Stesso schema di gen-cards.mjs: si scrive in out/ (produzione) e in public/
// (cosi' `next dev` li serve). Se out/ non c'e', la build non e' ancora girata.
if (!existsSync(outDir)) {
  console.log("agent files: out/ non presente (build non ancora eseguito) - niente da fare");
  process.exit(0);
}

// Il dominio non si riscrive qui e non si indovina dal sorgente: si legge
// dall'export appena costruito, dal `canonical` che la home dichiara di sé. Così
// questi file seguono `NEXT_PUBLIC_SITE_URL` come tutto il resto (sitemap,
// canonical, JSON-LD) invece di avere una seconda verità da tenere allineata.
const homeHtml = readFileSync(join(outDir, "index.html"), "utf8");
const base = (homeHtml.match(/<link rel="canonical" href="([^"]+)"/)?.[1] || "").replace(
  /\/$/,
  "",
);
if (!/^https?:\/\//.test(base)) {
  console.error("agent files: l'export non dichiara un `canonical` assoluto: niente da generare");
  process.exit(1);
}

const write = (rel, body) => {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body, "utf8");
  for (const dir of [outDir, pubDir]) {
    const dest = join(dir, ...rel.split("/"));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
  }
  return buf;
};

// --- il linkset -------------------------------------------------------------
// RFC 9727 chiede `anchor` + `service-desc` / `service-doc`. Qui l'ancora e' il
// sito: non c'e' un'API, e i due documenti che lo descrivono per una macchina
// sono llms.txt (descrizione) e la card markdown della home (documentazione).
// Nessun `status`: non esiste un endpoint di salute da dichiarare.
const catalog = {
  linkset: [
    {
      anchor: base + "/",
      "service-desc": [
        {
          href: base + "/llms.txt",
          type: "text/plain",
          title: "The site in one file, for language models",
        },
      ],
      "service-doc": [
        {
          href: base + "/index.md",
          type: "text/markdown",
          title: "The site as markdown",
        },
      ],
    },
  ],
};
write(".well-known/api-catalog", JSON.stringify(catalog, null, 2) + "\n");

// --- ARD / ai-catalog -------------------------------------------------------
// Il sito non ospita un server MCP, un agente A2A o un'API autenticata. Il
// catalogo quindi descrive solo risorse pubbliche che esistono davvero: le card
// markdown curate e la skill pubblicata. Non si dichiarano endpoint finti.
const hostname = new URL(base).hostname;
const ard = {
  specVersion: "1.0",
  host: {
    displayName: "Mattia Ciuni",
    identifier: `did:web:${hostname}`,
  },
  entries: [
    {
      identifier: `urn:air:${hostname}:content:thoughts`,
      displayName: "Mattia Ciuni Thoughts",
      type: "text/markdown",
      url: `${base}/thoughts.md`,
      representativeQueries: [
        "What is Mattia Ciuni building for AI agent payments?",
        "Find Mattia's essays about Payle and agentic commerce",
      ],
    },
    {
      identifier: `urn:air:${hostname}:content:notes`,
      displayName: "Mattia Ciuni Notes",
      type: "text/markdown",
      url: `${base}/notes.md`,
      representativeQueries: [
        "Find short notes about AI agents and payment infrastructure",
        "What does Mattia write about reliable agentic systems?",
      ],
    },
    {
      identifier: `urn:air:${hostname}:skill:read-and-cite`,
      displayName: "Read and cite Mattia Ciuni",
      type: "text/markdown",
      url: `${base}/.well-known/agent-skills/read-and-cite-mattia-ciuni/SKILL.md`,
      representativeQueries: [
        "How should an agent read and cite this website?",
        "What sources should an agent use when answering about Mattia Ciuni?",
      ],
    },
  ],
};
write(".well-known/ai-catalog.json", JSON.stringify(ard, null, 2) + "\n");

// --- OAuth protected resource ------------------------------------------------
// RFC 9728, e la regola del sito vale anche qui: si pubblica quello che esiste.
// Questa origine non ha un authorization server e non accetta token. Il documento
// lo dice nel modo piu' leggibile da una macchina: `authorization_servers`,
// `scopes_supported` e `bearer_methods_supported` sono liste **vuote**, che e' una
// risposta (nessun issuer puo' emettere token per questa risorsa), invece di un
// campo assente, che un agente leggerebbe come "forse guarda altrove".
//
// I due documenti che un authorization server pubblicherebbe —
// `/.well-known/oauth-authorization-server` e `/.well-known/openid-configuration` —
// restano volutamente assenti: riempirli con un `issuer` inventato significherebbe
// dichiarare endpoint che non esistono, il guasto peggiore per chi ci crede.
const protectedResource = {
  resource: base + "/",
  authorization_servers: [],
  scopes_supported: [],
  bearer_methods_supported: [],
  resource_documentation: base + "/auth.md",
  resource_policy_uri: base + "/terms/",
};
write(".well-known/oauth-protected-resource", JSON.stringify(protectedResource, null, 2) + "\n");

// --- le skill ---------------------------------------------------------------
// Solo artefatti che esistono: la cartella `agent-skills/` in root e' la fonte,
// e ogni voce dell'indice porta il digest del file pubblicato.
const skills = existsSync(srcDir)
  ? readdirSync(srcDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(join(srcDir, e.name, "SKILL.md")))
      .map((e) => e.name)
      .sort()
  : [];

if (skills.length === 0) {
  console.error("agent files: nessuna skill in agent-skills/<name>/SKILL.md");
  process.exit(1);
}

const index = {
  $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
  skills: skills.map((name) => {
    // Il dominio non si scrive a mano dentro la skill: `{{SITE}}` viene
    // sostituito con l'indirizzo dichiarato dall'export. Era l'unico punto in cui
    // il vecchio dominio poteva sopravvivere a un cambio di host - e infatti era
    // sopravvissuto: la skill nominava `mattia-ciuni.xyz`, che non esiste in DNS,
    // mentre il sito rispondeva altrove. Il digest si calcola **dopo** la
    // sostituzione, sui byte che finiscono pubblicati.
    const source = readFileSync(join(srcDir, name, "SKILL.md"), "utf8");
    const rel = `.well-known/agent-skills/${name}/SKILL.md`;
    const written = write(rel, Buffer.from(source.replaceAll("{{SITE}}", base), "utf8"));
    // `description`: il primo paragrafo del documento, che e' il riassunto
    // scritto a mano per l'agente - non una riga inventata dall'indice.
    const description = (written
      .toString("utf8")
      .replace(/^#\s.*$/m, "")
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .find((s) => s && !s.startsWith("#")) || "")
      // Una `description` e' testo, non markdown: via l'enfasi e le virgolette
      // inverse, che in un campo JSON si leggono come caratteri.
      .replace(/\*\*/g, "")
      .replace(/`/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 300);
    return {
      name,
      type: "skill-md",
      description,
      url: `${base}/${rel}`,
      digest: "sha256:" + createHash("sha256").update(written).digest("hex"),
    };
  }),
};

// L'indice si riscrive ogni volta: se una skill sparisce da `agent-skills/`,
// sparisce anche da qui.
write(".well-known/agent-skills/index.json", JSON.stringify(index, null, 2) + "\n");

console.log(
  `agent files: api-catalog + oauth-protected-resource + ${skills.length} skill (${skills.join(", ")}) in out/ + public/`,
);
