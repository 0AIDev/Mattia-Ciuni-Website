import { isValidEmail } from "../../lib/disposable-domains";

interface RateLimitStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface Env {
  RESEND_API_KEY?: string;
  RESEND_WELCOME_TEMPLATE_ID?: string;
  RESEND_FROM_EMAIL?: string;
  BREVO_API_KEY?: string;
  BREVO_LIST_ID?: string;
  RATE_LIMIT?: RateLimitStore;
}

interface PagesContext {
  request: Request;
  env: Env;
}

interface SubscribeBody {
  email?: unknown;
  company_website?: unknown;
  source?: unknown;
  medium?: unknown;
  campaign?: unknown;
  content?: unknown;
  term?: unknown;
  landing_page?: unknown;
  referrer?: unknown;
}

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 5;
const MAX_FIELD_LENGTH = 200;

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
  // A missing KV binding must not make the endpoint globally unusable. Use a
  // short-lived key only when an address is available; Pages always supplies
  // CF-Connecting-IP in production. Unknown callers remain conservatively limited.
  if (!store) return false;
  const key = `rl:newsletter:${ip}`;
  const current = Number.parseInt((await store.get(key)) || "0", 10);
  if (current >= MAX_REQUESTS) return false;
  await store.put(key, String(current + 1), { expirationTtl: WINDOW_SECONDS });
  return true;
}

function textField(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, MAX_FIELD_LENGTH) : "";
}

function attribution(request: Request, body: SubscribeBody) {
  const url = new URL(request.url);
  return {
    SOURCE: textField(body.source) || "direct",
    MEDIUM: textField(body.medium) || "none",
    CAMPAIGN: textField(body.campaign),
    CONTENT: textField(body.content),
    TERM: textField(body.term),
    LANDING_PAGE: textField(body.landing_page) || `${url.pathname}${url.search}`,
    REFERRER: textField(body.referrer) || textField(request.headers.get("Referer")),
    SUBSCRIBED_AT: new Date().toISOString(),
  };
}

async function sendWelcome(env: Env, email: string, variables: Record<string, string>) {
  if (!env.RESEND_API_KEY || !env.RESEND_WELCOME_TEMPLATE_ID || !env.RESEND_FROM_EMAIL) {
    throw new Error("missing_resend_config");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: [email],
      template: { id: env.RESEND_WELCOME_TEMPLATE_ID, variables },
    }),
  });
  if (!response.ok) throw new Error(`resend_${response.status}`);
}

async function upsertBrevo(env: Env, email: string, attributes: Record<string, string>) {
  if (!env.BREVO_API_KEY) throw new Error("missing_brevo_config");
  const listIds = env.BREVO_LIST_ID ? [Number(env.BREVO_LIST_ID)] : undefined;
  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      attributes,
      updateEnabled: true,
      ...(listIds?.every(Number.isInteger) ? { listIds } : {}),
    }),
  });
  if (!response.ok && response.status !== 204) throw new Error(`brevo_${response.status}`);
}

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  const started = Date.now();
  const finish = (response: Response, outcome: string) => {
    // Never log email, IP, provider bodies, attribution values, or credentials.
    console.log(JSON.stringify({ event: "newsletter_subscribe", outcome, latency_ms: Date.now() - started }));
    return response;
  };

  if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json") {
    return finish(json({ code: "invalid_request" }, 415), "invalid_content_type");
  }

  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return finish(json({ code: "invalid_request" }, 400), "invalid_json");
  }

  if (typeof body.company_website === "string" && body.company_website.trim()) {
    return finish(json({ ok: true }, 200, { "X-Robots-Tag": "noindex" }), "honeypot");
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email) || email.length > 254) {
    return finish(json({ code: "invalid_email" }, 400), "invalid_email");
  }

  if (!(await allowed(env.RATE_LIMIT, ipOf(request)))) {
    return finish(json({ code: "rate_limited" }, 429, { "Retry-After": String(WINDOW_SECONDS) }), "rate_limited");
  }

  if (!env.RESEND_API_KEY || !env.RESEND_WELCOME_TEMPLATE_ID || !env.RESEND_FROM_EMAIL || !env.BREVO_API_KEY) {
    return finish(json({ code: "unavailable" }, 503), "missing_provider_config");
  }

  const fields = attribution(request, body);
  try {
    await upsertBrevo(env, email, fields);
    await sendWelcome(env, email, fields);
    return finish(json({ ok: true }, 200, { "X-Robots-Tag": "noindex" }), "subscribed");
  } catch (error) {
    const outcome = error instanceof Error ? error.message.split("_")[0] : "provider_error";
    return finish(json({ code: "provider_error" }, 502), outcome);
  }
};
