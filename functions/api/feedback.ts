// @ts-expect-error Pages bundles extensionless function imports; Node's offline loader needs `.ts`.
import { supabaseConfigured, supabaseRequest } from "../lib/supabase.ts";
// @ts-expect-error Pages bundles extensionless function imports; Node's offline loader needs `.ts`.
import { supabaseKv } from "../lib/supabase-kv.ts";
// @ts-expect-error Pages bundles extensionless function imports; Node's offline loader needs `.ts`.
import { FEEDBACK_EMAIL_ANON, FEEDBACK_EMAIL_NAMED } from "../lib/feedback-email-template.ts";

// POST /api/feedback: salva un feedback inviato dal form della sezione
// /feedback/ in KV, pronto da recensire e pubblicare.
//
// Dove finisce: binding KV `FEEDBACK` (chiave `fb:<timestamp>:<rand>`, valore
// JSON completo) + lista `fb:index` dei programmi, così la review è una lettura
// dell'indice e non uno scan. Senza binding la richiesta risponde 503: un
// feedback che si perde è peggio di un form che dice la verità.
//
// La notifica email a Mattia parte dopo il salvataggio tramite Brevo, sul piano
// gratuito, e non è mai la cosa da cui dipende il feedback: se fallisce, il record
// resta in coda con `notification_status: "failed"` e la review lo legge in KV o
// dalla dashboard. Il link dentro la notifica si compone dall'host che sta
// servendo la pagina, non da una costante.
//
// Dopo il salvataggio parte anche la conferma a chi ha lasciato un'email, via
// Resend, con il template React Email congelato in
// `functions/lib/feedback-email-template.ts` (`npm run email:template`): la Function
// non può importare JSX, quindi legge due stringhe e sostituisce il nome. Senza
// indirizzo, o senza chiave Resend, non parte niente e lo stato lo dice:
// `confirmation_status`.

interface RateLimitStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}
interface FeedbackStore {
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  get(key: string): Promise<string | null>;
}

