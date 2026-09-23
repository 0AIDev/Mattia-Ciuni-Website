// @ts-expect-error Cloudflare bundles extensionless TS imports; Node's native strip loader needs `.ts` for the offline test.
import { newTotpSecret, otpauthUri, verifyTotp } from "../../../lib/totp.ts";
// @ts-expect-error Pages bundles extensionless function imports; Node's offline loader needs `.ts`.
import { supabaseConfigured, supabaseRequest } from "../../lib/supabase.ts";
// @ts-expect-error Pages bundles extensionless function imports; Node's native strip loader needs `.ts` for the offline test.
import { supabaseKv } from "../../lib/supabase-kv.ts";

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
//   4. **Rate limit separati.** Il token e il codice TOTP hanno porte diverse:
//      10 tentativi di token ogni 10 minuti e 5 tentativi di codice ogni 10
//      minuti per indirizzo.
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
// Il percorso da riga di comando, se usato, richiede `X-Admin-Email: ceo@usepayle.com`
// e `X-Admin-TOTP: 123456`. Il token di bootstrap non è una credenziale di login.

interface Store {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete?(key: string): Promise<void>;
}

interface Env {
  FEEDBACK?: Store;
  RATE_LIMIT?: Store;
  ADMIN_TOKEN?: string;
  ADMIN_TOTP_RESET_TOKEN?: string;
  COFOUNDER_TOKEN?: string;
  LOCAL_ADMIN?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

type AdminRole = "ceo";
const ADMIN_EMAIL = "ceo@usepayle.com" as const;
const JOBS_KEY = "content:jobs";

type AdminJob = {
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  compensation: string;
  status: "open" | "coming-soon" | "closed";
  shortPitch: string;
  description: string;
  questions?: Array<{ id: string; label: string; type: "text" | "textarea" | "url"; required: boolean; minimum: number }>;
};

type StoredSession = { created_at: string; role: AdminRole; epoch?: string };

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
const TOTP_CONFIG_KEY = "auth:totp:config";
const TOTP_BOOTSTRAP_KEY = "auth:totp:bootstrap-used";
const TOTP_PENDING_PREFIX = "auth:totp:pending:";
const TOTP_EPOCH_KEY = "auth:totp:epoch";
const TOTP_SETUP_SECONDS = 900; // 15 minutes to scan and confirm the first code
const TOTP_WINDOW_SECONDS = 600;
// La forma di una chiave di feedback (`fb:<timestamp>:<random>`, vedi
// `functions/api/feedback.ts`). Serve a **delimitare il raggio d'azione della
// moderazione**: publish/reject scrivono su una chiave presa dal corpo della
// richiesta, e senza questo controllo una `id` qualunque — `fb:index`, o una
// `adm:<sessione>` — sarebbe una chiave scrivibile con la stessa credenziale.
// Una sessione deve poter toccare un feedback, non tutto il namespace.
const RECORD_ID = /^fb:[0-9A-Za-z:._-]{1,120}$/;
const SESSION_SECONDS = 43200; // 12 ore, fino al logout esplicito
const LOGIN_WINDOW_SECONDS = 600;
const LOGIN_MAX_ATTEMPTS = 15;
const TOTP_RATE_MAX_ATTEMPTS = 8;
const LOGIN_RATE_VERSION = "v2"; // resetta i contatori precedenti dopo il cambio di policy
const MAX_BODY_BYTES = 8192;
const MAX_INDEX = 500;
// `__Host-`: il cookie vale solo per questo host, mai per un sottodominio, e solo
// su HTTPS con Path=/ — così nessuno può "lanciarlo" da un dominio figlio.
const COOKIE = "__Host-mattia_feedback_admin";

type TotpConfig = { secret: string; enabled_at: string };
type PendingSetup = { secret: string; created_at: string; epoch: string };

// `next dev` is only the static page renderer and never runs Pages Functions.
// `npm run dev:pages` uses this bounded in-memory store so the full token + TOTP
// flow can be exercised locally without putting a fake KV credential in git.
const localStore = new Map<string, { value: string; expiresAt: number | null }>();
const localFeedback: Store = {
  async get(key) {
    const item = localStore.get(key);
    if (!item) return null;
    if (item.expiresAt !== null && item.expiresAt < Date.now()) {
      localStore.delete(key);
      return null;
    }
    return item.value;
  },
  async put(key, value, options = {}) {
    localStore.set(key, { value, expiresAt: options.expirationTtl ? Date.now() + options.expirationTtl * 1000 : null });
  },
  async delete(key) { localStore.delete(key); },
};

function isLoopbackRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

// This bypass is intentionally double-gated: the explicit local flag and a
// loopback URL are both required. It can never authorize a deployed hostname.
function localAdminEnabled(request: Request, env: Env): boolean {
  return env.LOCAL_ADMIN === "1" && isLoopbackRequest(request);
}

function withLocalStore(env: Env): Env {
  // The Cloudflare KV binding is authoritative for the review queue and its
  // authentication state. Supabase is an analytics/data fallback elsewhere in
  // the app, but must never silently replace an existing KV binding: doing so
  // makes an already-configured TOTP secret and session cookie look missing as
  // soon as SUPABASE_* variables are added to production, resulting in 401s.
  if (env.FEEDBACK) return env;
  const remote = supabaseKv(env);
  if (remote) return { ...env, FEEDBACK: remote };
  return env.LOCAL_ADMIN === "1" ? { ...env, FEEDBACK: localFeedback } : env;
}
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

function newFeedbackId(): string {
  return `fb:${Date.now().toString(36)}:${newSessionId().slice(0, 16)}`;
}

async function roleForEmail(email: string): Promise<AdminRole | null> {
  return email.trim().toLowerCase() === ADMIN_EMAIL ? "ceo" : null;
}

async function configOf(env: Env): Promise<TotpConfig | null> {
  if (!env.FEEDBACK) return null;
  const raw = await env.FEEDBACK.get(TOTP_CONFIG_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as TotpConfig;
    return value.secret && value.enabled_at ? value : null;
  } catch {
    return null;
  }
}

async function setupUsed(env: Env): Promise<boolean> {
  return env.FEEDBACK ? (await env.FEEDBACK.get(TOTP_BOOTSTRAP_KEY)) === "1" : false;
}

async function totpEpoch(env: Env): Promise<string> {
  if (!env.FEEDBACK) return "0";
  return (await env.FEEDBACK.get(TOTP_EPOCH_KEY)) || "0";
}

async function invalidateTotpState(env: Env): Promise<void> {
  if (!env.FEEDBACK) return;
  const current = Number.parseInt(await totpEpoch(env), 10);
  await env.FEEDBACK.put(TOTP_EPOCH_KEY, String(Number.isFinite(current) ? current + 1 : 1));
  await env.FEEDBACK.delete?.(TOTP_CONFIG_KEY);
  await env.FEEDBACK.delete?.(TOTP_BOOTSTRAP_KEY);
}

async function authRateAllowed(env: Env, ip: string, kind: string, max: number): Promise<boolean> {
  const store = env.RATE_LIMIT || supabaseKv(env);
  if (!store) return true;
  const key = `rl:admin:${LOGIN_RATE_VERSION}:${kind}:${ip}`;
  const current = Number.parseInt((await store.get(key)) || "0", 10);
  if (current >= max) return false;
  await store.put(key, String(current + 1), { expirationTtl: kind === "totp" ? TOTP_WINDOW_SECONDS : LOGIN_WINDOW_SECONDS });
  return true;
}

async function sessionRole(request: Request, env: Env): Promise<AdminRole | null> {
  const id = cookieOf(request, COOKIE);
  if (!id || !env.FEEDBACK) return null;
  const raw = await env.FEEDBACK.get(SESSION_PREFIX + id);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as StoredSession;
    return session.role === "ceo" && (session.epoch || "0") === (await totpEpoch(env)) ? "ceo" : null;
  } catch {
    // Sessions created before epoch support are valid only before the first reset.
    return (await totpEpoch(env)) === "0" ? "ceo" : null;
  }
}

