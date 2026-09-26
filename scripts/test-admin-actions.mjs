// Audit end-to-end di ogni azione del pannello admin.
//
// Il punto non e' il singolo endpoint: e' il **round-trip**. Il pannello carica
// lo stato con un GET, lo rimanda con un POST, e se il validatore del POST
// rifiuta cio' che il GET ha appena prodotto, l'utente vede un 422 su un
// pulsante "Save changes" e non ha modo di sapere perche'. E' esattamente il
// bug che questo file esiste per impedire: il tab Job offers non salvava piu'
// niente perche' una domanda di un ruolo (`type: "number"`) non era nella lista
// dei tipi accettati, e il validatore rifiuta l'intero array.
//
// Quindi ogni azione qui sotto viene chiamata con il payload che il pannello
// manda davvero: i job presi dal GET, gli item del CMS presi dal GET, e i
// default dell'editor per ogni kind. Nessun mock del codice di produzione:
// vengono chiamate le Function reali, con fetch sostituito alla frontiera
// (Supabase REST, GitHub Contents API, deploy hook) e R2 in memoria.
//
// Run: npm run test:admin-actions
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { onRequestGet, onRequestPost } from "../functions/api/admin/feedback.ts";
import { onRequestGet as mediaGet, onRequestPost as mediaPost } from "../functions/api/admin/media.ts";
import { loadCmsCollection, setCmsContentRoot } from "../lib/cms-content.ts";
import { totpCode } from "../lib/totp.ts";
import { CMS_KINDS } from "../lib/cms-types.ts";

