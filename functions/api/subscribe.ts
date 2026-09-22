import { isValidEmail } from "../../lib/disposable-domains";
import { canonicalizeSubscriberEmail } from "../../lib/email-normalization";
// @ts-expect-error Pages bundles extensionless function imports; Node's offline loader needs `.ts`.
import { supabaseConfigured, supabaseRequest } from "../lib/supabase.ts";

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
  BEEHIIV_API_KEY?: string;
  BEEHIIV_PUBLICATION_ID?: string;
  RATE_LIMIT?: RateLimitStore;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
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

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
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
      "Idempotency-Key": `newsletter-welcome:${email}`,
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: [email],
      template: { id: env.RESEND_WELCOME_TEMPLATE_ID, variables },
    }),
  });
  if (!response.ok) throw new Error(`resend_${response.status}`);
}

async function brevoListMembership(env: Env, email: string): Promise<boolean> {
  if (!env.BREVO_API_KEY) throw new Error("missing_brevo_config");
  const response = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}?limit=50&offset=0`, {
    headers: { "api-key": env.BREVO_API_KEY, Accept: "application/json" },
  });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`brevo_lookup_${response.status}`);
  const contact = (await response.json()) as { listIds?: number[] };
  return !!env.BREVO_LIST_ID && contact.listIds?.includes(Number(env.BREVO_LIST_ID)) === true;
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

async function supabaseSubscriberExists(env: Env, canonicalEmail: string): Promise<boolean> {
  const resource = `newsletter_subscribers?select=id&canonical_email=eq.${encodeURIComponent(canonicalEmail)}&status=eq.subscribed&limit=1`;
  const { response, data } = await supabaseRequest<Array<{ id: string }>>(env, resource);
  if (!response.ok) throw new Error(`supabase_lookup_${response.status}`);
  return Array.isArray(data) && data.length > 0;
}

async function upsertSupabaseSubscriber(env: Env, email: string, canonicalEmail: string, attributes: Record<string, string>) {
  const { response } = await supabaseRequest(env, "newsletter_subscribers?on_conflict=canonical_email", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      email,
      canonical_email: canonicalEmail,
      status: "subscribed",
      source: attributes.SOURCE,
      medium: attributes.MEDIUM,
      campaign: attributes.CAMPAIGN,
      content: attributes.CONTENT,
      term: attributes.TERM,
      landing_page: attributes.LANDING_PAGE,
      referrer: attributes.REFERRER,
      last_seen_at: attributes.SUBSCRIBED_AT,
    }),
  });
  if (!response.ok) throw new Error(`supabase_subscriber_${response.status}`);
}

async function upsertBeehiiv(env: Env, email: string, attributes: Record<string, string>) {
  if (!env.BEEHIIV_API_KEY || !env.BEEHIIV_PUBLICATION_ID) throw new Error("missing_beehiiv_config");
  const response = await fetch(`https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.BEEHIIV_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      reactivate_existing: true,
      send_welcome_email: false,
      utm_source: attributes.SOURCE,
      utm_medium: attributes.MEDIUM,
      utm_campaign: attributes.CAMPAIGN || undefined,
      referring_site: attributes.REFERRER || undefined,
    }),
  });
  if (!response.ok && response.status !== 409) throw new Error(`beehiiv_${response.status}`);
}

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  const started = Date.now();
  const finish = (response: Response, outcome: string) => {
    // Never log email, IP, provider bodies, attribution values, or credentials.
    console.log(JSON.stringify({ event: "newsletter_subscribe", outcome, latency_ms: Date.now() - started }));
    return response;
  };

  if (!sameOrigin(request)) {
    return finish(json({ code: "forbidden" }, 403), "cross_origin");
  }

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

  const submittedEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const email = canonicalizeSubscriberEmail(submittedEmail);
  if (!isValidEmail(email) || email.length > 254) {
    return finish(json({ code: "invalid_email" }, 400), "invalid_email");
  }

  if (!(await allowed(env.RATE_LIMIT, ipOf(request)))) {
    return finish(json({ code: "rate_limited" }, 429, { "Retry-After": String(WINDOW_SECONDS) }), "rate_limited");
  }

  if (!env.RESEND_API_KEY || !env.RESEND_WELCOME_TEMPLATE_ID || !env.RESEND_FROM_EMAIL || !env.BREVO_API_KEY || !env.BREVO_LIST_ID || !env.BEEHIIV_API_KEY || !env.BEEHIIV_PUBLICATION_ID) {
    return finish(json({ code: "unavailable" }, 503), "missing_provider_config");
  }
  if (!supabaseConfigured(env) && !env.BREVO_API_KEY) {
    return finish(json({ code: "unavailable" }, 503), "missing_storage_config");
  }

  const fields = attribution(request, body);
  try {
    const alreadySubscribed = supabaseConfigured(env)
      ? await supabaseSubscriberExists(env, email)
      : await brevoListMembership(env, email);
    if (!alreadySubscribed) await sendWelcome(env, email, fields);
    if (supabaseConfigured(env)) await upsertSupabaseSubscriber(env, submittedEmail, email, fields);
    await upsertBrevo(env, email, fields);
    await upsertBeehiiv(env, email, fields);
    if (alreadySubscribed) {
      return finish(json({ code: "already_subscribed" }, 409, { "X-Robots-Tag": "noindex" }), "already_subscribed");
    }
    return finish(json({ ok: true }, 200, { "X-Robots-Tag": "noindex" }), "subscribed");
  } catch (error) {
    const outcome = error instanceof Error ? error.message.split("_")[0] : "provider_error";
    return finish(json({ code: "provider_error" }, 502), outcome);
  }
};