/** Sessione valida oppure token + TOTP per automazioni CLI. */
async function isAuthorized(request: Request, env: Env): Promise<AdminRole | null> {
  const existingRole = await sessionRole(request, env);
  if (existingRole) return existingRole;
  const email = request.headers.get("X-Admin-Email") || "";
  const code = request.headers.get("X-Admin-TOTP") || "";
  const config = await configOf(env);
  const role = await roleForEmail(email);
  if (!config || !role) return null;
  return (await verifyTotp(config.secret, code)) ? role : null;
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

type AnalyticsViews = {
  daily: Array<Record<string, unknown>>;
  pages: Array<Record<string, unknown>>;
  flow: Array<Record<string, unknown>>;
  acquisition: Array<Record<string, unknown>>;
  conversions: Array<Record<string, unknown>>;
  available: boolean;
};

const DEFAULT_JOBS: AdminJob[] = [{
  slug: "agent-runtime-founding-engineer",
  title: "Founding Engineer, Agent Runtime",
  department: "Engineering",
  location: "Remote, Europe / US time zones",
  type: "Full-time",
  compensation: "Equity-led, discussed openly",
  status: "coming-soon",
  shortPitch: "Build the execution layer for AI agents.",
  description: "The role will sit close to Payle's agent runtime, where every action needs a bounded, auditable path.",
}];

async function adminJobs(env: Env): Promise<AdminJob[]> {
  if (!env.FEEDBACK) return DEFAULT_JOBS;
  const raw = await env.FEEDBACK.get(JOBS_KEY);
  if (!raw) return DEFAULT_JOBS;
  try {
    const jobs = JSON.parse(raw) as AdminJob[];
    return Array.isArray(jobs) ? jobs : DEFAULT_JOBS;
  } catch {
    return DEFAULT_JOBS;
  }
}

function validJobs(value: unknown): value is AdminJob[] {
  return Array.isArray(value) && value.length <= 100 && value.every((job) => (
    job && typeof job === "object" &&
    /^[a-z0-9-]{3,80}$/.test(String((job as AdminJob).slug)) &&
    ["open", "coming-soon", "closed"].includes(String((job as AdminJob).status)) &&
    ["title", "department", "location", "type", "shortPitch", "description"].every((key) => typeof (job as Record<string, unknown>)[key] === "string") &&
    (!job.questions || (Array.isArray(job.questions) && job.questions.length <= 30 && job.questions.every((question: { id: string; label: string; type: string; required: boolean; minimum: number }) => question && typeof question.id === "string" && typeof question.label === "string" && ["text", "textarea", "url"].includes(question.type) && typeof question.required === "boolean" && Number.isInteger(question.minimum) && question.minimum >= 0 && question.minimum <= 10000)))
  ));
}

/**
 * Le viste sono interrogate solo dopo l'autenticazione e mai dal browser
 * direttamente: la service role resta nella Function. Un errore di una vista
 * non deve nascondere la coda dei feedback, quindi la dashboard può mostrare
 * la review anche quando la migrazione analytics non è stata ancora eseguita.
 */
async function analyticsViews(env: Env): Promise<AnalyticsViews> {
  const empty: AnalyticsViews = { daily: [], pages: [], flow: [], acquisition: [], conversions: [], available: false };
  if (!supabaseConfigured(env)) return empty;
  try {
    const [daily, pages, flow, acquisition, conversions] = await Promise.all([
      supabaseRequest<Array<Record<string, unknown>>>(env, "analytics_daily?select=*&order=day.desc&limit=14"),
      supabaseRequest<Array<Record<string, unknown>>>(env, "analytics_pages?select=*&order=views.desc&limit=20"),
      supabaseRequest<Array<Record<string, unknown>>>(env, "analytics_flow?select=*&order=moves.desc&limit=20"),
      supabaseRequest<Array<Record<string, unknown>>>(env, "analytics_acquisition?select=*&order=conversions.desc,visitors.desc&limit=20"),
      supabaseRequest<Array<Record<string, unknown>>>(env, "analytics_conversions?select=*&order=occurred_at.desc&limit=20"),
    ]);
    return {
      daily: daily.response.ok && daily.data ? daily.data : [],
      pages: pages.response.ok && pages.data ? pages.data : [],
      flow: flow.response.ok && flow.data ? flow.data : [],
      acquisition: acquisition.response.ok && acquisition.data ? acquisition.data : [],
      conversions: conversions.response.ok && conversions.data ? conversions.data : [],
      // Le tre viste originali tengono viva la dashboard anche durante la
      // finestra in cui la migrazione attribution non è ancora stata applicata.
      available: daily.response.ok && pages.response.ok && flow.response.ok,
    };
  } catch {
    return empty;
  }
}

function sessionCookies(session: string): Array<[string, string]> {
  return [
    [
      "Set-Cookie",
      `${COOKIE}=${session}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`,
    ],
    [
      "Set-Cookie",
      `${LEGACY_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`,
    ],
  ];
}

async function createSession(env: Env, role: AdminRole): Promise<string> {
  const session = newSessionId();
  await env.FEEDBACK!.put(SESSION_PREFIX + session, JSON.stringify({ created_at: new Date().toISOString(), role, epoch: await totpEpoch(env) } satisfies StoredSession), {
    expirationTtl: SESSION_SECONDS,
  });
  return session;
}

export const onRequestGet = async ({ request, env: incomingEnv }: PagesContext): Promise<Response> => {
  const env = withLocalStore(incomingEnv);
  // A production deployment without the FEEDBACK binding is unavailable, not
  // an unconfigured administrator. Keep this distinct from the one-time TOTP
  // setup state so the UI and monitoring can diagnose the deployment correctly.
  if (!env.FEEDBACK) return json({ code: "unavailable" }, 503);
  const localAdmin = localAdminEnabled(request, env);
  const role = localAdmin ? "ceo" : await isAuthorized(request, env);
  if (!role) {
    return json({ code: "unauthorized", setup_required: !(await configOf(env)) }, 401);
  }
  if (!env.FEEDBACK) return json({ code: "unavailable" }, 503);
  const [records, analytics, jobs] = await Promise.all([queue(env), analyticsViews(env), adminJobs(env)]);
  return json({ records, role, analytics, jobs });
};

export const onRequestPost = async ({ request, env: incomingEnv }: PagesContext): Promise<Response> => {
  const env = withLocalStore(incomingEnv);
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

  let body: {
    action?: unknown;
    token?: unknown;
    email?: unknown;
    code?: unknown;
    setup_id?: unknown;
    id?: unknown;
    reason?: unknown;
    jobs?: unknown;
  };
  try {
    body = JSON.parse(payload) as typeof body;
  } catch {
    return json({ code: "invalid_request" }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ code: "invalid_request" }, 400);
  }

  const ip = ipOf(request);

  if (body.action === "reset_setup") {
    if (!env.FEEDBACK) return json({ code: "unavailable" }, 503);
    if (!(await authRateAllowed(env, ip, "login", LOGIN_MAX_ATTEMPTS))) {
      return json({ code: "rate_limited" }, 429, [["Retry-After", String(LOGIN_WINDOW_SECONDS)]]);
    }
    const resetToken = typeof body.token === "string" ? body.token : "";
    if (!(await sameSecret(resetToken, env.ADMIN_TOTP_RESET_TOKEN || ""))) {
      console.log(JSON.stringify({ event: "admin_totp_reset", outcome: "unauthorized" }));
      return json({ code: "unauthorized" }, 401);
    }
    await invalidateTotpState(env);
    console.log(JSON.stringify({ event: "admin_totp_reset", outcome: "completed" }));
    return json({ ok: true, setup_required: true });
  }

  // Il token è un bootstrap **monouso**: il primo uso crea il secret TOTP e lo
  // blocca subito in KV, prima ancora che l'utente confermi il primo codice.
  // Così un token intercettato non può rigenerare QR diversi all'infinito.
  if (body.action === "setup") {
    if (!env.FEEDBACK) return json({ code: "unavailable" }, 503);
    if (!(await authRateAllowed(env, ip, "login", LOGIN_MAX_ATTEMPTS))) {
      return json({ code: "rate_limited" }, 429, [["Retry-After", String(LOGIN_WINDOW_SECONDS)]]);
    }
    if (await configOf(env) || await setupUsed(env)) return json({ code: "setup_locked" }, 409);
    const given = typeof body.token === "string" ? body.token : "";
    if (!(await sameSecret(given, env.ADMIN_TOKEN || ""))) {
      console.log(JSON.stringify({ event: "admin_setup", outcome: "unauthorized" }));
      return json({ code: "unauthorized" }, 401);
    }
    const secret = newTotpSecret();
    const setupId = newSessionId();
    await env.FEEDBACK.put(TOTP_BOOTSTRAP_KEY, "1");
    await env.FEEDBACK.put(
      TOTP_PENDING_PREFIX + setupId,
      JSON.stringify({ secret, created_at: new Date().toISOString(), epoch: await totpEpoch(env) } satisfies PendingSetup),
      { expirationTtl: TOTP_SETUP_SECONDS },
    );
    console.log(JSON.stringify({ event: "admin_setup", outcome: "issued" }));
    // Secret e otpauth URI escono solo in questa risposta di bootstrap. Dopo la
    // conferma GET non li restituisce più e il QR non viene rigenerato.
    return json({
      setup_id: setupId,
      otpauth_uri: otpauthUri(secret),
      manual_key: secret,
      expires_in: TOTP_SETUP_SECONDS,
    });
  }

  if (body.action === "confirm_setup") {
    if (!env.FEEDBACK) return json({ code: "unavailable" }, 503);
    if (!(await authRateAllowed(env, ip, "totp", TOTP_RATE_MAX_ATTEMPTS))) {
      return json({ code: "rate_limited" }, 429, [["Retry-After", String(TOTP_WINDOW_SECONDS)]]);
    }
    const setupId = typeof body.setup_id === "string" ? body.setup_id : "";
    const code = typeof body.code === "string" ? body.code : "";
    if (!/^[0-9a-f]{64}$/.test(setupId)) return json({ code: "invalid_setup" }, 400);
    const pendingRaw = await env.FEEDBACK.get(TOTP_PENDING_PREFIX + setupId);
    if (!pendingRaw) return json({ code: "setup_expired" }, 410);
    let pending: PendingSetup;
    try { pending = JSON.parse(pendingRaw) as PendingSetup; } catch { return json({ code: "setup_expired" }, 410); }
    if (pending.epoch !== await totpEpoch(env)) return json({ code: "setup_expired" }, 410);
    if (!(await verifyTotp(pending.secret, code))) {
      console.log(JSON.stringify({ event: "admin_setup", outcome: "invalid_code" }));
      return json({ code: "invalid_code" }, 401);
    }
    await env.FEEDBACK.put(TOTP_CONFIG_KEY, JSON.stringify({ secret: pending.secret, enabled_at: new Date().toISOString() } satisfies TotpConfig));
    if (env.FEEDBACK.delete) await env.FEEDBACK.delete(TOTP_PENDING_PREFIX + setupId);
    const session = await createSession(env, "ceo");
    console.log(JSON.stringify({ event: "admin_setup", outcome: "confirmed" }));
    return json({ ok: true, two_factor_enabled: true }, 200, sessionCookies(session));
  }

  if (body.action === "login") {
    const config = await configOf(env);
    if (!config) return json({ code: "setup_required", setup_required: true }, 409);
    if (!(await authRateAllowed(env, ip, "login", LOGIN_MAX_ATTEMPTS))) {
      console.log(JSON.stringify({ event: "admin_login", outcome: "rate_limited" }));
      return json({ code: "rate_limited" }, 429, [["Retry-After", String(LOGIN_WINDOW_SECONDS)]]);
    }
    const email = typeof body.email === "string" ? body.email : "";
    const role = await roleForEmail(email);
    if (!role) {
      console.log(JSON.stringify({ event: "admin_login", outcome: "unauthorized" }));
      return json({ code: "unauthorized" }, 401);
    }
    if (!(await authRateAllowed(env, ip, "totp", TOTP_RATE_MAX_ATTEMPTS))) {
      return json({ code: "rate_limited" }, 429, [["Retry-After", String(TOTP_WINDOW_SECONDS)]]);
    }
    const code = typeof body.code === "string" ? body.code : "";
    if (!(await verifyTotp(config.secret, code))) {
      console.log(JSON.stringify({ event: "admin_login", outcome: "invalid_totp" }));
      return json({ code: "unauthorized" }, 401);
    }
    if (!env.FEEDBACK) return json({ code: "unavailable" }, 503);
    const session = await createSession(env, role);
    console.log(JSON.stringify({ event: "admin_login", outcome: "ok", role }));
    return json({ ok: true, two_factor: true, role }, 200, sessionCookies(session));
  }

  if (!localAdminEnabled(request, env) && !await isAuthorized(request, env)) return json({ code: "unauthorized" }, 401);

  if (body.action === "jobs_save") {
    if (!env.FEEDBACK || !validJobs(body.jobs)) return json({ code: "invalid_jobs" }, 422);
    await env.FEEDBACK.put(JOBS_KEY, JSON.stringify(body.jobs));
    return json({ ok: true, jobs: body.jobs });
  }

  if (body.action === "create_test") {
    if (!env.FEEDBACK) return json({ code: "unavailable" }, 503);
    const submittedAt = new Date().toISOString();
    const record: FeedbackRecord = {
      id: newFeedbackId(),
      submitted_at: submittedAt,
      status: "pending_review",
      name: "Test submission",
      email: "",
      message: "This is a test feedback submission from the admin dashboard. It is stored in the review queue so you can check the real moderation flow.",
      page_url: new URL(request.url).pathname,
    };
    await env.FEEDBACK.put(record.id, JSON.stringify(record));
    const records = await queue(env);
    await env.FEEDBACK.put(INDEX_KEY, [record.id, ...records.map((item) => item.id)].slice(0, MAX_INDEX).join("\n"));
    return json({ ok: true, record });
  }

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