interface Env {
  FEEDBACK?: FeedbackStore;
  RATE_LIMIT?: RateLimitStore;
  BREVO_API_KEY?: string;
  BREVO_FROM_EMAIL?: string;
  BREVO_FROM_NAME?: string;
  FEEDBACK_NOTIFY_TO?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  SITE_URL?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

interface FeedbackBody {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  company_website?: unknown;
  page_url?: unknown;
}

const WINDOW_SECONDS = 600;
const MAX_REQUESTS = 3;
// Un feedback vero sta in qualche KB. Il tetto si applica ai byte letti, non a
// quelli dichiarati: l'endpoint è pubblico e non ha motivo di leggere un corpo
// grande per poi scartarlo.
const MAX_BODY_BYTES = 16384;
const MAX_NAME = 80;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 4000;
const MAX_INDEX = 500;

function json(body: Record<string, unknown>, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function ipOf(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    request.headers.get("True-Client-IP") ||
    "unknown"
  );
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function safePagePath(value: unknown, request: Request): string {
  const fallback = new URL(request.url).pathname;
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const url = new URL(value, request.url);
    return url.origin === new URL(request.url).origin ? `${url.pathname}${url.search}`.slice(0, 300) : fallback;
  } catch {
    return fallback;
  }
}

async function allowed(store: RateLimitStore | FeedbackStore | undefined, ip: string): Promise<boolean> {
  if (!store) return false;
  const key = `rl:feedback:${ip}`;
  const current = Number.parseInt((await store.get(key)) || "0", 10);
  if (current >= MAX_REQUESTS) return false;
  await store.put(key, String(current + 1), { expirationTtl: WINDOW_SECONDS });
  return true;
}

/**
 * Quale dominio serve la pagina, per il link nella notifica.
 *
 * `SITE_URL` se il progetto la imposta (dominio custom), altrimenti l'host della
 * richiesta. Non una costante: il link deve portare alla dashboard **del deploy
 * che ha ricevuto il feedback**, e un dominio scritto a mano è esattamente il
 * guasto che questo sito ha già pagato una volta (indirizzi dichiarati su un host
 * e sito vivo su un altro).
 */
function siteOrigin(request: Request, env: Env): string {
  const configured = (env.SITE_URL || "").trim().replace(/\/+$/, "");
  if (configured) return configured;
  try {
    return new URL(request.url).origin;
  } catch {
    return "";
  }
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '\"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

async function notifyMattia(
  env: Env,
  record: { id: string; name: string; email: string; message: string; page_url: string; submitted_at: string },
  queueUrl: string,
): Promise<"sent" | "failed" | "not_configured"> {
  if (!env.BREVO_API_KEY) return "not_configured";
  const to = env.FEEDBACK_NOTIFY_TO || "ceo@usepayle.com";
  const senderEmail = env.BREVO_FROM_EMAIL || "ceo@usepayle.com";
  const senderName = env.BREVO_FROM_NAME || "Mattia Ciuni";
  const subject = `New Payle feedback${record.name ? ` from ${record.name}` : ""}`;
  const htmlContent = `<p><strong>New feedback is waiting for review.</strong></p><p><strong>From:</strong> ${escapeHtml(record.name || "Anonymous")}${record.email ? ` (${escapeHtml(record.email)})` : ""}</p><p><strong>Page:</strong> ${escapeHtml(record.page_url)}</p><p><strong>Submitted:</strong> ${escapeHtml(record.submitted_at)}</p><blockquote style="white-space:pre-wrap">${escapeHtml(record.message)}</blockquote>${queueUrl ? `<p><a href="${escapeHtml(queueUrl + "/admin/feedback/")}">Open the review queue</a></p>` : ""}`;
  const textContent = `New feedback is waiting for review.\n\nFrom: ${record.name || "Anonymous"}${record.email ? ` (${record.email})` : ""}\nPage: ${record.page_url}\nSubmitted: ${record.submitted_at}\n\n${record.message}${queueUrl ? `\n\nOpen the review queue: ${queueUrl}/admin/feedback/` : ""}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Idempotency-Key": `feedback-notification:${record.id}`,
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: to, name: "Mattia Ciuni" }],
        subject,
        htmlContent,
        textContent,
      }),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Conferma a chi ha scritto il feedback, con lo stesso template delle anteprime.
 *
 * Il nome è quello che la persona ha davvero lasciato nel form: se il campo è
 * vuoto si usa la variante senza nome, invece di inventarne uno. Il fallimento
 * non tocca il feedback, che è già salvato: cambia solo `confirmation_status`.
 */
async function confirmToAuthor(
  env: Env,
  record: { name: string; email: string },
): Promise<"sent" | "failed" | "not_configured" | "no_recipient"> {
  if (!record.email) return "no_recipient";
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) return "not_configured";
  const name = escapeHtml(record.name);
  const html = record.name
    ? FEEDBACK_EMAIL_NAMED.replaceAll("{{NAME}}", name)
    : FEEDBACK_EMAIL_ANON;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        // La stessa richiesta ripetuta non deve mandare due mail.
        "Idempotency-Key": `feedback-confirmation:${record.email}:${record.name}`,
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [record.email],
        reply_to: "ceo@usepayle.com",
        subject: "Your feedback reached me",
        html,
      }),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  } finally {
    clearTimeout(timeout);
  }
}

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  const started = Date.now();
  const finish = (response: Response, outcome: string) => {
    // Nessun contenuto del feedback nei log: la review lo legge in KV.
    console.log(JSON.stringify({ event: "feedback_submit", outcome, latency_ms: Date.now() - started }));
    return response;
  };

  if (!sameOrigin(request)) {
    return finish(json({ code: "forbidden" }, 403), "cross_origin");
  }

  if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json") {
    return finish(json({ code: "invalid_request" }, 415), "invalid_content_type");
  }

  // Si legge e si misura: `Content-Length` manca del tutto in chunked, quindi il
  // tetto non può dipendere da quello che il client dichiara.
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return finish(json({ code: "invalid_request" }, 400), "invalid_json");
  }
  if (raw.length > MAX_BODY_BYTES) {
    return finish(json({ code: "invalid_request" }, 413), "body_too_large");
  }

  let body: FeedbackBody;
  try {
    body = JSON.parse(raw) as FeedbackBody;
  } catch {
    return finish(json({ code: "invalid_request" }, 400), "invalid_json");
  }

  // Honeypot: come il form della newsletter, il campo è invisibile a chi legge.
  if (typeof body.company_website === "string" && body.company_website.trim()) {
    return finish(json({ ok: true }, 200, { "X-Robots-Tag": "noindex" }), "honeypot");
  }

  const message = text(body.message, MAX_MESSAGE);
  if (message.length < 20) {
    return finish(json({ code: "invalid_message" }, 400), "invalid_message");
  }

  const storage = supabaseKv(env) || env.FEEDBACK;
  if (!storage) {
    return finish(json({ code: "unavailable" }, 503), "missing_feedback_storage");
  }

  // RATE_LIMIT è il binding dedicato in produzione. La stessa coda è un fallback
  // sicuro per preview/local e per un deploy in cui il binding opzionale non è
  // ancora stato aggiunto: meglio una coda funzionante con chiavi temporanee
  // separate che bloccare ogni invio con un falso rate limit.
  const rateLimitStore = env.RATE_LIMIT || storage;
  if (!rateLimitStore) {
    return finish(json({ code: "rate_limit_unavailable" }, 503), "missing_rate_limit_binding");
  }
  if (!(await allowed(rateLimitStore, ipOf(request)))) {
    return finish(json({ code: "rate_limited" }, 429, { "Retry-After": String(WINDOW_SECONDS) }), "rate_limited");
  }

  // Nome ed email sono opzionali: l'autore può restare un'iniziale, ma senza
  // canale di risposta la pubblicazione non può accreditare nessuno.
  const name = text(body.name, MAX_NAME);
  const email = text(body.email, MAX_EMAIL).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return finish(json({ code: "invalid_email" }, 400), "invalid_email");
  }

  const now = new Date().toISOString();
  const id = `fb:${now.replace(/[:.]/g, "-")}:${Math.random().toString(36).slice(2, 8)}`;
  const record = {
    id,
    submitted_at: now,
    status: "pending_review" as const,
    name,
    email,
    message,
    page_url: safePagePath(body.page_url, request),
    notification_status: "not_configured" as "sent" | "failed" | "not_configured",
    confirmation_status: "not_configured" as "sent" | "failed" | "not_configured" | "no_recipient",
  };

  try {
    await storage.put(id, JSON.stringify(record));
    // L'indice tiene gli ultimi MAX_INDEX id: è la coda di review.
    const currentIndex = (await storage.get("fb:index")) || "";
    const ids = [id, ...currentIndex.split("\n").filter(Boolean)].slice(0, MAX_INDEX);
    await storage.put("fb:index", ids.join("\n"));

    if (supabaseConfigured(env)) {
      const { response } = await supabaseRequest(env, "feedback_submissions?on_conflict=legacy_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          legacy_id: record.id,
          submitted_at: record.submitted_at,
          status: record.status,
          name: record.name,
          email: record.email,
          message: record.message,
          page_url: record.page_url,
          notification_status: record.notification_status,
        }),
      });
      if (!response.ok) throw new Error(`supabase_feedback_${response.status}`);
    }

    // Una notifica fallita non deve far perdere il feedback: il record resta
    // in coda e conserva lo stato, così può essere rilevato dalla dashboard.
    record.notification_status = await notifyMattia(env, record, siteOrigin(request, env));
    record.confirmation_status = await confirmToAuthor(env, record);
    await storage.put(id, JSON.stringify(record));
    if (supabaseConfigured(env)) {
      const { response } = await supabaseRequest(env, `feedback_submissions?legacy_id=eq.${encodeURIComponent(record.id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ notification_status: record.notification_status }),
      });
      if (!response.ok) console.error(JSON.stringify({ event: "feedback_supabase_update", outcome: "failed", status: response.status }));
    }
  } catch {
    return finish(json({ code: "provider_error" }, 502), "kv_write_error");
  }

  return finish(json({ ok: true }, 200, { "X-Robots-Tag": "noindex" }), "stored");
};
