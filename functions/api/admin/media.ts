// GET  /api/admin/media  — elenco dei media con i metadati
// POST /api/admin/media  — { action: "upload" | "update" | "delete", ... }
//
// I file vivono in R2; i metadati (alt, caption, nome) in Supabase, con KV come
// fallback. La separazione e' voluta: un file da 8MB non entra in una riga
// jsonb, e un alt text senza il file non serve a nessuno.
//
// Il limite di corpo e' 12MB e la base64 aggiunge un terzo: e' il tetto reale
// della richiesta, non un controllo sul file, quindi va dichiarato per intero
// invece di fidarsi di `Content-Length`, che in chunked non c'e'.

// @ts-expect-error Pages bundles extensionless function imports; Node's native loader needs `.ts`.
import { supabaseConfigured, supabaseRequest } from "../../lib/supabase.ts";
// @ts-expect-error Pages bundles extensionless function imports; Node's native loader needs `.ts`.
import { supabaseKv } from "../../lib/supabase-kv.ts";
// @ts-expect-error Cloudflare bundles extensionless TS imports; Node's native strip loader needs `.ts` for the offline test.
import { MEDIA_MAX_BYTES, isAllowedContentType, kindForName, mediaUrl, safeMediaKey, type MediaItem } from "../../../lib/media.ts";
// @ts-expect-error Pages bundles extensionless function imports; Node's native loader needs `.ts`.
import { isAuthorized, json, sameOrigin, type Store } from "../../lib/admin-session.ts";

interface R2ObjectBody {
  key?: string;
  size?: number;
  uploaded?: Date;
  httpMetadata?: { contentType?: string };
}

interface R2Bucket {
  get(key: string): Promise<{ body?: ReadableStream | null; size?: number; uploaded?: Date; httpMetadata?: { contentType?: string } } | null>;
  put(key: string, value: ArrayBuffer | ReadableStream, options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<unknown>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number }): Promise<{ objects?: Array<{ key: string; size: number; uploaded?: Date; httpMetadata?: { contentType?: string } }> }>;
}

interface Env {
  FEEDBACK?: Store;
  RATE_LIMIT?: Store;
  MEDIA?: R2Bucket;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  LOCAL_ADMIN?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

const TABLE = "admin_media";
// 10MB in base64 sono ~13.4MB, piu' headers e JSON. Il tetto e' sul corpo
// ricevuto, e superarlo produce 413 prima di toccare R2.
const MAX_BODY_BYTES = Math.ceil(MEDIA_MAX_BYTES * 4 / 3) + 64 * 1024;
const META_PREFIX = "content:media:";
const META_INDEX_KEY = "content:media:index";
const MAX_ITEMS = 500;

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function isLoopback(request: Request): boolean {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

/**
 * Il bypass locale esiste perche' `npm run dev:pages` non ha un bucket R2: senza
 * di esso non si puo' provare il pannello in locale. E' doppio gate come
 * nell'endpoint admin principale, quindi non puo' mai autorizzare un hostname
 * deployato: anche con `LOCAL_ADMIN=1` in produzione, la richiesta deve arrivare
 * da loopback.
 */
function authorized(request: Request, env: Env): Promise<boolean> {
  if (env.LOCAL_ADMIN === "1" && isLoopback(request)) return Promise.resolve(true);
  return isAuthorized(request, env).then((role) => role === "ceo");
}

function metadataStore(env: Env): Store | null {
  if (env.FEEDBACK) return env.FEEDBACK;
  return supabaseKv(env);
}

function normalizeMeta(value: unknown): MediaItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<MediaItem>;
  if (typeof item.key !== "string" || !item.key.startsWith("content/")) return null;
  return {
    key: item.key,
    name: String(item.name || item.key.split("/").pop() || ""),
    kind: item.kind || "other",
    contentType: String(item.contentType || ""),
    size: Number(item.size || 0),
    alt: item.alt ? String(item.alt).slice(0, 300) : undefined,
    caption: item.caption ? String(item.caption).slice(0, 500) : undefined,
    uploadedAt: item.uploadedAt || undefined,
  };
}

async function loadMeta(env: Env): Promise<MediaItem[]> {
  if (supabaseConfigured(env)) {
    try {
      const result = await supabaseRequest<Array<Record<string, unknown>>>(env, `${TABLE}?select=*&order=uploaded_at.desc&limit=${MAX_ITEMS}`);
      if (result.response.ok && Array.isArray(result.data)) {
        return result.data.map((row) => normalizeMeta({ ...row, uploadedAt: row.uploaded_at })).filter((item): item is MediaItem => item !== null);
      }
    } catch {
      // Supabase non e' obbligatorio: sotto cade il fallback KV.
    }
  }
  const store = metadataStore(env);
  if (!store) return [];
  const index = (await store.get(META_INDEX_KEY) || "").split("\n").filter(Boolean);
  const items: MediaItem[] = [];
  for (const key of index.slice(0, MAX_ITEMS)) {
    const raw = await store.get(META_PREFIX + key);
    if (!raw) continue;
    try {
      const item = normalizeMeta(JSON.parse(raw));
      if (item) items.push(item);
    } catch {
      // Un metadato corrotto non deve far fallire l'intero elenco.
    }
  }
  return items;
}

async function saveMeta(env: Env, item: MediaItem): Promise<void> {
  if (supabaseConfigured(env)) {
    const result = await supabaseRequest<Array<Record<string, unknown>>>(env, `${TABLE}?on_conflict=key`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        key: item.key,
        name: item.name,
        kind: item.kind,
        content_type: item.contentType,
        size: item.size,
        alt: item.alt || null,
        caption: item.caption || null,
        uploaded_at: item.uploadedAt || new Date().toISOString(),
      }),
    });
    if (result.response.ok) return;
  }
  const store = metadataStore(env);
  if (!store) return;
  await store.put(META_PREFIX + item.key, JSON.stringify(item));
  const index = (await store.get(META_INDEX_KEY) || "").split("\n").filter(Boolean);
  if (!index.includes(item.key)) await store.put(META_INDEX_KEY, [...index, item.key].slice(-MAX_ITEMS).join("\n"));
}

