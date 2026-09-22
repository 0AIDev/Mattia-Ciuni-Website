// Offline adversarial contract for the private feedback dashboard.
// Run: npm run test:admin
import { onRequestGet, onRequestPost } from "../functions/api/admin/feedback.ts";
import { totpCode } from "../lib/totp.ts";

const TOKEN = "0".repeat(64);
const COFOUNDER_TOKEN = "1".repeat(64);
const ORIGIN = "https://example.test";
const IP = "203.0.113.7";
let failures = 0;
const check = (name, ok) => { console.log((ok ? "PASS" : "FAIL") + " " + name); if (!ok) failures += 1; };

function store() {
  const map = new Map();
  return {
    map,
    async get(key) { const value = map.get(key); return value?.expiresAt && value.expiresAt < Date.now() ? (map.delete(key), null) : value?.value ?? null; },
    async put(key, value, options = {}) { map.set(key, { value, expiresAt: options.expirationTtl ? Date.now() + options.expirationTtl * 1000 : null }); },
    async delete(key) { map.delete(key); },
  };
}
function env() { return { FEEDBACK: store(), RATE_LIMIT: store(), ADMIN_TOKEN: TOKEN, COFOUNDER_TOKEN }; }

// The local Pages runtime has no KV binding. LOCAL_ADMIN enables the intentionally
// in-memory adapter so the browser flow can be exercised without production data.
{
  const local = { LOCAL_ADMIN: "1", ADMIN_TOKEN: TOKEN };
  const response = await onRequestPost({
    request: request({ method: "POST", body: { action: "setup", token: TOKEN } }),
    env: local,
  });
  check("LOCAL_ADMIN enables the same bootstrap flow without a KV binding", response.status === 200);
}

