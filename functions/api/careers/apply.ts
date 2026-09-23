// @ts-expect-error Pages bundles extensionless TS imports; Node's offline loader needs `.ts`.
import { getJob } from "../../../lib/careers/jobs.ts";
// @ts-expect-error Pages bundles extensionless TS imports; Node's offline loader needs `.ts`.
import { validateCareerApplication, type CareerApplicationInput } from "../../../lib/careers/validation.ts";
// @ts-expect-error Pages bundles extensionless TS imports; Node's offline loader needs `.ts`.
import { supabaseConfigured, supabaseRequest } from "../../lib/supabase.ts";
// @ts-expect-error Pages bundles extensionless TS imports; Node's offline loader needs `.ts`.
import { supabaseKv } from "../../lib/supabase-kv.ts";

interface Store { get(key: string): Promise<string | null>; put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>; }
interface Env { RATE_LIMIT?: Store; FEEDBACK?: Store; SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string; RESEND_API_KEY?: string; RESEND_FROM_EMAIL?: string; CAREERS_FROM_EMAIL?: string; CAREERS_NOTIFY_TO?: string; IP_HASH_SALT?: string; SITE_URL?: string; CAREERS_CV_BUCKET?: string; }
interface Context { request: Request; env: Env; }

const DAY_SECONDS = 86400;
const MAX_PER_DAY = 5;
const MAX_BODY_BYTES = 8000000;
const TOKEN_TTL = 172800;

