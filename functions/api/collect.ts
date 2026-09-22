// @ts-expect-error Pages bundles extensionless function imports; Node's offline loader needs `.ts`.
import { supabaseConfigured, supabaseRequest } from "../lib/supabase.ts";
// @ts-expect-error Pages bundles extensionless function imports; Node's offline loader needs `.ts`.
import { supabaseKv } from "../lib/supabase-kv.ts";

/**
 * POST /api/collect: la copia dei dati di misura nel database del sito.
 *
 * Perché esiste. Umami e Google Analytics sono due servizi che gestisce qualcun
 * altro: cambiano piano, tagliano lo storico, chiudono. La misura del sito non può
 * dipendere da questo, quindi ogni evento viene scritto anche qui, in una tabella
 * che è nostra. Umami resta la lettura comoda, questa è la copia che non si perde.
 *
 * Cosa arriva: un lotto di eventi (`{ events: [...] }`), ognuno con nome, momento,
 * pagina, tipo di contenuto e i suoi valori. Cosa **non** arriva e non viene mai
 * scritto: l'indirizzo IP, l'user agent, un identificatore di dispositivo, un
 * cookie. L'IP viene letto una volta per calcolare `visitor_day` (hash troncato di
 * indirizzo + segreto del server + giorno UTC) e poi buttato: serve a contare le
 * visite distinte di una giornata, non a riconoscere qualcuno, e non collega un
 * giorno all'altro perché il giorno fa parte dell'hash.
 *
 * Perché non chiede il consenso, a differenza di Analytics: qui non si conserva
 * niente sul dispositivo di chi visita e non esiste un identificatore che
 * sopravvive alla giornata. È la stessa ragione per cui Umami non lo chiede.
 *
 * Se Supabase non è configurato risponde 204 e lo scrive nel log: il sito deve
 * continuare a funzionare, ma il guasto deve essere visibile a chi legge i log.
 */

const MAX_BODY_BYTES = 32768;
const MAX_EVENTS = 25;
const MAX_KEYS = 16;
const MAX_STRING = 300;
const MAX_INDEX_DAYS = 1;
const WINDOW_SECONDS = 300;
const MAX_REQUESTS = 120;

/**
 * I nomi che possono entrare. Un nome fuori da questa lista viene contato e
 * scartato: senza il filtro, questo endpoint sarebbe una tabella jsonb pubblica
 * dove chiunque scrive quello che vuole.
 */
const EVENTS = new Set([
  "page_view",
  "page_leave",
  "traffic_source",
  "navigation_click",
  "cta_click",
  "outbound_click",
  "social_click",
  "email_click",
  "copy_link",
  "scroll_depth",
  "form_start",
  "form_field_interaction",
  "form_submit",
  "form_success",
  "form_error",
  "newsletter_signup",
  "newsletter_already_subscribed",
  "newsletter_error",
  "feedback_open",
  "feedback_submitted",
  "feedback_error",
  "carousel_step",
  "media_play",
  "media_progress",
  "media_complete",
]);