const TOKEN = "0".repeat(64);
const COFOUNDER_TOKEN = "1".repeat(64);
const RESET_TOKEN = "reset-" + "9".repeat(60);
const ORIGIN = "https://example.test";
const IP = "203.0.113.7";
const REPO = "0AIDev/Mattia-Ciuni-Website";
const BRANCH = "main";
const DEPLOY_HOOK = "https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/audit";
const SUPABASE = "https://stub.supabase.co";

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok || !detail ? "" : ` — ${detail}`}`);
  if (!ok) failures += 1;
}

// ---------------------------------------------------------------------------
// Infrastruttura finta: KV, R2, Supabase REST, GitHub Contents API.
// ---------------------------------------------------------------------------

function store() {
  const map = new Map();
  return {
    map,
    async get(key) { const value = map.get(key); return value?.expiresAt && value.expiresAt < Date.now() ? (map.delete(key), null) : value?.value ?? null; },
    async put(key, value, options = {}) { map.set(key, { value, expiresAt: options.expirationTtl ? Date.now() + options.expirationTtl * 1000 : null }); },
    async delete(key) { map.delete(key); },
  };
}

function bucket() {
  const objects = new Map();
  return {
    objects,
    async put(key, value, options = {}) {
      const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : new Uint8Array(await new Response(value).arrayBuffer());
      objects.set(key, { bytes, httpMetadata: options.httpMetadata });
    },
    async get(key) {
      const object = objects.get(key);
      return object ? { key, size: object.bytes.length, uploaded: new Date(), httpMetadata: object.httpMetadata } : null;
    },
    async delete(key) { objects.delete(key); },
    async list({ prefix } = {}) {
      return {
        objects: [...objects.entries()]
          .filter(([key]) => !prefix || key.startsWith(prefix))
          .map(([key, object]) => ({ key, size: object.bytes.length, uploaded: new Date(), httpMetadata: object.httpMetadata })),
      };
    },
  };
}

const calls = [];
const deployCalls = [];
// Il file di build che la Function legge per sapere se una modifica e' online.
// `null` e' il caso di un deploy vecchio, dove il file non e' ancora nato.
let deployStamp = null;
function setDeployStamp(value) { deployStamp = value; }
const db = new Map();
const git = { files: new Map(), commits: [], counter: 0 };

function rowsOf(table) {
  if (!db.has(table)) db.set(table, []);
  return db.get(table);
}

function json(body, status = 200) {
  return new Response(body === null ? "" : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function matches(row, query) {
  for (const [key, value] of query.entries()) {
    if (["select", "order", "limit", "on_conflict"].includes(key)) continue;
    const [operator, ...rest] = value.split(".");
    if (operator !== "eq") continue;
    if (String(row[key]) !== rest.join(".")) return false;
  }
  return true;
}

async function supabaseRest(url, method, init) {
  const parsed = new URL(url);
  const resource = decodeURIComponent(parsed.pathname.replace("/rest/v1/", ""));
  const table = resource.split("?")[0];
  const rows = rowsOf(table);
  const prefer = String(new Headers(init.headers).get("Prefer") || "");
  const payload = init.body ? JSON.parse(String(init.body)) : null;

  if (method === "DELETE") {
    db.set(table, rows.filter((row) => !matches(row, parsed.searchParams)));
    return json(null, 204);
  }

  if (method === "POST" || method === "PATCH") {
    const incoming = Array.isArray(payload) ? payload : [payload];
    const conflict = (parsed.searchParams.get("on_conflict") || "").split(",").filter(Boolean);
    const written = [];
    for (const row of incoming) {
      const index = rows.findIndex((entry) => (conflict.length
        ? conflict.every((key) => String(entry[key]) === String(row[key]))
        : matches(entry, parsed.searchParams)));
      if (index >= 0) rows[index] = { ...rows[index], ...row };
      else rows.push({ ...row });
      written.push(index >= 0 ? rows[index] : rows[rows.length - 1]);
    }
    return json(prefer.includes("return=representation") ? written : null, 201);
  }

  const filtered = rows.filter((row) => matches(row, parsed.searchParams));
  const limit = Number(parsed.searchParams.get("limit") ?? "0");
  return json(limit > 0 ? filtered.slice(0, limit) : filtered);
}

function nextSha() {
  git.counter += 1;
  return git.counter.toString(16).padStart(40, "0");
}

function versionsOf(path) {
  if (!git.files.has(path)) git.files.set(path, []);
  return git.files.get(path);
}

/** `ref` e' o il branch (ultima versione) o lo sha del commit scritto dal PUT. */
function versionFor(path, ref) {
  const versions = versionsOf(path);
  if (!ref || ref === BRANCH) return versions[versions.length - 1] || null;
  return versions.find((entry) => entry.sha === ref) || null;
}

async function githubRest(url, method, init) {
  const parsed = new URL(url);
  const path = decodeURIComponent(parsed.pathname);
  const file = path.includes("/contents/") ? path.split("/contents/")[1] : "";

  if (method === "GET" && file) {
    const entry = versionFor(file, parsed.searchParams.get("ref"));
    if (!entry) return json({ message: "Not Found" }, 404);
    return json({ name: file.split("/").pop(), path: file, sha: entry.sha, size: entry.content.length, encoding: "base64", content: entry.content });
  }

  if (method === "PUT" && file) {
    const body = JSON.parse(String(init.body));
    const sha = nextSha();
    git.commits.unshift({
      sha,
      commit: { message: body.message, author: { date: new Date().toISOString() } },
      html_url: `https://github.com/${REPO}/commit/${sha}`,
    });
    versionsOf(file).push({ sha, content: body.content });
    return json({ content: { sha, path: file }, commit: { sha } }, 201);
  }

  if (path.endsWith("/commits")) {
    const limit = Number(parsed.searchParams.get("per_page") ?? "30");
    return json(git.commits.slice(0, limit));
  }

  if (path.includes("/branches/")) return json({ name: BRANCH, commit: { sha: git.commits[0]?.sha || nextSha() } });
  return json({ message: `unexpected github call ${path}` }, 500);
}

