// GET/POST /api/admin/feedback — la coda di review dei feedback.
//
// Cosa è cambiato dopo l'audit del 21/09 (e perché conta):
//
//   1. **Il segreto non finisce più in un cookie.** Prima il login scriveva
//      `Set-Cookie: mattia_feedback_admin=<ADMIN_TOKEN>`: la credenziale a lunga
//      vita (l'unica, quella che apre tutto e che si ruota a mano) viaggiava in
//      ogni richiesta e restava nel browser per 8 ore. Ora il cookie contiene un
//      **id di sessione casuale** salvato in KV con scadenza: se il cookie esce dal
//      browser, esce uno strumento che scade da solo, non la chiave di casa.
//   2. **Logout vero.** Prima il pulsante svuotava solo lo stato di React: il
//      cookie restava valido e la sessione non si chiudeva. Ora il logout cancella
//      la sessione in KV e il cookie.
//   3. **Confronto a tempo costante.** `token === env.ADMIN_TOKEN` esce prima se i
//      due valori hanno lunghezza diversa: è un canale laterale, piccolo ma
//      gratuito da chiudere. Ora si confrontano due digest SHA-256 (stessa
//      lunghezza, xor accumulato, nessun `return` anticipato).
//   4. **Rate limit sul login.** Il token è lungo, ma niente vieta a qualcuno di
//      provarci per mesi: 10 tentativi ogni 10 minuti per indirizzo.
//   5. **Solo richieste same-origin** (quando l'`Origin` c'è) e **corpo piccolo**:
//      un endpoint che accetta qualunque origine e qualunque dimensione è
//      superficie regalata.
//   6. **La moderazione non esce dai feedback.** `publish`/`reject` scrivono su una
//      chiave presa dal corpo: doveva essere un id di feedback, e adesso è
//      verificato che lo sia. Prima una sessione valida poteva nominare
//      `fb:index` (la coda) o una `adm:<sessione>` — cioè scrivere fuori dal
//      proprio raggio con la stessa credenziale.
//   7. **Il limite di corpo vale sui byte arrivati.** `Content-Length` è una
//      dichiarazione, e in chunked non c'è: ora il corpo si legge e si misura,
//      quindi il tetto non si aggira togliendo un header.
//
// Cosa resta com'era, di proposito: nessun dato della coda senza credenziale, 401
// identico per "token mancante" e "token sbagliato" (non dice quale), `no-store` e
// `noindex` su ogni risposta, nessun contenuto nei log.
//
// Il percorso da riga di comando resta disponibile: `Authorization: Bearer <token>`
// continua a funzionare, così la dashboard si può interrogare con curl senza
// aprire il browser.

interface Store {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete?(key: string): Promise<void>;
}

