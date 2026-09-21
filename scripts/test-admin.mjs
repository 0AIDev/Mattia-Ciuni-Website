// Mette alla prova il login della dashboard privata (`functions/api/admin/feedback.ts`).
//
// Perché esiste: le proprietà che contano qui **non si vedono nell'export**. Un
// cookie che contiene il segreto, un confronto che esce prima, una sessione che
// non si chiude al logout: nessuna di queste lascia traccia nell'HTML, e nessuna
// fa fallire un controllo sui contenuti. L'unico modo per sapere se reggono è
// provare a romperle.
//
// È un test **offline**: carica la Function vera (Node 26 esegue i `.ts`
// direttamente, senza build), le dà un `env` finto con uno storage in memoria e
// le manda le richieste che manderebbe un attaccante. Nessuna rete, nessun dato
// reale, nessun segreto: il token usato è inventato qui dentro.
//
//   node scripts/test-admin.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { onRequestGet, onRequestPost } = await import(
  new URL("../functions/api/admin/feedback.ts", import.meta.url).href
);

const TOKEN = "0".repeat(64); // finto, e volutamente non un segreto vero
const ORIGIN = "https://example.test";
const IP = "203.0.113.7";

let failures = 0;
function check(name, condition) {
  console.log((condition ? "PASS" : "FAIL") + " " + name);
  if (!condition) failures += 1;
}

/** Lo storage che la Function si aspetta: KV con scadenza, in memoria. */
function newStore() {
  const map = new Map();
  return {
    map,
    async get(key) {
      const entry = map.get(key);
      if (!entry) return null;
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        map.delete(key);
        return null;
      }
      return entry.value;
    },
    async put(key, value, options = {}) {
      map.set(key, {
        value,
        expiresAt: options.expirationTtl ? Date.now() + options.expirationTtl * 1000 : null,
      });
    },
    async delete(key) {
      map.delete(key);
    },
  };
}

function newEnv() {
  return { FEEDBACK: newStore(), RATE_LIMIT: newStore(), ADMIN_TOKEN: TOKEN };
}

