export interface SupabaseEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export function supabaseConfigured(env: SupabaseEnv): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Le tabelle del pannello esistono davvero?
 *
 * `supabaseConfigured` dice che le due variabili ci sono, non che lo schema e'
 * stato creato: sono due cose diverse, e la seconda e' quella che fa fallire un
 * salvataggio. Servono entrambe, quindi il pannello le chiede separatamente.
 *
 * La prova e' una GET su `admin_content` con `limit=0`: 200 con un array vuoto
 * se la tabella c'e', 404 con `PGRST205` se non c'e'. Non serve leggere niente,
 * serve sapere se la tabella risponde.
 */
export async function supabaseTablesReady(env: SupabaseEnv): Promise<boolean> {
  if (!supabaseConfigured(env)) return false;
  try {
    const { response } = await supabaseRequest(env, "admin_content?select=id&limit=0");
    return response.ok;
  } catch {
    return false;
  }
}

export async function supabaseRequest<T = unknown>(
  env: SupabaseEnv,
  resource: string,
  init: RequestInit = {},
): Promise<{ response: Response; data: T | null }> {
  if (!supabaseConfigured(env)) throw new Error("supabase_not_configured");
  const base = env.SUPABASE_URL!.replace(/\/+$/, "");
  const headers = new Headers(init.headers);
  headers.set("apikey", env.SUPABASE_SERVICE_ROLE_KEY!);
  headers.set("Authorization", `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY!}`);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${base}/rest/v1/${resource.replace(/^\//, "")}`, {
    ...init,
    headers,
  });
  const text = await response.text();
  let data: T | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = null;
    }
  }
  return { response, data };
}
