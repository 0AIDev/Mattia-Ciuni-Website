// @ts-expect-error Pages bundles extensionless TS imports; Node's offline loader needs `.ts`.
import { supabaseConfigured, supabaseRequest } from "../../lib/supabase.ts";

interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string; SITE_URL?: string; }
interface Context { request: Request; env: Env; }

async function sha256(value: string): Promise<string> { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""); }
function redirectTo(request: Request, env: Env, path: string) { return Response.redirect(`${(env.SITE_URL || new URL(request.url).origin).replace(/\/+$/, "")}${path}`, 302); }

export const onRequestGet = async ({ request, env }: Context): Promise<Response> => {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!token || !supabaseConfigured(env)) return redirectTo(request, env, "/careers/confirmed/?status=invalid");
  const tokenHash = await sha256(token);
  try {
    const lookup = await supabaseRequest<Array<{ id: string; job_slug: string; verification_expires_at: string | null; email_verified: boolean }>>(env, `careers_applications?select=id,job_slug,verification_expires_at,email_verified&verification_token=eq.${encodeURIComponent(tokenHash)}&limit=1`);
    const record = lookup.data?.[0];
    if (!lookup.response.ok || !record || record.email_verified || !record.verification_expires_at || new Date(record.verification_expires_at).getTime() <= Date.now()) return redirectTo(request, env, "/careers/confirmed/?status=expired");
    const updated = await supabaseRequest(env, `careers_applications?id=eq.${encodeURIComponent(record.id)}&verification_token=eq.${encodeURIComponent(tokenHash)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ email_verified: true, verification_token: null, verification_expires_at: null }) });
    if (!updated.response.ok) return redirectTo(request, env, "/careers/confirmed/?status=error");
    // Lo slug passa alla pagina di conferma così il messaggio è per ruolo.
    // Encoding: gli slug sono safe, ma non si fa supposizioni su valori inseriti
    // a mano nel KV configurato.
    const slug = record.job_slug ? `?job=${encodeURIComponent(record.job_slug)}` : "";
    return redirectTo(request, env, `/careers/confirmed/${slug}`);
  } catch { return redirectTo(request, env, "/careers/confirmed/?status=error"); }
};