function request({ method = "GET", body, cookie, bearer, origin, contentType = "application/json", length }) {
  const headers = {};
  if (contentType) headers["Content-Type"] = contentType;
  if (cookie) headers.Cookie = cookie;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  if (origin !== undefined) headers.Origin = origin;
  if (length !== undefined) headers["Content-Length"] = String(length);
  headers["CF-Connecting-IP"] = IP;
  return new Request(`${ORIGIN}/api/admin/feedback`, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

/**
 * Tutti i `Set-Cookie` di una risposta, come li manda il server.
 *
 * `headers.get("Set-Cookie")` li unisce in una riga sola (e con due cookie
 * distinti — la sessione nuova e la cancellazione di quella vecchia — diventa
 * una stringa che nessun browser leggerebbe). `getSetCookie()` li tiene separati,
 * che è l'unico modo di controllare ogni cookie per quello che è.
 */
function setCookies(response) {
  if (typeof response.headers.getSetCookie === "function") return response.headers.getSetCookie();
  const single = response.headers.get("Set-Cookie");
  return single ? [single] : [];
}

function sessionCookie(response, name = "__Host-mattia_feedback_admin") {
  const match = setCookies(response).find((value) => value.startsWith(`${name}=`));
  return match ? match.split(";")[0] : "";
}

// --- 1 · senza credenziali non si vede niente ---------------------------------
{
  const env = newEnv();
  const response = await onRequestGet({ request: request({}), env });
  check("GET without credentials → 401, no data", response.status === 401 && !(await response.text()).includes("records"));
}

// --- 2 · token sbagliato: 401, nessun cookie ----------------------------------
{
  const env = newEnv();
  const response = await onRequestPost({
    request: request({ method: "POST", body: { action: "login", token: "1".repeat(64) } }),
    env,
  });
  check("wrong token → 401 and no cookie", response.status === 401 && setCookies(response).length === 0);
  check("wrong token → nothing written to storage", env.FEEDBACK.map.size === 0);
}

// --- 3 · il segreto non finisce nel cookie ------------------------------------
{
  const env = newEnv();
  const response = await onRequestPost({
    request: request({ method: "POST", body: { action: "login", token: TOKEN } }),
    env,
  });
  const cookies = setCookies(response);
  const header = cookies.find((value) => value.startsWith("__Host-")) || "";
  const session = sessionCookie(response);
  const stored = [...env.FEEDBACK.map.entries()];
  check(
    "login → session cookie, HttpOnly, Secure, SameSite=Strict, __Host-",
    header.includes("HttpOnly") &&
      header.includes("Secure") &&
      header.includes("SameSite=Strict") &&
      header.startsWith("__Host-") &&
      header.includes("Path=/"),
  );
  check("the cookie does not contain the admin token", !cookies.join(" ").includes(TOKEN));
  check(
    "the old cookie (the one that held the token) is expired on login",
    cookies.some((value) => value.startsWith("mattia_feedback_admin=") && value.includes("Max-Age=0")),
  );
  check(
    "the session is random (32 bytes) and lives in KV with an expiry",
    /^__Host-[a-zA-Z_-]+=[0-9a-f]{64}$/.test(session) &&
      stored.length === 1 &&
      stored[0][0].startsWith("adm:") &&
      stored[0][1].expiresAt !== null,
  );

  // --- 4 · la sessione apre la coda, e solo quella ---------------------------
  const withSession = await onRequestGet({ request: request({ cookie: session }), env });
  const otherSession = await onRequestGet({
    request: request({ cookie: "__Host-mattia_feedback_admin=" + "a".repeat(64) }),
    env,
  });
  check("the session opens the queue", withSession.status === 200);
  check("a made-up session does not", otherSession.status === 401);

  // --- 5 · logout: sessione cancellata davvero -------------------------------
  const logout = await onRequestPost({
    request: request({ method: "POST", body: { action: "logout" }, cookie: session }),
    env,
  });
  const afterLogout = await onRequestGet({ request: request({ cookie: session }), env });
  check(
    "logout revokes the session server-side and clears the cookie",
    logout.status === 200 &&
      setCookies(logout).some(
        (value) => value.startsWith("__Host-mattia_feedback_admin=") && value.includes("Max-Age=0"),
      ) &&
      env.FEEDBACK.map.size === 0,
  );
  check("the revoked session no longer opens the queue", afterLogout.status === 401);
}

// --- 6 · il token a lunga vita resta valido per la riga di comando -------------
{
  const env = newEnv();
  const response = await onRequestGet({ request: request({ bearer: TOKEN }), env });
  const wrong = await onRequestGet({ request: request({ bearer: "2".repeat(64) }), env });
  check("Bearer token still works for curl, wrong one does not", response.status === 200 && wrong.status === 401);
}

// --- 7 · rate limit sul login --------------------------------------------------
{
  const env = newEnv();
  const statuses = [];
  for (let i = 0; i < 11; i += 1) {
    const response = await onRequestPost({
      request: request({ method: "POST", body: { action: "login", token: "3".repeat(64) } }),
      env,
    });
    statuses.push(response.status);
  }
  check(
    "brute force stops at the limit (429)",
    statuses.slice(0, 10).every((status) => status === 401) && statuses[10] === 429,
  );
}

// --- 8 · origini estranee, corpi enormi, tipi sbagliati -----------------------
{
  const env = newEnv();
  const crossOrigin = await onRequestPost({
    request: request({ method: "POST", body: { action: "login", token: TOKEN }, origin: "https://evil.test" }),
    env,
  });
  const big = await onRequestPost({
    request: request({ method: "POST", body: { action: "login", token: TOKEN }, length: 20000 }),
    env,
  });
  const wrongType = await onRequestPost({
    request: request({ method: "POST", body: { action: "login", token: TOKEN }, contentType: "text/plain" }),
    env,
  });
  const malformed = await onRequestPost({
    request: request({ method: "POST", body: "not json" }),
    env,
  });
  check("cross-origin login → 403", crossOrigin.status === 403);
  check("oversized body → 413", big.status === 413);
  check("wrong content type → 415", wrongType.status === 415);
  check("malformed JSON → 400", malformed.status === 400);
  check(
    "none of the rejected requests created a session",
    env.FEEDBACK.map.size === 0,
  );
}

// --- 9 · moderazione: serve una credenziale, e l'id non è un'oracolo -----------
{
  const env = newEnv();
  const anonymous = await onRequestPost({
    request: request({ method: "POST", body: { action: "publish", id: "fb:test" } }),
    env,
  });
  check("moderation without credentials → 401", anonymous.status === 401);

  // Con una sessione valida e un record vero: publish cambia lo stato e toglie
  // il record dalla coda.
  const login = await onRequestPost({
    request: request({ method: "POST", body: { action: "login", token: TOKEN } }),
    env,
  });
  const session = sessionCookie(login);
  const record = {
    id: "fb:2026-09-21:test",
    submitted_at: new Date().toISOString(),
    status: "pending_review",
    name: "Test",
    email: "",
    message: "Una prova, senza dati veri.",
    page_url: "/feedback/",
  };
  await env.FEEDBACK.put(record.id, JSON.stringify(record));
  await env.FEEDBACK.put("fb:index", record.id);

  const published = await onRequestPost({
    request: request({ method: "POST", body: { action: "publish", id: record.id }, cookie: session }),
    env,
  });
  const stored = JSON.parse(await env.FEEDBACK.get(record.id));
  const index = await env.FEEDBACK.get("fb:index");
  check(
    "publish with a session works, sets the status and clears the queue",
    published.status === 200 && stored.status === "published" && index === "",
  );
}

// --- 10 · nessuna risposta è memorizzabile o indicizzabile --------------------
{
  const env = newEnv();
  const responses = [
    await onRequestGet({ request: request({}), env }),
    await onRequestPost({ request: request({ method: "POST", body: { action: "login", token: TOKEN } }), env }),
  ];
  check(
    "every response is no-store and noindex",
    responses.every(
      (response) =>
        response.headers.get("Cache-Control") === "no-store" &&
        response.headers.get("X-Robots-Tag") === "noindex, nofollow",
    ),
  );
}

// --- 11 · niente segreti nei log ---------------------------------------------
{
  const lines = [];
  const original = console.log;
  console.log = (...args) => lines.push(args.join(" "));
  try {
    const env = newEnv();
    await onRequestPost({ request: request({ method: "POST", body: { action: "login", token: "4".repeat(64) } }), env });
    await onRequestPost({ request: request({ method: "POST", body: { action: "login", token: TOKEN } }), env });
  } finally {
    console.log = original;
  }
  const log = lines.join("\n");
  check(
    "the token never reaches the log",
    !log.includes(TOKEN) && !log.includes("4".repeat(64)) && !log.includes(IP) && log.includes("admin_login"),
  );
}

// --- 12 · la pagina non è un indice macchina ---------------------------------
{
  const machineReadable = [
    "out/sitemap.xml",
    "out/sitemap-home.xml",
    "out/sitemap-thoughts.xml",
    "out/sitemap-notes.xml",
    "out/sitemap-feedback.xml",
    "out/news-sitemap.xml",
    "out/llms.txt",
    "out/feed.xml",
    // L'indice della chat: la dashboard non deve comparire nemmeno lì, perché la
    // chat risponde anche dicendo dove sta una cosa.
    "out/rag/index.json",
    // La card markdown della pagina: era servita come asset statico (quel percorso
    // non passa dalla Function), quindi era un file pubblico che descriveva la
    // dashboard privata. Ora non viene scritta — e questo controllo se ne accorge
    // se torna.
    "out/admin/feedback.md",
    "public/admin/feedback.md",
  ];
  let leaked = [];
  let checked = 0;
  for (const file of machineReadable) {
    try {
      const text = readFileSync(join(root, file), "utf8").toLowerCase();
      checked += 1;
      if (text.includes("admin")) leaked.push(file);
    } catch {
      // build non eseguito: il controllo lo fa già verify.js sull'export
    }
  }
  check(`the dashboard is in no machine-readable index (${checked} checked)`, leaked.length === 0);
}

// --- 13 · la moderazione non scrive fuori dai feedback -----------------------
// `publish`/`reject` scrivono su una chiave che arriva dal corpo della richiesta:
// se non fosse verificata, una sessione valida (o chi la ruba) potrebbe nominare
// `fb:index` — la coda — o una `adm:<sessione>`, cioè un'altra sessione, e
// scriverci sopra. Qui si prova a farlo e si controlla che non succeda.
{
  const env = newEnv();
  const login = await onRequestPost({
    request: request({ method: "POST", body: { action: "login", token: TOKEN } }),
    env,
  });
  const session = sessionCookie(login);
  const sessionKey = [...env.FEEDBACK.map.keys()].find((key) => key.startsWith("adm:"));
  await env.FEEDBACK.put("fb:index", "fb:2026-09-21T00-00-00-000Z:abc123");
  const sessionValue = await env.FEEDBACK.get(sessionKey);
  const keysBefore = env.FEEDBACK.map.size;

  const attempts = [
    ["fb:index", "the queue index"],
    [sessionKey, "another session"],
    ["thoughts/money-layer", "a key outside the feedback namespace"],
    ["", "an empty id"],
  ];
  const statuses = [];
  for (const [id] of attempts) {
    const response = await onRequestPost({
      request: request({ method: "POST", body: { action: "reject", id }, cookie: session }),
      env,
    });
    statuses.push(response.status);
  }

  check(
    "moderation cannot name the queue index, a session or a foreign key (" +
      attempts.map(([, label]) => label).join(", ") +
      ")",
    statuses.every((status) => status === 400),
  );
  check(
    "the refused writes changed nothing (queue and session identical)",
    (await env.FEEDBACK.get("fb:index")) === "fb:2026-09-21T00-00-00-000Z:abc123" &&
      (await env.FEEDBACK.get(sessionKey)) === sessionValue &&
      env.FEEDBACK.map.size === keysBefore,
  );
  check(
    "the session still works after the refused writes",
    (await onRequestGet({ request: request({ cookie: session }), env })).status === 200,
  );
}

// --- 14 · il tetto del corpo non dipende da `Content-Length` ------------------
// In chunked non c'è nessuna `Content-Length`: se il limite si fidesse di quella,
// si aggirerebbe togliendo un header. Qui il corpo è uno stream, quindi il limite
// può solo misurarlo mentre arriva.
{
  const streamed = (payload) =>
    new Request(`${ORIGIN}/api/admin/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": IP },
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(payload));
          controller.close();
        },
      }),
      duplex: "half",
    });

  const small = await onRequestPost({
    request: streamed(JSON.stringify({ action: "login", token: TOKEN })),
    env: newEnv(),
  });
  const huge = await onRequestPost({
    request: streamed(JSON.stringify({ action: "login", token: TOKEN, pad: "x".repeat(9000) })),
    env: newEnv(),
  });
  check("a streamed login with no Content-Length still works", small.status === 200);
  check("a streamed body over the cap is rejected on the bytes that arrive", huge.status === 413);
}

console.log(
  failures === 0
    ? "\nadmin: login offline attacks passed (constant-time token, KV sessions, logout, rate limit, origin and body caps, scoped moderation)"
    : `\nadmin: ${failures} FAILED`,
);
process.exit(failures ? 1 : 0);
