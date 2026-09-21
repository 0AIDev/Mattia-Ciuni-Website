// Review dei feedback: legge la coda in KV (binding FEEDBACK) e la pubblica.
//
//   node scripts/review-feedback.mjs list               # i pending, dal più recente
//   node scripts/review-feedback.mjs show <id>          # il testo completo di un feedback
//   node scripts/review-feedback.mjs publish <id>       # marca pubblicato e scrive il registro
//   node scripts/review-feedback.mjs reject <id>        # scarta, con motivo opzionale
//
// Configurazione: variabili d'ambiente CLOUDFLARE_API_TOKEN e
// CLOUDFLARE_ACCOUNT_ID, più il namespace id (lo stampa `setup`).
//   node scripts/review-feedback.mjs setup               # crea il namespace, se manca
//
// Pubblicare qui non mette la voce online: il post Feedback lo scrivi tu nel
// registro (lib/feedback.ts), perché un contributo pubblicato è un pezzo
// editoriale, non un import. Questo comando fa due cose vere: segna la voce
// come published in KV e genera il boilerplate del registro da incollare.

const [command, id, ...rest] = process.argv.slice(2);

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const NAMESPACE = process.env.FEEDBACK_KV_ID || "";

function die(message) {
  console.error(message);
  process.exit(1);
}

if (!command || command === "help") {
  console.log("usage: node scripts/review-feedback.mjs <setup|list|show|publish|reject> [id] [reason]");
  process.exit(command ? 0 : 1);
}

if (!ACCOUNT_ID || !API_TOKEN) {
  die("Servono CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN nell'ambiente.");
}

const api = async (path, init = {}) => {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.body ? {} : {}),
    },
  });
  const payload = await response.json();
  if (!payload.success) die(`API error: ${JSON.stringify(payload.errors)}`);
  return payload.result;
};

async function namespaceId() {
  if (NAMESPACE) return NAMESPACE;
  const namespaces = await api(`/accounts/${ACCOUNT_ID}/storage/kv/namespaces`);
  const found = namespaces.find((n) => n.title.includes("FEEDBACK"));
  if (!found) die("Namespace FEEDBACK non trovato: lancia prima `node scripts/review-feedback.mjs setup`.");
  return found.id;
}

const kv = {
  async get(ns, key) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${ns}/values/${encodeURIComponent(key)}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` } },
    );
    if (response.status === 404) return null;
    if (!response.ok) die(`KV read failed: ${response.status}`);
    return response.text();
  },
  async put(ns, key, value) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${ns}/values/${encodeURIComponent(key)}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "text/plain" },
        body: value,
      },
    );
    if (!response.ok) die(`KV write failed: ${response.status}`);
  },
};

function parse(record) {
  try { return JSON.parse(record); } catch { return null; }
}

const INDEX_KEY = "fb:index";

async function readQueue(ns) {
  const raw = await kv.get(ns, INDEX_KEY);
  return (raw || "").split("\n").filter(Boolean);
}

async function writeQueue(ns, ids) {
  await kv.put(ns, INDEX_KEY, ids.join("\n"));
}

if (command === "setup") {
  const title = `mattiaciuni-website-FEEDBACK`;
  const existing = (await api(`/accounts/${ACCOUNT_ID}/storage/kv/namespaces`)).find((n) => n.title === title);
  const ns = existing || (await api(`/accounts/${ACCOUNT_ID}/storage/kv/namespaces`, { method: "POST", body: JSON.stringify({ title }) }));
  console.log(`namespace: ${ns.title} -> ${ns.id}`);
  console.log(`export FEEDBACK_KV_ID=${ns.id}`);
  console.log("Collega questo namespace al progetto Pages come binding `FEEDBACK` (dashboard o wrangler).");
  process.exit(0);
}

const ns = await namespaceId();

if (command === "list") {
  const ids = await readQueue(ns);
  if (!ids.length) { console.log("(coda vuota)"); process.exit(0); }
  for (const key of ids) {
    const record = parse((await kv.get(ns, key)) || "");
    if (!record) { console.log(`${key}  (record illeggibile)`); continue; }
    const who = record.name || "anonymous";
    const mail = record.email ? " (has email)" : "";
    console.log(`${record.status === "pending_review" ? "[pending]" : `[${record.status}]`}  ${key}  ${who}${mail}  ${new Date(record.submitted_at).toLocaleString()}`);
    console.log(`          ${record.message.slice(0, 90).replace(/\s+/g, " ")}${record.message.length > 90 ? "..." : ""}`);
  }
  process.exit(0);
}

if (!id) die("Manca l'id: `node scripts/review-feedback.mjs <show|publish|reject> <id>`");

const raw = await kv.get(ns, id);
const record = parse(raw || "");
if (!record) die(`Record non trovato o illeggibile: ${id}`);

if (command === "show") {
  console.log(JSON.stringify(record, null, 2));
  process.exit(0);
}

if (command === "publish") {
  record.status = "published";
  record.published_at = new Date().toISOString();
  await kv.put(ns, id, JSON.stringify(record));
  const ids = (await readQueue(ns)).filter((k) => k !== id);
  await writeQueue(ns, ids);
  const author = record.name || "A.";
  const boilerplate = [
    "  {",
    `    slug: "da-definire",`,
    `    title: "Il titolo del post",`,
    `    author: ${JSON.stringify(author)},`,
    `    description: "${record.message.slice(0, 120).replace(/"/g, '\\"')}...",`,
    `    date: "${new Date().toISOString().slice(0, 10)}",`,
    `    keywords: [],`,
    "    content: [",
    `      { type: "quote", text: ${JSON.stringify(record.message)} },`,
    "    ],",
    "  },",
  ].join("\n");
  console.log(`marcato published: ${id}`);
  console.log("\nBoilerplate per lib/feedback.ts (da completare a mano):\n");
  console.log(boilerplate);
  process.exit(0);
}

if (command === "reject") {
  const reason = rest.join(" ") || "not published";
  record.status = "rejected";
  record.reject_reason = reason.slice(0, 200);
  await kv.put(ns, id, JSON.stringify(record));
  const ids = (await readQueue(ns)).filter((k) => k !== id);
  await writeQueue(ns, ids);
  console.log(`scartato: ${id} (${record.reject_reason})`);
  process.exit(0);
}

die(`Comando sconosciuto: ${command}`);