interface Env {
  FEEDBACK?: Store;
  RATE_LIMIT?: Store;
  ADMIN_TOKEN?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

interface FeedbackRecord {
  id: string;
  submitted_at: string;
  status: "pending_review" | "published" | "rejected";
  name: string;
  email: string;
  message: string;
  page_url: string;
  ip_first_octets?: string;
  published_at?: string;
  rejected_at?: string;
  reject_reason?: string;
}

const INDEX_KEY = "fb:index";
const SESSION_PREFIX = "adm:";
// La forma di una chiave di feedback (`fb:<timestamp>:<random>`, vedi
// `functions/api/feedback.ts`). Serve a **delimitare il raggio d'azione della
// moderazione**: publish/reject scrivono su una chiave presa dal corpo della
// richiesta, e senza questo controllo una `id` qualunque — `fb:index`, o una
// `adm:<sessione>` — sarebbe una chiave scrivibile con la stessa credenziale.
// Una sessione deve poter toccare un feedback, non tutto il namespace.
const RECORD_ID = /^fb:[0-9A-Za-z:._-]{1,120}$/;
const SESSION_SECONDS = 14400; // 4 ore: una sessione di lavoro, non una settimana
const LOGIN_WINDOW_SECONDS = 600;
const LOGIN_MAX_ATTEMPTS = 10;
const MAX_BODY_BYTES = 8192;
const MAX_INDEX = 500;
// `__Host-`: il cookie vale solo per questo host, mai per un sottodominio, e solo
// su HTTPS con Path=/ — così nessuno può "lanciarlo" da un dominio figlio.
const COOKIE = "__Host-mattia_feedback_admin";
// Il nome usato prima dell'audit del 21/09, quando il cookie conteneva il token.
// Si cancella al login per non lasciare in giro una copia del segreto.
const LEGACY_COOKIE = "mattia_feedback_admin";

/**
 * Ogni risposta esce da qui, con gli stessi header di base.
 *
 * Gli header in ingresso sono una **lista di coppie**, non un oggetto: due
 * `Set-Cookie` in un oggetto diventano uno solo (un oggetto non ha due volte la
 * stessa chiave) e un `Headers` spalmato con `{...}` non copia niente — era il
 * modo in cui questa funzione, nella prima stesura dell'audit, smetteva di
 * mandare il cookie di sessione senza che nessun tipo se ne accorgesse. Con le
 * coppie, `append` tiene i cookie separati come li vuole il browser.
 */
function json(body: Record<string, unknown>, status = 200, headers: Array<[string, string]> = []) {
  const merged = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  for (const [key, value] of headers) {
    if (key.toLowerCase() === "set-cookie") merged.append(key, value);
    else merged.set(key, value);
  }
  return new Response(JSON.stringify(body), { status, headers: merged });
}

function ipOf(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** Le richieste del browser devono arrivare da questa origine; curl (senza
 *  `Origin`) resta permesso, perché non porta cookie di nessuno. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function cookieOf(request: Request, name: string): string {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

/** Confronto a tempo costante: due digest della stessa lunghezza, xor accumulato. */
async function sameSecret(given: string, expected: string): Promise<boolean> {
  if (!given || !expected) return false;
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(given)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

function newSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sessionValid(request: Request, env: Env): Promise<boolean> {
  const id = cookieOf(request, COOKIE);
  if (!id || !env.FEEDBACK) return false;
  return (await env.FEEDBACK.get(SESSION_PREFIX + id)) !== null;
}

/** Sessione valida **oppure** il token vero (riga di comando). */
async function isAuthorized(request: Request, env: Env): Promise<boolean> {
  if (await sessionValid(request, env)) return true;
  const bearer = request.headers.get("Authorization");
  const given = bearer?.startsWith("Bearer ") ? bearer.slice(7).trim() : "";
  return sameSecret(given, env.ADMIN_TOKEN || "");
}

/** Il rate limit si applica solo al login: è l'unica porta che si può bussare. */
async function loginAllowed(env: Env, ip: string): Promise<boolean> {
  if (!env.RATE_LIMIT) return true;
  const key = `rl:admin:${ip}`;
  const current = Number.parseInt((await env.RATE_LIMIT.get(key)) || "0", 10);
  if (current >= LOGIN_MAX_ATTEMPTS) return false;
  await env.RATE_LIMIT.put(key, String(current + 1), { expirationTtl: LOGIN_WINDOW_SECONDS });
  return true;
}

async function queue(env: Env): Promise<FeedbackRecord[]> {
  if (!env.FEEDBACK) return [];
  const raw = await env.FEEDBACK.get(INDEX_KEY);
  const ids = (raw || "").split("\n").filter(Boolean).slice(0, MAX_INDEX);
  const records: FeedbackRecord[] = [];
  for (const id of ids) {
    const value = await env.FEEDBACK.get(id);
    if (!value) continue;
    try {
      records.push(JSON.parse(value) as FeedbackRecord);
    } catch {
      // Un record illeggibile non deve rompere tutta la dashboard.
    }
  }
  return records;
}

async function saveQueue(env: Env, records: FeedbackRecord[]) {
  if (!env.FEEDBACK) return;
  await env.FEEDBACK.put(INDEX_KEY, records.map((record) => record.id).join("\n"));
}

export const onRequestGet = async ({ request, env }: PagesContext): Promise<Response> => {
  if (!(await isAuthorized(request, env))) return json({ code: "unauthorized" }, 401);
  if (!env.FEEDBACK) return json({ code: "unavailable" }, 503);
  const records = await queue(env);
  return json({ records });
};

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  const length = Number.parseInt(request.headers.get("Content-Length") || "0", 10);
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    return json({ code: "invalid_request" }, 413);
  }

  if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json") {
    return json({ code: "invalid_request" }, 415);
  }
  if (!sameOrigin(request)) {
    console.log(JSON.stringify({ event: "admin_request", outcome: "cross_origin" }));
    return json({ code: "forbidden" }, 403);
  }

  // Il corpo si legge e si misura: `Content-Length` è una dichiarazione, e una
  // richiesta in chunked non la manda affatto. Il limite deve valere sui byte
  // che sono arrivati davvero, non su quelli promessi.
  let payload: string;
  try {
    payload = await request.text();
  } catch {
    return json({ code: "invalid_request" }, 400);
  }
  if (payload.length > MAX_BODY_BYTES) return json({ code: "invalid_request" }, 413);

  let body: { action?: unknown; token?: unknown; id?: unknown; reason?: unknown };
  try {
    body = JSON.parse(payload) as typeof body;
  } catch {
    return json({ code: "invalid_request" }, 400);
  }

  if (body.action === "login") {
    if (!(await loginAllowed(env, ipOf(request)))) {
      console.log(JSON.stringify({ event: "admin_login", outcome: "rate_limited" }));
      return json({ code: "rate_limited" }, 429, [["Retry-After", String(LOGIN_WINDOW_SECONDS)]]);
    }
    const given = typeof body.token === "string" ? body.token : "";
    if (!(await sameSecret(given, env.ADMIN_TOKEN || ""))) {
      // Nessun dettaglio: non si distingue "manca il token" da "token sbagliato",
      // e nei log non finisce né il valore provato né l'indirizzo.
      console.log(JSON.stringify({ event: "admin_login", outcome: "unauthorized" }));
      return json({ code: "unauthorized" }, 401);
    }
    if (!env.FEEDBACK) return json({ code: "unavailable" }, 503);
    const session = newSessionId();
    await env.FEEDBACK.put(SESSION_PREFIX + session, new Date().toISOString(), {
      expirationTtl: SESSION_SECONDS,
    });
    console.log(JSON.stringify({ event: "admin_login", outcome: "ok" }));
    // Il secondo `Set-Cookie` cancella il cookie del formato vecchio, quello che
    // conteneva il token stesso: chi si era già autenticato prima dell'audit se lo
    // porta dietro nel browser, e non deve restarci.
    return json({ ok: true }, 200, [
      [
        "Set-Cookie",
        `${COOKIE}=${session}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`,
      ],
      [
        "Set-Cookie",
        `${LEGACY_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`,
      ],
    ]);
  }

  if (!(await isAuthorized(request, env))) return json({ code: "unauthorized" }, 401);

  if (body.action === "logout") {
    const id = cookieOf(request, COOKIE);
    if (id && env.FEEDBACK?.delete) await env.FEEDBACK.delete(SESSION_PREFIX + id);
    return json({ ok: true }, 200, [
      ["Set-Cookie", `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`],
    ]);
  }

  if (!env.FEEDBACK) return json({ code: "unavailable" }, 503);

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (
    (body.action !== "publish" && body.action !== "reject") ||
    id === INDEX_KEY ||
    !RECORD_ID.test(id)
  ) {
    console.log(JSON.stringify({ event: "admin_moderate", outcome: "invalid_id" }));
    return json({ code: "invalid_request" }, 400);
  }

  const raw = await env.FEEDBACK.get(id);
  if (!raw) return json({ code: "not_found" }, 404);
  let record: FeedbackRecord;
  try {
    record = JSON.parse(raw) as FeedbackRecord;
  } catch {
    return json({ code: "invalid_record" }, 422);
  }

  if (body.action === "publish") {
    record.status = "published";
    record.published_at = new Date().toISOString();
  } else {
    record.status = "rejected";
    record.rejected_at = new Date().toISOString();
    record.reject_reason =
      typeof body.reason === "string" ? body.reason.slice(0, 200) : "Not selected for publication";
  }

  await env.FEEDBACK.put(id, JSON.stringify(record));
  const records = await queue(env);
  await saveQueue(
    env,
    records.filter((item) => item.id !== id),
  );
  return json({ ok: true, record });
};
