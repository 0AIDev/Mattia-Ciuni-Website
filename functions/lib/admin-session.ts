// Sessione admin condivisa dagli endpoint sotto `functions/api/admin/`.
//
// Prima esisteva solo `functions/api/admin/feedback.ts`, quindi l'autenticazione
// era dentro lo stesso file che implementava la coda di review. Aggiungere
// endpoint (media, redirect, impostazioni) senza estrarla avrebbe significato
// copiare TOTP, rate limit e gestione cookie in ogni file: quattro copie da
// tenere allineate e un posto in cui dimenticare il rate limit.
//
// Questo modulo non decide nulla: espone le verifiche, e ogni endpoint resta
// responsabile del proprio rate limit per azione. Le chiavi KV sono le stesse di
// prima, quindi una sessione aperta prima del refactor resta valida.

// @ts-expect-error Pages bundles extensionless function imports; Node's offline loader needs `.ts`.
import { verifyTotp } from "../../lib/totp.ts";

export interface Store {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete?(key: string): Promise<void>;
}

export type AdminRole = "ceo";

export const ADMIN_EMAIL = "ceo@usepayle.com" as const;
export const SESSION_PREFIX = "adm:";
export const TOTP_CONFIG_KEY = "auth:totp:config";
export const TOTP_EPOCH_KEY = "auth:totp:epoch";
export const SESSION_SECONDS = 43200;
export const LOGIN_WINDOW_SECONDS = 600;
export const LOGIN_RATE_VERSION = "v2";
export const TOTP_RATE_MAX_ATTEMPTS = 8;
// `__Host-`: il cookie vale solo per questo host, mai per un sottodominio, e solo
// su HTTPS con Path=/ — così nessuno può "lanciarlo" da un dominio figlio.
export const COOKIE = "__Host-mattia_feedback_admin";
export const LEGACY_COOKIE = "mattia_feedback_admin";

export type TotpConfig = { secret: string; enabled_at: string };
export type StoredSession = { created_at: string; role: AdminRole; epoch?: string };

export function json(body: Record<string, unknown>, status = 200, headers: Array<[string, string]> = []): Response {
  const merged = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  for (const [key, value] of headers) {
    if (key.toLowerCase() === "set-cookie") merged.append(key, value);
    else merged.set(key, value);
  }
  return new Response(JSON.stringify(body), { status, headers: merged });
}

export function cookieOf(request: Request, name: string): string {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

/** Le richieste del browser devono arrivare da questa origine; curl (senza
 *  `Origin`) resta permesso, perché non porta cookie di nessuno. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function ipOf(request: Request): string {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || "unknown";
}

export function newSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isLoopbackRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

/** Confronto a tempo costante: due digest della stessa lunghezza, xor accumulato. */
export async function sameSecret(given: string, expected: string): Promise<boolean> {
  if (!given || !expected) return false;
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(given)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

export async function configOf(env: { FEEDBACK?: Store }): Promise<TotpConfig | null> {
  if (!env.FEEDBACK) return null;
  const raw = await env.FEEDBACK.get(TOTP_CONFIG_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as TotpConfig;
    return value.secret && value.enabled_at ? value : null;
  } catch {
    return null;
  }
}

export async function totpEpoch(env: { FEEDBACK?: Store }): Promise<string> {
  if (!env.FEEDBACK) return "0";
  return (await env.FEEDBACK.get(TOTP_EPOCH_KEY)) || "0";
}

export async function roleForEmail(email: string): Promise<AdminRole | null> {
  return email.trim().toLowerCase() === ADMIN_EMAIL ? "ceo" : null;
}

export async function sessionRole(request: Request, env: { FEEDBACK?: Store }): Promise<AdminRole | null> {
  const id = cookieOf(request, COOKIE);
  if (!id || !env.FEEDBACK) return null;
  const raw = await env.FEEDBACK.get(SESSION_PREFIX + id);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as StoredSession;
    return session.role === "ceo" && (session.epoch || "0") === (await totpEpoch(env)) ? "ceo" : null;
  } catch {
    return (await totpEpoch(env)) === "0" ? "ceo" : null;
  }
}

/** Sessione valida oppure token + TOTP per automazioni CLI. */
export async function isAuthorized(request: Request, env: { FEEDBACK?: Store }): Promise<AdminRole | null> {
  const existingRole = await sessionRole(request, env);
  if (existingRole) return existingRole;
  const email = request.headers.get("X-Admin-Email") || "";
  const code = request.headers.get("X-Admin-TOTP") || "";
  const config = await configOf(env);
  const role = await roleForEmail(email);
  if (!config || !role) return null;
  return (await verifyTotp(config.secret, code)) ? role : null;
}