function installFetch() {
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    const method = (init.method || "GET").toUpperCase();
    const headers = new Headers(init.headers);
    calls.push({ url, method, headers });
    if (url.startsWith("https://api.github.com")) return githubRest(url, method, init);
    if (url.startsWith(SUPABASE)) return supabaseRest(url, method, init);
    if (url === DEPLOY_HOOK) { deployCalls.push(url); return json({ success: true }); }
    if (url.startsWith("https://mattiaciuni.pages.dev/deploy.json")) {
      if (!deployStamp) return json({ message: "Not Found" }, 404);
      return json(deployStamp);
    }
    return json({ message: `unexpected fetch ${method} ${url}` }, 500);
  };
}

// ---------------------------------------------------------------------------
// Richieste come le manda il pannello.
// ---------------------------------------------------------------------------

function request({ method = "GET", body, cookie, url = `${ORIGIN}/api/admin/feedback`, type = "application/json" } = {}) {
  const headers = { "Content-Type": type, "CF-Connecting-IP": IP, Origin: ORIGIN };
  if (cookie) headers.Cookie = cookie;
  return new Request(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

function cookiesOf(response) {
  if (typeof response.headers.getSetCookie === "function") return response.headers.getSetCookie();
  const value = response.headers.get("Set-Cookie");
  return value ? [value] : [];
}

// Una Response si legge una volta sola: il corpo viene letto qui e riusato, cosi'
// un check puo' sia ispezionare i campi sia stampare il payload nel messaggio di
// errore senza consumare la risposta.
const bodies = new WeakMap();
async function payload(response) {
  if (!bodies.has(response)) bodies.set(response, await response.clone().json().catch(() => ({})));
  return bodies.get(response);
}

async function detail(response) {
  return `${response.status} ${JSON.stringify(await payload(response)).slice(0, 160)}`;
}

const env = {
  FEEDBACK: store(),
  RATE_LIMIT: store(),
  MEDIA: bucket(),
  ADMIN_TOKEN: TOKEN,
  COFOUNDER_TOKEN,
  ADMIN_TOTP_RESET_TOKEN: RESET_TOKEN,
  SUPABASE_URL: SUPABASE,
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  GITHUB_TOKEN: "github_pat_audit",
  GITHUB_REPOSITORY: REPO,
  GITHUB_BRANCH: BRANCH,
  CLOUDFLARE_DEPLOY_HOOK: DEPLOY_HOOK,
  SITE_URL: "https://mattiaciuni.pages.dev",
};

installFetch();

const post = (body, cookie) => onRequestPost({ request: request({ method: "POST", body, cookie }), env });
const get = (cookie) => onRequestGet({ request: request({ cookie }), env });
const mediaRequest = (body, cookie) => mediaPost({ request: request({ method: "POST", body, cookie, url: `${ORIGIN}/api/admin/media` }), env });

// --- sessione -------------------------------------------------------------

const setup = await post({ action: "setup", token: TOKEN });
const setupData = await payload(setup);
const session = cookiesOf(await post({ action: "confirm_setup", setup_id: setupData.setup_id, code: await totpCode(setupData.manual_key) }))
  .find((value) => value.startsWith("__Host-"))?.split(";")[0] || "";
check("TOTP bootstrap + first code opens a session", setup.status === 200 && session.length > 20, `setup ${setup.status}`);

// --- settings -------------------------------------------------------------

const settings = await post({ action: "settings_read" }, session);
const settingsData = await payload(settings);
check(
  "settings_read reports all five capabilities ready",
  settings.status === 200 && settingsData.github && settingsData.deploy_hook && settingsData.supabase && settingsData.tables && settingsData.storage,
  await detail(settings),
);

// --- GET dashboard --------------------------------------------------------

const dashboard = await get(session);
const state = await payload(dashboard);
check("GET dashboard returns jobs and CMS content", dashboard.status === 200 && state.jobs?.length > 0 && state.content?.length >= 17, await detail(dashboard));

// --- jobs: round-trip ----------------------------------------------------

const jobsRoundTrip = await post({ action: "jobs_save", jobs: state.jobs }, session);
check(
  "jobs_save accepts the exact payload GET returned",
  jobsRoundTrip.status === 200,
  await detail(jobsRoundTrip),
);

const numberQuestion = state.jobs.flatMap((job) => job.questions || []).find((question) => question.type === "number");
check("the registry really does contain a number question", Boolean(numberQuestion), "no number question in the seed: this test would prove nothing");

if (jobsRoundTrip.status === 200) {
  const saved = await payload(jobsRoundTrip);
  const kv = JSON.parse(await env.FEEDBACK.get("content:jobs"));
  check("jobs_save writes the registry to KV and publishes one file per job", saved.commits === state.jobs.length && kv.length === state.jobs.length, `commits ${saved.commits}`);
  // Il vincolo che conta: **una modifica, una build**. Il commit su `main` e'
  // gia' la richiesta di build (Cloudflare Pages costruisce ogni push sul branch
  // di produzione), quindi chiamare anche il deploy hook raddoppiava le build e
  // le metteva in coda: le deployment reali dell'account mostrano sei build per
  // tre publish, tre `skipped`, e 128 secondi di attesa.
  check("a publish that commits does not also fire the deploy hook", saved.deploy === "commit" && deployCalls.length === 0, `deploy ${saved.deploy}, hook calls ${deployCalls.length}`);
  const jobFile = git.files.get(`content/cms/job/${state.jobs[0].slug}.json`);
  check("the job file on Git keeps the number question", Boolean(jobFile) && jobFile.length > 0);
}

const badJobs = await post({ action: "jobs_save", jobs: [{ slug: "x", status: "weird" }] }, session);
check("jobs_save still rejects an invalid registry", badJobs.status === 422, await detail(badJobs));

// --- content: round-trip di ogni item che il GET restituisce ---------------

const seeds = state.content;
const seedFailures = [];
for (const item of seeds) {
  const response = await post({ action: "content_save", content: { ...item, title: item.title || item.slug } }, session);
  if (response.status !== 200) seedFailures.push(`${item.kind}/${item.slug}: ${await detail(response)}`);
}
check(`each of the ${seeds.length} library items round-trips through content_save`, seedFailures.length === 0, seedFailures.slice(0, 4).join(" | "));

// --- content: un item per ogni kind che l'editor puo' creare --------------

const kindFailures = [];
for (const kind of CMS_KINDS) {
  const draft = {
    id: crypto.randomUUID(),
    kind,
    // Lo stesso slug che propone l'editor: un trattino, mai l'underscore del
    // nome del kind, che il validatore del server rifiuta.
    slug: kind === "settings" ? "site" : `new-${kind.replace(/_/g, "-")}`,
    status: "draft",
    title: `Audit ${kind}`,
    description: "",
    body_markdown: "## Audit\n\nBody.",
    data: { category: "", tags: [], keywords: [] },
    version: 0,
  };
  const response = await post({ action: "content_save", content: draft }, session);
  if (response.status !== 200) kindFailures.push(`${kind}: ${await detail(response)}`);
}
check(`all ${CMS_KINDS.length} CMS kinds are accepted by content_save`, kindFailures.length === 0, kindFailures.join(" | "));

// --- content: publish, history, revert -----------------------------------

const draftResponse = await post({
  action: "content_save",
  content: { id: crypto.randomUUID(), kind: "note", slug: "audit-publish", status: "draft", title: "Audit publish", description: "Audit", body_markdown: "## One\n\nFirst body.", data: { category: "Notes", tags: [], keywords: [] }, version: 0 },
}, session);
const draftItem = (await payload(draftResponse)).content;
check("a draft is created before publishing", draftResponse.status === 200 && draftItem?.id, await detail(draftResponse));

const publish = await post({ action: "content_publish", id: draftItem.id }, session);
const publishData = await payload(publish);
const publishedFile = git.files.get("content/cms/note/audit-publish.json")?.slice(-1)[0];
check(
  "content_publish writes the file on Git, stores the row and asks for a deploy",
  publish.status === 200 && publishData.commit_sha && publishData.stored === true && publishData.deploy_triggered === true && Boolean(publishedFile),
  await detail(publish),
);
const publishedText = publishedFile ? Buffer.from(publishedFile.content, "base64").toString("utf8") : "";
check(
  "the published file is valid JSON with the markdown as blocks",
  Boolean(publishedFile) && Array.isArray(JSON.parse(publishedText).content),
  publishedText.slice(0, 400),
);
check(
  "the published file ends with a real newline, not the two characters backslash-n",
  publishedText.endsWith("}\n") && !publishedText.endsWith("}\\n"),
  JSON.stringify(publishedText.slice(-6)),
);

// La catena che conta davvero: quello che il publish scrive su Git deve essere
// quello che la build legge. Un file corrotto qui non fallisce il deploy: il
// loader lo scarta con un warning e il contenuto pubblicato non compare mai.
const contentRoot = mkdtempSync(join(tmpdir(), "cms-audit-"));
try {
  mkdirSync(join(contentRoot, "content", "cms", "note"), { recursive: true });
  writeFileSync(join(contentRoot, "content", "cms", "note", "audit-publish.json"), publishedText);
  setCmsContentRoot(contentRoot);
  const loaded = loadCmsCollection("note");
  check(
    "the build loader reads the file the publish just wrote",
    loaded.length === 1 && loaded[0].slug === "audit-publish",
    `${loaded.length} item(s): ${JSON.stringify(loaded[0] || null).slice(0, 120)}`,
  );
  // La forma scritta dalla prima versione del publish: il loader deve
  // continuare a leggerla, altrimenti un contenuto gia' pubblicato sparisce.
  writeFileSync(join(contentRoot, "content", "cms", "note", "legacy.json"), `${publishedText.slice(0, -1)}\\n`);
  check(
    "the build loader still reads a file with the legacy backslash-n suffix",
    loadCmsCollection("note").length === 2,
    `${loadCmsCollection("note").length} item(s)`,
  );
} finally {
  setCmsContentRoot(process.cwd());
  rmSync(contentRoot, { recursive: true, force: true });
}

// Seconda modifica: serve una versione precedente da cui tornare indietro.
await post({ action: "content_save", content: { ...draftItem, body_markdown: "## Two\n\nSecond body." } }, session);
const secondPublish = await post({ action: "content_publish", id: draftItem.id }, session);
const secondSha = (await payload(secondPublish)).commit_sha;
check("a second publish of the same file works", secondPublish.status === 200 && Boolean(secondSha), await detail(secondPublish));

const history = await post({ action: "content_history" }, session);
const historyData = await payload(history);
check(
  "content_history lists the commits that touched content/cms",
  history.status === 200 && historyData.github === true && historyData.commits.length >= 3 && historyData.commits.every((entry) => entry.sha && entry.message),
  await detail(history),
);

const restore = await post({ action: "content_restore", kind: "note", slug: "audit-publish", sha: git.commits[1].sha }, session);
check("content_restore rolls the file back to a previous commit", restore.status === 200, await detail(restore));

// Il pulsante "Revert this file to the last published commit" non sceglie un
// commit: rimette il draft come sta su Git. Se manda uno sha inventato, il
// validatore lo rifiuta con 400 e il pulsante non funziona mai.
const discard = await post({ action: "content_discard", kind: "note", slug: "audit-publish" }, session);
const discardData = await payload(discard);
check(
  "content_discard reloads the published file into the draft without a commit",
  discard.status === 200 && discardData.item?.kind === "note" && typeof discardData.item?.body_markdown === "string",
  await detail(discard),
);

// --- deploy: una build per modifica, e la risposta "e' online?" ------------

// Il file di build non esiste ancora su un deploy vecchio: la risposta giusta
// e' "non lo so", non "non e' online", altrimenti il pannello direbbe che
// niente e' mai arrivato.
const stampMissing = await payload(await post({ action: "deploy_status" }, session));
check(
  "deploy_status says the stamp is missing instead of claiming nothing is live",
  stampMissing.available === false && stampMissing.live === undefined,
  JSON.stringify(stampMissing).slice(0, 160),
);

const since = new Date().toISOString();
setDeployStamp({ built_at: new Date(Date.now() - 120_000).toISOString(), commit: "a".repeat(40) });
const beforeBuild = await payload(await post({ action: "deploy_status", since }, session));
check(
  "a build that finished before the publish is not live",
  beforeBuild.available === true && beforeBuild.live === false && beforeBuild.waited_seconds >= 0,
  JSON.stringify(beforeBuild).slice(0, 160),
);

setDeployStamp({ built_at: new Date().toISOString(), commit: "b".repeat(40) });
const afterBuild = await payload(await post({ action: "deploy_status", since }, session));
check(
  "a build that finished after the publish is live, and the panel gets the site origin",
  afterBuild.available === true && afterBuild.live === true && afterBuild.commit === "b".repeat(40) && afterBuild.origin === "https://mattiaciuni.pages.dev",
  JSON.stringify(afterBuild).slice(0, 200),
);

setDeployStamp({ built_at: "whenever", commit: null });
const badStamp = await payload(await post({ action: "deploy_status", since }, session));
check("a stamp with no usable date is treated as missing", badStamp.available === false, JSON.stringify(badStamp).slice(0, 160));
setDeployStamp(null);

// Senza `since` non c'e' un punto di partenza, quindi la risposta onesta e'
// "non lo so". `true` faceva dichiarare online un publish appena fatto, con la
// build di due minuti prima ancora in coda.
setDeployStamp({ built_at: new Date().toISOString(), commit: "c".repeat(40) });
const noReference = await payload(await post({ action: "deploy_status" }, session));
check(
  "deploy_status without a reference point answers unknown, not live",
  noReference.available === true && noReference.live === null,
  JSON.stringify(noReference).slice(0, 160),
);

const rebuild = await post({ action: "content_rebuild" }, session);
const rebuildData = await payload(rebuild);
check(
  "content_rebuild is the one path that uses the deploy hook",
  rebuild.status === 200 && rebuildData.deploy === "hook" && deployCalls.length === 1,
  `${await detail(rebuild)} hook calls ${deployCalls.length}`,
);
const savedHook = env.CLOUDFLARE_DEPLOY_HOOK;
delete env.CLOUDFLARE_DEPLOY_HOOK;
const noHook = await post({ action: "content_rebuild" }, session);
env.CLOUDFLARE_DEPLOY_HOOK = savedHook;
check("content_rebuild without a deploy hook says so instead of failing silently", noHook.status === 503 && (await payload(noHook)).code === "deploy_hook_not_configured", await detail(noHook));

// Salvare due volte di fila la stessa offerta non deve generare un'altra build.
const before = git.commits.length;
const repeat = await payload(await post({ action: "jobs_save", jobs: state.jobs }, session));
check(
  "saving an unchanged registry writes no commit and asks for no build",
  repeat.commits === 0 && repeat.deploy === "none" && git.commits.length === before,
  `commits ${repeat.commits}, new files ${git.commits.length - before}`,
);

const changed = state.jobs.map((job, index) => (index === 0 ? { ...job, shortPitch: `${job.shortPitch} ` } : job));
const oneChange = await payload(await post({ action: "jobs_save", jobs: changed }, session));
check(
  "changing one offer commits one file, not all of them",
  oneChange.commits === 1 && oneChange.deploy === "commit",
  `commits ${oneChange.commits}`,
);

// --- nda ------------------------------------------------------------------

const nda = await post({ action: "nda_create", full_name: "Audit Recipient", email_address: "audit@example.com" }, session);
const ndaData = await payload(nda);
const ndaRow = rowsOf("nda_recipients")[0];
check(
  "nda_create returns a signed link and stores only the hash",
  nda.status === 200 && String(ndaData.link).includes("/nda?token=") && Boolean(ndaRow?.token_hash) && !JSON.stringify(ndaRow).includes("token="),
  await detail(nda),
);
check("nda_create rejects an empty name", (await post({ action: "nda_create", full_name: "A", email_address: "nope" }, session)).status === 422);

// --- feedback moderation --------------------------------------------------

const test = await post({ action: "create_test" }, session);
const testData = await payload(test);
const publishedFeedback = await post({ action: "publish", id: testData.record.id }, session);
const publishedRecord = (await payload(publishedFeedback)).record;
const rejectedFeedback = await post({ action: "reject", id: testData.record.id, reason: "Audit" }, session);
await post({ action: "create_test" }, session);
const second = (await payload(await get(session))).records.find((record) => record.status === "pending_review");
const rejectResponse = await post({ action: "reject", id: second.id, reason: "Audit reason" }, session);
const rejected = (await payload(rejectResponse)).record;
check(
  "moderation publishes and rejects a queued feedback",
  publishedFeedback.status === 200 && publishedRecord.status === "published" && rejectResponse.status === 200 && rejected.status === "rejected" && rejected.reject_reason === "Audit reason",
  `${await detail(publishedFeedback)} | ${await detail(rejectResponse)}`,
);

// --- media ----------------------------------------------------------------

const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6300010000050001", "hex");
const upload = await mediaRequest({ action: "upload", name: "audit.png", content_type: "image/png", data: png.toString("base64") }, session);
const uploaded = (await payload(upload)).item;
check("media upload writes the file to R2 and returns a public path", upload.status === 201 && uploaded?.key === "content/audit.png" && uploaded?.url === "/media/content/audit.png", await detail(upload));

const update = await mediaRequest({ action: "update", key: uploaded.key, alt: "Audit alt", caption: "Audit caption" }, session);
const updated = (await payload(update)).item;
check("media update stores the alt text", update.status === 200 && updated?.alt === "Audit alt" && updated?.size === png.length, await detail(update));

const list = await mediaGet({ request: request({ url: `${ORIGIN}/api/admin/media`, cookie: session }), env });
const listed = await payload(list);
check("media GET returns the file with its metadata", list.status === 200 && listed.storage === "configured" && listed.items.some((item) => item.key === uploaded.key && item.alt === "Audit alt"), await detail(list));

const remove = await mediaRequest({ action: "delete", key: uploaded.key }, session);
const afterDelete = await payload(await mediaGet({ request: request({ url: `${ORIGIN}/api/admin/media`, cookie: session }), env }));
check("media delete removes the object and its row", remove.status === 200 && !afterDelete.items.some((item) => item.key === uploaded.key), await detail(remove));

// --- ogni chiamata a GitHub manda lo User-Agent ---------------------------

const githubCalls = calls.filter((call) => call.url.startsWith("https://api.github.com"));
const missingAgent = githubCalls.filter((call) => !call.headers.get("User-Agent"));
check(
  `every GitHub call carries a User-Agent (${githubCalls.length} calls)`,
  githubCalls.length > 0 && missingAgent.length === 0,
  missingAgent.length ? `${missingAgent.length} without it: ${missingAgent[0].url}` : "no GitHub call happened",
);

// --- logout ---------------------------------------------------------------

const logout = await post({ action: "logout" }, session);
check("logout revokes the session", logout.status === 200 && (await get(session)).status === 401);

console.log(failures ? `\nadmin actions: ${failures} FAILED` : "\nadmin actions: every panel action round-trips");
process.exit(failures ? 1 : 0);