interface RateLimitStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface Env {
  RATE_LIMIT?: RateLimitStore;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  /** Facoltativo: se assente si usa la chiave del database come segreto. */
  ANALYTICS_SALT?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

interface IncomingEvent {
  event?: unknown;
  at?: unknown;
  path?: unknown;
  kind?: unknown;
  data?: unknown;
}

/**
 * Risposta sempre senza corpo.
 *
 * Il client non legge niente da qui: quello che conta è il codice di stato, e per
 * il traffico normale è 204. Un corpo avrebbe solo aggiunto byte su un endpoint
 * che viene chiamato a ogni pagina.
 */
function empty(status: number, outcome: string, extra: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ event: "analytics_collect", outcome, ...extra }));
  return new Response(null, {
    status,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}

function ipOf(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    request.headers.get("True-Client-IP") ||
    ""
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

/**
 * Il solo dato che assomiglia a un identificatore, e non lo è.
 *
 * `hash(segreto | indirizzo | giorno UTC)` troncato: stabile per una giornata
 * (quindi le visite distinte si contano), diverso il giorno dopo (quindi non si
 * segue nessuno nel tempo), non reversibile senza il segreto. L'indirizzo non
 * viene scritto da nessuna parte: entra qui e finisce qui.
 */
async function visitorDay(ip: string, salt: string): Promise<string> {
  if (!ip) return "";
  const day = new Date().toISOString().slice(0, 10);
  const bytes = new TextEncoder().encode(`${salt}|${ip}|${day}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/**
 * Il dispositivo, in tre categorie, senza conservare l'user agent.
 *
 * Serve a rispondere a "da mobile leggono o scappano", che è una domanda vera, e
 * per rispondere non serve tenere la stringa: la stringa è anche la cosa più
 * identificante che un browser manda, quindi si legge, si riduce a una parola e si
 * dimentica. `automated` tiene fuori i bot dai conteggi senza doverli bloccare.
 */
function deviceOf(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (!ua) return "unknown";
  if (/bot|crawl|spider|slurp|headless|preview|monitor|curl|wget/.test(ua)) return "automated";
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod/.test(ua)) return "mobile";
  return "desktop";
}

/** Il dominio di provenienza, mai l'indirizzo intero: un referrer può contenere
 *  una query di ricerca, e quella non ci serve. */
function referrerHost(request: Request): string {
  const referer = request.headers.get("Referer");
  if (!referer) return "";
  try {
    const url = new URL(referer);
    if (url.hostname === new URL(request.url).hostname) return "";
    return url.hostname.replace(/^www\./, "").slice(0, 120);
  } catch {
    return "";
  }
}

/**
 * Solo valori semplici, solo stringhe corte, solo poche chiavi.
 *
 * Il corpo è pubblico: un oggetto annidato diventerebbe una tabella jsonb da
 * riempire a piacere, e un testo lungo la possibilità di nasconderci dentro
 * qualsiasi cosa. Qui tutto viene ridotto a stringa, numero o booleano e tagliato.
 */
function sanitizeData(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (Object.keys(out).length >= MAX_KEYS) break;
    if (!/^[a-z_]{1,32}$/.test(key)) continue;
    if (typeof raw === "string") {
      const text = raw.slice(0, MAX_STRING);
      if (text) out[key] = text;
    } else if (typeof raw === "number" && Number.isFinite(raw)) {
      out[key] = raw;
    } else if (typeof raw === "boolean") {
      out[key] = raw;
    }
  }
  return out;
}

const ATTRIBUTION_KEYS = [
  "source", "medium", "campaign", "content", "term", "campaign_id", "landing_page", "referrer_domain",
  "gclid", "gbraid", "wbraid", "fbclid", "msclkid", "ttclid", "li_fat_id",
] as const;

function attribution(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const key of ATTRIBUTION_KEYS) {
    if (typeof input[key] === "string" && input[key].length <= MAX_STRING) out[key] = input[key].slice(0, MAX_STRING);
  }
  return out;
}

function pagePath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value.slice(0, 300);
}

function contentKind(value: unknown): string {
  if (typeof value !== "string" || !/^[a-z_]{1,40}$/.test(value)) return "other";
  return value;
}

/**
 * Il momento dichiarato dal browser, tenuto dentro una finestra di un giorno.
 *
 * L'orologio di una macchina può essere sbagliato, e la data di `occurred_at` non
 * deve diventare un modo per scrivere nel futuro: se il valore è inverosimile si
 * usa l'ora del server.
 */
function occurredAt(value: unknown, now: number): string {
  if (typeof value !== "string") return new Date(now).toISOString();
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed) || Math.abs(now - parsed) > MAX_INDEX_DAYS * 86400000) {
    return new Date(now).toISOString();
  }
  return new Date(parsed).toISOString();
}

async function allowed(store: RateLimitStore, ip: string): Promise<boolean> {
  const key = `rl:collect:${ip || "unknown"}`;
  const current = Number.parseInt((await store.get(key)) || "0", 10);
  if (current >= MAX_REQUESTS) return false;
  await store.put(key, String(current + 1), { expirationTtl: WINDOW_SECONDS });
  return true;
}

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  const started = Date.now();
  // Solo conteggi: nemmeno nel log passa l'indirizzo o la pagina di qualcuno.
  const finish = (outcome: string, stored: number, skipped: number) =>
    empty(204, outcome, { stored, skipped, latency_ms: Date.now() - started });

  if (!sameOrigin(request)) return empty(403, "cross_origin");
  if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json") {
    return empty(415, "invalid_content_type");
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return empty(400, "unreadable_body");
  }
  if (raw.length > MAX_BODY_BYTES) return empty(413, "body_too_large");

  let body: { events?: unknown };
  try {
    body = JSON.parse(raw) as { events?: unknown };
  } catch {
    return empty(400, "invalid_json");
  }
  const incoming = Array.isArray(body.events) ? body.events.slice(0, MAX_EVENTS) : [];
  if (!incoming.length) return empty(400, "no_events");

  // Senza database non c'è copia da fare, ma il sito non deve accorgersene: 204,
  // e il log dice che manca la configurazione.
  if (!supabaseConfigured(env)) return empty(204, "not_configured");

  const rateLimitStore = env.RATE_LIMIT || supabaseKv(env);
  if (!rateLimitStore) return empty(503, "missing_rate_limit_binding");
  if (!(await allowed(rateLimitStore, ipOf(request)))) return empty(429, "rate_limited");

  const now = Date.now();
  const salt = (env.ANALYTICS_SALT || env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const visitor = await visitorDay(ipOf(request), salt);
  const country = (request.headers.get("CF-IPCountry") || "").slice(0, 8);
  const device = deviceOf(request.headers.get("User-Agent") || "");
  const referrer = referrerHost(request);

  let skipped = 0;
  const rows: Record<string, unknown>[] = [];
  for (const item of incoming as IncomingEvent[]) {
    const name = typeof item?.event === "string" ? item.event : "";
    if (!EVENTS.has(name)) {
      skipped += 1;
      continue;
    }
    const rawData = item.data;
    const data = sanitizeData(rawData);
    const current = attribution(rawData && typeof rawData === "object" && !Array.isArray(rawData) ? (rawData as Record<string, unknown>).attribution : null);
    const first = attribution(rawData && typeof rawData === "object" && !Array.isArray(rawData) ? (rawData as Record<string, unknown>).first_touch : null);
    const last = attribution(rawData && typeof rawData === "object" && !Array.isArray(rawData) ? (rawData as Record<string, unknown>).last_touch : null);
    rows.push({
      occurred_at: occurredAt(item.at, now),
      event: name,
      page_path: pagePath(item.path),
      content_kind: contentKind(item.kind),
      from_path: typeof data.from_path === "string" ? data.from_path.slice(0, 300) : "",
      next_page: typeof data.next_page === "string" ? data.next_page.slice(0, 300) : "",
      country,
      device,
      referrer_domain: current.referrer_domain || referrer,
      visitor_day: visitor,
      source: current.source || "direct",
      medium: current.medium || "none",
      campaign: current.campaign || "(not set)",
      content: current.content || "(not set)",
      term: current.term || "(not set)",
      campaign_id: current.campaign_id || "(not set)",
      landing_page: current.landing_page || pagePath(item.path),
      first_touch: first,
      last_touch: last || current,
      params: data,
    });
  }

  if (!rows.length) return finish("nothing_valid", 0, skipped);

  try {
    const { response } = await supabaseRequest(env, "analytics_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(rows),
    });
    if (!response.ok) return empty(502, `supabase_${response.status}`, { stored: 0, skipped });
  } catch {
    return empty(502, "supabase_unreachable", { stored: 0, skipped });
  }

  return finish("stored", rows.length, skipped);
};