{
  const missing = { ADMIN_TOKEN: TOKEN };
  const response = await onRequestGet({ request: request(), env: missing });
  check("a deployed API without FEEDBACK returns 503, not setup_required", response.status === 503);
}
function request({ method = "GET", body, cookie, bearer, totp, origin, type = "application/json", length } = {}) {
  const headers = { "Content-Type": type, "CF-Connecting-IP": IP };
  if (cookie) headers.Cookie = cookie;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  if (totp) headers["X-Admin-TOTP"] = totp;
  if (origin !== undefined) headers.Origin = origin;
  if (length !== undefined) headers["Content-Length"] = String(length);
  return new Request(`${ORIGIN}/api/admin/feedback`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}
function cookies(response) {
  if (typeof response.headers.getSetCookie === "function") return response.headers.getSetCookie();
  const value = response.headers.get("Set-Cookie");
  return value ? [value] : [];
}
function sessionCookie(response) {
  const value = cookies(response).find((item) => item.startsWith("__Host-mattia_feedback_admin="));
  return value ? value.split(";")[0] : "";
}

// No credential, wrong token, malformed input.
{
  const e = env();
  check("GET without credentials → 401 and setup_required", (await onRequestGet({ request: request(), env: e })).status === 401 && (await (await onRequestGet({ request: request(), env: e })).json()).setup_required === true);
  const wrong = await onRequestPost({ request: request({ method: "POST", body: { action: "setup", token: "1".repeat(64) } }), env: e });
  check("wrong bootstrap token → 401 and no setup state", wrong.status === 401 && e.FEEDBACK.map.size === 0);
  const malformed = await onRequestPost({ request: request({ method: "POST", body: "nope" }), env: e });
  check("malformed JSON → 400", malformed.status === 400);
}

// One-time setup, QR URI, manual key, and bootstrap replay lock.
let configuredEnv;
let secret;
{
  const e = env();
  configuredEnv = e;
  const setup = await onRequestPost({ request: request({ method: "POST", body: { action: "setup", token: TOKEN } }), env: e });
  const data = await setup.json();
  secret = data.manual_key;
  check("valid token starts setup once", setup.status === 200 && typeof data.setup_id === "string" && typeof data.otpauth_uri === "string");
  check("setup returns a base32 manual key only during bootstrap", /^[A-Z2-7]{32}$/.test(secret) && data.otpauth_uri.includes(`secret=${secret}`));
  const replay = await onRequestPost({ request: request({ method: "POST", body: { action: "setup", token: TOKEN } }), env: e });
  check("the bootstrap token cannot generate a second QR", replay.status === 409);

  const code = await totpCode(secret);
  const confirm = await onRequestPost({ request: request({ method: "POST", body: { action: "confirm_setup", setup_id: data.setup_id, code } }), env: e });
  const setupCookies = cookies(confirm);
  check("the first valid TOTP confirms setup and creates a session", confirm.status === 200 && setupCookies.some((v) => v.startsWith("__Host-") && v.includes("Max-Age=43200") && v.includes("HttpOnly") && v.includes("Secure") && v.includes("SameSite=Strict")));
  check("the stored config is not exposed by GET", !(await (await onRequestGet({ request: request({ cookie: sessionCookie(confirm) }), env: e })).text()).includes(secret));
}

// Normal login requires both factors. Session is the only browser credential.
{
  const tokenCheck = await onRequestPost({ request: request({ method: "POST", body: { action: "token_check", token: TOKEN } }), env: configuredEnv });
  const tokenCheckData = await tokenCheck.json();
  check("correct token can be verified without creating a session", tokenCheck.status === 200 && tokenCheckData.token_verified === true && tokenCheckData.role === "ceo");
  const cofounderTokenCheck = await onRequestPost({ request: request({ method: "POST", body: { action: "token_check", token: COFOUNDER_TOKEN } }), env: configuredEnv });
  const cofounderTokenCheckData = await cofounderTokenCheck.json();
  check("co-founder token unlocks the same TOTP step with its own role", cofounderTokenCheck.status === 200 && cofounderTokenCheckData.role === "cofounder");
  const wrongTokenCheck = await onRequestPost({ request: request({ method: "POST", body: { action: "token_check", token: "2".repeat(64) } }), env: configuredEnv });
  check("wrong token cannot unlock the TOTP step", wrongTokenCheck.status === 401);
  const code = await totpCode(secret);
  const login = await onRequestPost({ request: request({ method: "POST", body: { action: "login", token: TOKEN, code } }), env: configuredEnv });
  const session = sessionCookie(login);
  check("normal login requires token + current TOTP code", login.status === 200 && session.length > 20);
  check("wrong TOTP is rejected", (await onRequestPost({ request: request({ method: "POST", body: { action: "login", token: TOKEN, code: "000000" } }), env: configuredEnv })).status === 401);
  check("wrong token is rejected", (await onRequestPost({ request: request({ method: "POST", body: { action: "login", token: "2".repeat(64), code } }), env: configuredEnv })).status === 401);
  const queueResponse = await onRequestGet({ request: request({ cookie: session }), env: configuredEnv });
  const queueData = await queueResponse.json();
  check("session opens queue without returning token or secret", queueResponse.status === 200 && queueData.role === "ceo");
  const cofounderCode = await totpCode(secret);
  const cofounderLogin = await onRequestPost({ request: request({ method: "POST", body: { action: "login", token: COFOUNDER_TOKEN, code: cofounderCode } }), env: configuredEnv });
  const cofounderSession = sessionCookie(cofounderLogin);
  const cofounderQueue = await onRequestGet({ request: request({ cookie: cofounderSession }), env: configuredEnv });
  const cofounderQueueData = await cofounderQueue.json();
  check("co-founder login stores and returns the co-founder role", cofounderLogin.status === 200 && cofounderQueue.status === 200 && cofounderQueueData.role === "cofounder");
  const testFeedback = await onRequestPost({ request: request({ method: "POST", body: { action: "create_test" }, cookie: session }), env: configuredEnv });
  const testFeedbackData = await testFeedback.json();
  check("authenticated dashboard can create a pending test feedback", testFeedback.status === 200 && testFeedbackData.record?.status === "pending_review" && testFeedbackData.record?.name === "Test submission");
  const logout = await onRequestPost({ request: request({ method: "POST", body: { action: "logout" }, cookie: session }), env: configuredEnv });
  await onRequestPost({ request: request({ method: "POST", body: { action: "logout" }, cookie: cofounderSession }), env: configuredEnv });
  check("logout revokes the session server-side", logout.status === 200 && (await onRequestGet({ request: request({ cookie: session }), env: configuredEnv })).status === 401);
}

// CLI access also needs the second factor; token-only bearer access is gone.
{
  const code = await totpCode(secret);
  check("bearer token alone is no longer enough", (await onRequestGet({ request: request({ bearer: TOKEN }), env: configuredEnv })).status === 401);
  check("CLI bearer access requires X-Admin-TOTP", (await onRequestGet({ request: request({ bearer: TOKEN, totp: code }), env: configuredEnv })).status === 200);
}

// Origin, body, and brute-force controls.
{
  const cross = await onRequestPost({ request: request({ method: "POST", origin: "https://evil.test", body: { action: "login", token: TOKEN, code: "000000" } }), env: configuredEnv });
  const big = await onRequestPost({ request: request({ method: "POST", length: 20000, body: { action: "login", token: TOKEN, code: "000000" } }), env: configuredEnv });
  check("cross-origin login → 403", cross.status === 403);
  check("oversized declared body → 413", big.status === 413);
  const statuses = [];
  for (let i = 0; i < 20; i += 1) statuses.push((await onRequestPost({ request: request({ method: "POST", body: { action: "login", token: "2".repeat(64), code: "000000" } }), env: configuredEnv })).status);
  check("token brute force reaches a 429", statuses.includes(429));
}

console.log(failures ? `\nadmin: ${failures} FAILED` : "\nadmin: TOTP bootstrap, token+code login, session, replay, CLI and attack checks passed");
process.exit(failures ? 1 : 0);