function json(body: Record<string, unknown>, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } });
}
function ipOf(request: Request): string { return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || "unknown"; }
function sameOrigin(request: Request): boolean { const origin = request.headers.get("Origin"); if (!origin) return true; try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; } }
function randomToken(): string { const bytes = crypto.getRandomValues(new Uint8Array(48)); return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(""); }
async function sha256(value: string): Promise<string> { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""); }
async function allowed(store: Store | undefined, ip: string): Promise<boolean> { if (!store) return false; const key = `rl:careers:${ip}`; const current = Number.parseInt((await store.get(key)) || "0", 10); if (current >= MAX_PER_DAY) return false; await store.put(key, String(current + 1), { expirationTtl: DAY_SECONDS }); return true; }
function originOf(request: Request, env: Env): string { return (env.SITE_URL || new URL(request.url).origin).replace(/\/+$/, ""); }
function escapeHtml(value: string): string { return value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#39;" })[character] || character); }
async function configuredJob(env: Env, slug: string) {
  const store = env.FEEDBACK || supabaseKv(env);
  if (!store) return null;
  const raw = await store.get("content:jobs");
  if (!raw) return null;
  try {
    const jobs = JSON.parse(raw) as Array<{ slug?: unknown; status?: unknown; questions?: unknown }>;
    const match = jobs.find((candidate) => candidate.slug === slug && candidate.status === "open");
    return match || null;
  } catch { return null; }
}

async function uploadCv(env: Env, path: string, base64: string): Promise<boolean> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !base64.startsWith("JVBERi0")) return false;
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/${env.CAREERS_CV_BUCKET || "careers-cvs"}/${path}`, { method: "POST", headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/pdf", "x-upsert": "false" }, body: bytes });
  return response.ok;
}

export const onRequestPost = async ({ request, env }: Context): Promise<Response> => {
  if (!sameOrigin(request)) return json({ code: "forbidden" }, 403);
  if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json") return json({ code: "invalid_request" }, 415);
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ code: "invalid_request" }, 413);
  let body: CareerApplicationInput;
  try { body = JSON.parse(raw) as CareerApplicationInput; } catch { return json({ code: "invalid_request" }, 400); }
  if (typeof body.website === "string" && body.website.trim()) return json({ ok: true });
  const validation = validateCareerApplication(body);
  if (!validation.ok) return json({ code: "validation_error", fields: validation.fields }, 422);
  const { value } = validation;
  const staticJob = getJob(value.job_slug);
  const configured = await configuredJob(env, value.job_slug);
  const job = configured ? { ...staticJob, ...configured } : staticJob;
  if (!job || job.status !== "open") return json({ code: "job_unavailable" }, 422);
  const customErrors: Record<string, string> = {};
  for (const question of (job.questions || []) as Array<{ id: string; type: "text" | "textarea" | "url"; required: boolean; minimum: number }>) {
    const answer = value.custom_answers[question.id] || "";
    if ((question.required && !answer) || answer.length < question.minimum) customErrors[`custom_${question.id}`] = `This answer must contain at least ${question.minimum} characters.`;
    if (question.type === "url" && answer) {
      try { if (new URL(answer).protocol !== "https:") customErrors[`custom_${question.id}`] = "Enter a valid HTTPS URL."; } catch { customErrors[`custom_${question.id}`] = "Enter a valid HTTPS URL."; }
    }
  }
  if (Object.keys(customErrors).length) return json({ code: "validation_error", fields: customErrors }, 422);
  const rateStore = env.RATE_LIMIT || supabaseKv(env);
  if (!(await allowed(rateStore || undefined, ipOf(request)))) return json({ code: "rate_limited" }, 429, { "Retry-After": String(DAY_SECONDS) });
  if (!supabaseConfigured(env)) return json({ code: "unavailable" }, 503);
  if (!env.RESEND_API_KEY || !(env.CAREERS_FROM_EMAIL || env.RESEND_FROM_EMAIL)) return json({ code: "unavailable" }, 503);

  const emailHash = await sha256(`${value.email}:${env.IP_HASH_SALT || env.SUPABASE_SERVICE_ROLE_KEY}`);
  const ipHash = await sha256(`${ipOf(request)}:${env.IP_HASH_SALT || env.SUPABASE_SERVICE_ROLE_KEY}`);
  const rawToken = randomToken();
  const tokenHash = await sha256(rawToken);
  const expires = new Date(Date.now() + TOKEN_TTL * 1000).toISOString();
  try {
    const duplicate = await supabaseRequest<Array<{ id: string }>>(env, `careers_applications?select=id&job_slug=eq.${encodeURIComponent(value.job_slug)}&email=eq.${encodeURIComponent(value.email)}&limit=1`);
    if (!duplicate.response.ok) return json({ code: "provider_error" }, 502);
    if (duplicate.data?.length) return json({ code: "duplicate" }, 409);
    const cvPath = `careers/${value.job_slug}/${crypto.randomUUID()}-${value.cv_filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const inserted = await supabaseRequest<Array<{ id: string }>>(env, "careers_applications", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ job_slug: value.job_slug, full_name: value.full_name, email: value.email, email_hash: emailHash, country_timezone: value.country_timezone, github_url: value.github_url || null, portfolio_url: value.portfolio_url || null, artifact_link: value.artifact_link, artifact_description: value.artifact_description, motivation: value.motivation, custom_answers: value.custom_answers, cv_filename: value.cv_filename, cv_path: cvPath, verification_token: tokenHash, verification_expires_at: expires, ip_hash: ipHash }) });
    if (!inserted.response.ok) return json({ code: inserted.response.status === 409 ? "duplicate" : "provider_error" }, inserted.response.status === 409 ? 409 : 502);
    const applicationId = inserted.data?.[0]?.id;
    if (!await uploadCv(env, cvPath, value.cv_base64)) {
      if (applicationId) await supabaseRequest(env, `careers_applications?id=eq.${encodeURIComponent(applicationId)}`, { method: "DELETE" });
      return json({ code: "provider_error" }, 502);
    }
    const verifyUrl = `${originOf(request, env)}/api/careers/verify?token=${encodeURIComponent(rawToken)}`;
    const from = env.CAREERS_FROM_EMAIL || env.RESEND_FROM_EMAIL!;
    const safeName = escapeHtml(value.full_name);
    const title = String(job.title || "the role");
    const safeTitle = escapeHtml(title);
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `careers-verification:${tokenHash}` }, body: JSON.stringify({ from, to: [value.email], reply_to: "ceo@usepayle.com", subject: "Verify your application - Build with Payle", html: `<p>Hey ${safeName},</p><p>Thanks for applying for <strong>${safeTitle}</strong>.</p><p>One click to confirm. After that, I read everything personally:</p><p><a href="${verifyUrl}">Verify application</a></p><p>If it wasn't you, ignore this. Nothing gets published, nothing gets shared.</p><p>Mattia<br/>ceo@usepayle.com</p>`, text: `Hey ${value.full_name},\n\nThanks for applying for ${title}.\n\nVerify your application: ${verifyUrl}\n\nIf it wasn't you, ignore this.\n\nMattia\nceo@usepayle.com` }) });
    if (!response.ok) { if (applicationId) await supabaseRequest(env, `careers_applications?id=eq.${encodeURIComponent(applicationId)}`, { method: "DELETE" }); return json({ code: "provider_error" }, 502); }
    const notifyTo = env.CAREERS_NOTIFY_TO || "ceo@usepayle.com";
    await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `careers-notification:${applicationId || tokenHash}` }, body: JSON.stringify({ from, to: [notifyTo], reply_to: value.email, subject: `New application - ${title} - ${value.full_name}`, text: `New application\n\nJob: ${value.job_slug}\nName: ${value.full_name}\nEmail: ${value.email}\nCountry/timezone: ${value.country_timezone}\nArtifact: ${value.artifact_link}\n\nArtifact description (first 200 characters):\n${value.artifact_description.slice(0, 200)}\n\nApplication ID: ${applicationId || "unavailable"}` }) });
    return json({ ok: true });
  } catch { return json({ code: "provider_error" }, 502); }
};
