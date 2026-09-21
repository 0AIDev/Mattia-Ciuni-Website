interface FeedbackStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete?(key: string): Promise<void>;
}

interface Env {
  FEEDBACK?: FeedbackStore;
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
const COOKIE = "mattia_feedback_admin";
const MAX_INDEX = 500;

function json(body: Record<string, unknown>, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      ...headers,
    },
  });
}

function tokenFrom(request: Request): string {
  const bearer = request.headers.get("Authorization");
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7).trim();
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function isAuthorized(request: Request, env: Env): boolean {
  return !!env.ADMIN_TOKEN && tokenFrom(request) === env.ADMIN_TOKEN;
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
      // Ignore malformed records rather than breaking the whole dashboard.
    }
  }
  return records;
}

async function saveQueue(env: Env, records: FeedbackRecord[]) {
  if (!env.FEEDBACK) return;
  await env.FEEDBACK.put(INDEX_KEY, records.map((record) => record.id).join("\n"));
}

export const onRequestGet = async ({ request, env }: PagesContext): Promise<Response> => {
  if (!isAuthorized(request, env)) return json({ code: "unauthorized" }, 401);
  if (!env.FEEDBACK) return json({ code: "unavailable" }, 503);
  const records = await queue(env);
  return json({ records });
};

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json") {
    return json({ code: "invalid_request" }, 415);
  }

  let body: { action?: unknown; token?: unknown; id?: unknown; reason?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ code: "invalid_request" }, 400);
  }

  if (body.action === "login") {
    if (!env.ADMIN_TOKEN || typeof body.token !== "string" || body.token !== env.ADMIN_TOKEN) {
      return json({ code: "unauthorized" }, 401);
    }
    return json({ ok: true }, 200, {
      "Set-Cookie": `${COOKIE}=${encodeURIComponent(env.ADMIN_TOKEN)}; Path=/; Max-Age=28800; HttpOnly; Secure; SameSite=Strict`,
    });
  }

  if (!isAuthorized(request, env)) return json({ code: "unauthorized" }, 401);
  if (!env.FEEDBACK) return json({ code: "unavailable" }, 503);

  const id = typeof body.id === "string" ? body.id : "";
  if (!id || (body.action !== "publish" && body.action !== "reject")) {
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
    record.reject_reason = typeof body.reason === "string" ? body.reason.slice(0, 200) : "Not selected for publication";
  }

  await env.FEEDBACK.put(id, JSON.stringify(record));
  const records = await queue(env);
  await saveQueue(env, records.filter((item) => item.id !== id));
  return json({ ok: true, record });
};