async function deleteMeta(env: Env, key: string): Promise<void> {
  if (supabaseConfigured(env)) {
    await supabaseRequest(env, `${TABLE}?key=eq.${encodeURIComponent(key)}`, { method: "DELETE" }).catch(() => undefined);
  }
  const store = metadataStore(env);
  if (!store) return;
  await store.delete?.(META_PREFIX + key);
  const index = (await store.get(META_INDEX_KEY) || "").split("\n").filter(Boolean);
  if (index.includes(key)) await store.put(META_INDEX_KEY, index.filter((entry) => entry !== key).join("\n"));
}

export const onRequestGet = async ({ request, env }: PagesContext): Promise<Response> => {
  if (!(await authorized(request, env))) return json({ code: "unauthorized" }, 401);
  const bucket = env.MEDIA;
  if (!bucket) return json({ items: [], storage: "unconfigured" });
  const objects = await bucket.list({ prefix: "content/", limit: MAX_ITEMS });
  const stored = new Map((objects.objects || []).map((object) => [object.key, object]));
  const items = await loadMeta(env);
  // I file su R2 senza metadati sono un caso reale (upload riuscito, scrittura
  // metadati fallita): senza questa unione sparirebbero dalla libreria e
  // l'unico modo per trovarli sarebbe aprire il bucket a mano.
  for (const [key, object] of stored) {
    if (items.some((item) => item.key === key)) continue;
    const name = key.split("/").pop() || key;
    items.push({
      key,
      name,
      kind: kindForName(name) || "other",
      contentType: object.httpMetadata?.contentType || "",
      size: object.size,
      uploadedAt: object.uploaded?.toISOString(),
    });
  }
  items.sort((a, b) => String(b.uploadedAt || "").localeCompare(String(a.uploadedAt || "")));
  return json({ items: items.map((item) => ({ ...item, url: mediaUrl(item.key) })), storage: "configured" });
};

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  if (!sameOrigin(request)) return json({ code: "forbidden" }, 403);
  if (!(await authorized(request, env))) return json({ code: "unauthorized" }, 401);

  let payload: string;
  try {
    payload = await request.text();
  } catch {
    return json({ code: "invalid_request" }, 400);
  }
  // Il tetto si misura sui byte arrivati, non su `Content-Length`: in chunked
  // quell'header non c'e', e un upload oltre il limite deve fallire prima di
  // occupare memoria, non dopo.
  if (payload.length > MAX_BODY_BYTES) return json({ code: "file_too_large", max_bytes: MEDIA_MAX_BYTES }, 413);

  let body: { action?: unknown; key?: unknown; name?: unknown; data?: unknown; content_type?: unknown; alt?: unknown; caption?: unknown };
  try {
    body = JSON.parse(payload);
  } catch {
    return json({ code: "invalid_request" }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ code: "invalid_request" }, 400);

  const bucket = env.MEDIA;
  if (!bucket) return json({ code: "media_unavailable" }, 503);

  if (body.action === "upload") {
    const name = typeof body.name === "string" ? body.name : "";
    const data = typeof body.data === "string" ? body.data : "";
    if (!name || !data) return json({ code: "invalid_request" }, 400);
    const key = safeMediaKey(name);
    if (!key) return json({ code: "unsupported_type" }, 415);
    const kind = kindForName(name);
    if (!kind) return json({ code: "unsupported_type" }, 415);
    const declared = typeof body.content_type === "string" ? body.content_type : "";
    if (declared && !isAllowedContentType(kind, declared)) return json({ code: "unsupported_type" }, 415);
    let bytes: Uint8Array;
    try {
      bytes = base64ToBytes(data);
    } catch {
      return json({ code: "invalid_request" }, 400);
    }
    // Il tetto si applica ai byte decodificati: la base64 puo' essere 10MB di
    // dati dentro 14MB di richiesta, e il limite che interessa e' il file.
    if (bytes.length === 0) return json({ code: "invalid_request" }, 400);
    if (bytes.length > MEDIA_MAX_BYTES) return json({ code: "file_too_large", max_bytes: MEDIA_MAX_BYTES }, 413);
    const item: MediaItem = { key, name: key.split("/").pop() || name, kind, contentType: declared || "", size: bytes.length, uploadedAt: new Date().toISOString() };
    await bucket.put(key, bytes.buffer as ArrayBuffer, { httpMetadata: { contentType: declared || "", cacheControl: "public, max-age=31536000, immutable" } });
    await saveMeta(env, item);
    return json({ item: { ...item, url: mediaUrl(item.key) } }, 201);
  }

  const key = typeof body.key === "string" ? body.key : "";
  if (!key.startsWith("content/") || key.includes("..")) return json({ code: "invalid_request" }, 400);

  if (body.action === "update") {
    const item = normalizeMeta({ ...(await loadMeta(env)).find((entry) => entry.key === key), key, alt: body.alt, caption: body.caption, name: body.name });
    if (!item) return json({ code: "not_found" }, 404);
    await saveMeta(env, item);
    return json({ item: { ...item, url: mediaUrl(item.key) } });
  }

  if (body.action === "delete") {
    await bucket.delete(key);
    await deleteMeta(env, key);
    return json({ deleted: key });
  }

  return json({ code: "invalid_request" }, 400);
};
