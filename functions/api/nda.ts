// @ts-expect-error Pages bundles extensionless function imports; Node's native loader needs `.ts` for the offline test.
import { supabaseConfigured, supabaseRequest } from "../lib/supabase.ts";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}
interface Context { request: Request; env: Env; }

type Recipient = { id: string; expires_at: string; used_at: string | null };
const NDA_URL = "https://payle.up.railway.app/s/3XUuxQ1sgeDTXC";

function sha256(value: string): Promise<string> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)).then((digest) =>
    Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""),
  );
}

function response(body: string, status: number, headers: HeadersInit = {}) {
  return new Response(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

export const onRequestGet = async ({ request, env }: Context): Promise<Response> => {
  if (!supabaseConfigured(env)) return response("Not found", 404, { "Content-Type": "text/plain; charset=utf-8" });
  const token = new URL(request.url).searchParams.get("token")?.trim() || "";
  if (!/^[a-f0-9]{64,128}$/.test(token)) return response("Not found", 404, { "Content-Type": "text/plain; charset=utf-8" });
  const tokenHash = await sha256(token);
  try {
    const lookup = await supabaseRequest<Recipient[]>(env, `nda_recipients?select=id,expires_at,used_at&token_hash=eq.${encodeURIComponent(tokenHash)}&limit=1`);
    const record = lookup.data?.[0];
    if (!lookup.response.ok || !record || record.used_at || Date.parse(record.expires_at) <= Date.now()) {
      return response("Not found", 404, { "Content-Type": "text/plain; charset=utf-8" });
    }
    const claimed = await supabaseRequest<Recipient[]>(env, `nda_recipients?id=eq.${encodeURIComponent(record.id)}&used_at=is.null`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ used_at: new Date().toISOString() }),
    });
    if (!claimed.response.ok || !claimed.data?.length) return response("Not found", 404, { "Content-Type": "text/plain; charset=utf-8" });
    return new Response(JSON.stringify({ redirect: NDA_URL }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch {
    return response("Not found", 404, { "Content-Type": "text/plain; charset=utf-8" });
  }
};
