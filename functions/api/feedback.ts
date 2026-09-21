// POST /api/feedback: salva un feedback inviato dal form della sezione
// /feedback/ in KV, pronto da recensire e pubblicare.
//
// Dove finisce: binding KV `FEEDBACK` (chiave `fb:<timestamp>:<rand>`, valore
// JSON completo) + lista `fb:index` dei programmi, così la review è una lettura
// dell'indice e non uno scan. Senza binding la richiesta risponde 503: un
// feedback che si perde è peggio di un form che dice la verità.
//
// La notifica email a Mattia resta volutamente fuori: la review avviene
// leggendo KV (wrangler kv key get / dashboard), non a colpi di inbox.

interface RateLimitStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}
interface FeedbackStore {
  put(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
}

interface Env {
  FEEDBACK?: FeedbackStore;
  RATE_LIMIT?: RateLimitStore;
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

async function allowed(store: RateLimitStore | undefined, ip: string): Promise<boolean> {
  if (!store) return false;
  const key = `rl:feedback:${ip}`;
  const current = Number.parseInt((await store.get(key)) || "0", 10);
  if (current >= MAX_REQUESTS) return false;
  await store.put(key, String(current + 1), { expirationTtl: WINDOW_SECONDS });
  return true;
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  const started = Date.now();
  const finish = (response: Response, outcome: string) => {
    // Nessun contenuto del feedback nei log: la review lo legge in KV.
    console.log(JSON.stringify({ event: "feedback_submit", outcome, latency_ms: Date.now() - started }));
    return response;
  };

  if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json") {
    return finish(json({ code: "invalid_request" }, 415), "invalid_content_type");
  }

  let body: FeedbackBody;
  try {
    body = (await request.json()) as FeedbackBody;
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

  if (!(await allowed(env.RATE_LIMIT, ipOf(request)))) {
    return finish(json({ code: "rate_limited" }, 429, { "Retry-After": String(WINDOW_SECONDS) }), "rate_limited");
  }

  if (!env.FEEDBACK) {
    return finish(json({ code: "unavailable" }, 503), "missing_kv_binding");
  }

  // Nome ed email sono opzionali: l'autore può restare un'iniziale, ma senza
  // canale di risposta la pubblicazione non può accreditare nessuno.
  const name = text(body.name, MAX_NAME);
  const email = text(body.email, MAX_EMAIL).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return finish(json({ code: "invalid_email" }, 400), "invalid_email");
  }

  const url = new URL(request.url);
  const now = new Date().toISOString();
  const id = `fb:${now.replace(/[:.]/g, "-")}:${Math.random().toString(36).slice(2, 8)}`;
  const record = {
    id,
    submitted_at: now,
    status: "pending_review" as const,
    name,
    email,
    message,
    page_url: text(body.page_url, 300) || url.pathname,
    ip_first_octets: ipOf(request).split(".").slice(0, 2).join("."),
  };

  try {
    await env.FEEDBACK.put(id, JSON.stringify(record));
    // L'indice tiene gli ultimi MAX_INDEX id: è la coda di review.
    const currentIndex = (await env.FEEDBACK.get("fb:index")) || "";
    const ids = [id, ...currentIndex.split("\n").filter(Boolean)].slice(0, MAX_INDEX);
    await env.FEEDBACK.put("fb:index", ids.join("\n"));
  } catch {
    return finish(json({ code: "provider_error" }, 502), "kv_write_error");
  }

  return finish(json({ ok: true }, 200, { "X-Robots-Tag": "noindex" }), "stored");
};
