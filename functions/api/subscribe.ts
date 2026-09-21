import { isValidEmail } from "../../lib/disposable-domains";

interface RateLimitStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface Env {
  BUTTONDOWN_API_KEY?: string;
  RATE_LIMIT?: RateLimitStore;
}

interface PagesContext {
  request: Request;
  env: Env;
}

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 3;

function json(body: Record<string, unknown>, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

function ipOf(request: Request): string {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || "unknown";
}

async function allowed(store: RateLimitStore | undefined, ip: string): Promise<boolean> {
  // KV è obbligatorio in produzione: un rate limit in memoria sparirebbe a ogni
  // isolate e darebbe solo una falsa sensazione di protezione.
  if (!store) return false;
  const key = `rl:sub:${ip}`;
  const current = Number.parseInt((await store.get(key)) || "0", 10);
  if (current >= MAX_REQUESTS) return false;
  await store.put(key, String(current + 1), { expirationTtl: WINDOW_SECONDS });
  return true;
}

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  const started = Date.now();
  let outcome = "error";
  const finish = (response: Response, result: string) => {
    outcome = result;
    // Mai email, body o provider response: solo metadati non personali.
    console.log(JSON.stringify({ event: "newsletter_subscribe", outcome, latency_ms: Date.now() - started }));
    return response;
  };

  if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json") {
    return finish(json({ code: "invalid_request" }, 415), "invalid_content_type");
  }

  let body: { email?: unknown; company_website?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return finish(json({ code: "invalid_request" }, 400), "invalid_json");
  }

  // Bot silenzioso: stesso 200 dello scenario felice, nessuna chiamata al provider.
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

  if (!env.BUTTONDOWN_API_KEY) {
    return finish(json({ code: "unavailable" }, 503), "missing_provider_config");
  }

  try {
    const upstream = await fetch("https://api.buttondown.email/v1/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, notes: "source: mattiaciuni.it" }),
    });

    if (upstream.status === 409) {
      return finish(json({ code: "already_subscribed" }, 409), "duplicate");
    }
    if (!upstream.ok) {
      return finish(json({ code: "provider_error" }, 502), `provider_${upstream.status}`);
    }
    return finish(json({ ok: true }, 200, { "X-Robots-Tag": "noindex" }), "subscribed");
  } catch {
    return finish(json({ code: "provider_unavailable" }, 502), "provider_network_error");
  }
};
