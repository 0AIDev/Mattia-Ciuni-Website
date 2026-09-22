// @ts-expect-error Pages bundles extensionless function imports; Node's offline loader needs `.ts`.
import { supabaseRequest, type SupabaseEnv } from "./supabase.ts";

export interface SupabaseKvStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

type KvRow = { value: string; expires_at: string | null };

function expiry(options?: { expirationTtl?: number }): string | null {
  return options?.expirationTtl
    ? new Date(Date.now() + options.expirationTtl * 1000).toISOString()
    : null;
}

export function supabaseKv(env: SupabaseEnv): SupabaseKvStore | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;

  return {
    async get(key) {
      const resource = `private_kv?select=value,expires_at&key=eq.${encodeURIComponent(key)}&limit=1`;
      const { response, data } = await supabaseRequest<KvRow[]>(env, resource);
      if (!response.ok) throw new Error(`supabase_kv_get_${response.status}`);
      const row = Array.isArray(data) ? data[0] : undefined;
      if (!row) return null;
      if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
        await this.delete(key);
        return null;
      }
      return row.value;
    },
    async put(key, value, options) {
      const { response } = await supabaseRequest(env, "private_kv?on_conflict=key", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ key, value, expires_at: expiry(options) }),
      });
      if (!response.ok) throw new Error(`supabase_kv_put_${response.status}`);
    },
    async delete(key) {
      const { response } = await supabaseRequest(env, `private_kv?key=eq.${encodeURIComponent(key)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });
      if (!response.ok) throw new Error(`supabase_kv_delete_${response.status}`);
    },
  };
}
