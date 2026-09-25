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
const RESET_TOKEN = "reset-" + "9".repeat(60);
function env() { return { FEEDBACK: store(), RATE_LIMIT: store(), ADMIN_TOKEN: TOKEN, ADMIN_TOTP_RESET_TOKEN: RESET_TOKEN, COFOUNDER_TOKEN }; }

// The local Pages runtime has no KV binding. LOCAL_ADMIN enables the intentionally
// in-memory adapter so the browser flow can be exercised without production data.
{
  const local = { LOCAL_ADMIN: "1", ADMIN_TOKEN: TOKEN };
  const response = await onRequestPost({
    request: request({ method: "POST", body: { action: "setup", token: TOKEN } }),
    env: local,
  });
  const nonLoopbackDashboard = await onRequestGet({ request: request(), env: local });
  check("LOCAL_ADMIN does not bypass auth on a non-loopback host", response.status === 200 && nonLoopbackDashboard.status === 401);
  const localDashboard = await onRequestGet({
    request: request({ url: "http://localhost:8787/api/admin/feedback" }),
    env: local,
  });
  check("localhost + LOCAL_ADMIN opens the dashboard without TOTP", localDashboard.status === 200);
}

{
  const missing = { ADMIN_TOKEN: TOKEN };
  const response = await onRequestGet({ request: request(), env: missing });
  check("a deployed API without FEEDBACK returns 503, not setup_required", response.status === 503);
}
function request({ method = "GET", body, cookie, totp, origin, type = "application/json", length, url = `${ORIGIN}/api/admin/feedback`, headers: extraHeaders = {} } = {}) {
  const headers = { "Content-Type": type, "CF-Connecting-IP": IP, ...extraHeaders };
  if (cookie) headers.Cookie = cookie;
  if (totp) headers["X-Admin-TOTP"] = totp;
  if (origin !== undefined) headers.Origin = origin;
  if (length !== undefined) headers["Content-Length"] = String(length);
  return new Request(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
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

// Reset requires the dedicated secret and invalidates existing TOTP state.
{
  const resetEnv = env();
  await resetEnv.FEEDBACK.put("auth:totp:config", JSON.stringify({ secret: "OLDSECRET", enabled_at: new Date().toISOString() }));
  await resetEnv.FEEDBACK.put("auth:totp:bootstrap-used", "1");
  const badReset = await onRequestPost({ request: request({ method: "POST", body: { action: "reset_setup", token: TOKEN } }), env: resetEnv });
  check("wrong reset secret is rejected", badReset.status === 401);
  const reset = await onRequestPost({ request: request({ method: "POST", body: { action: "reset_setup", token: RESET_TOKEN } }), env: resetEnv });
  check("dedicated reset secret clears TOTP state", reset.status === 200 && await resetEnv.FEEDBACK.get("auth:totp:config") === null && await resetEnv.FEEDBACK.get("auth:totp:bootstrap-used") === null);
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
  const wrongEmailLogin = await onRequestPost({ request: request({ method: "POST", body: { action: "login", email: "other@example.com", code: "000000" } }), env: configuredEnv });
  check("only the authorized admin email can log in", wrongEmailLogin.status === 401);
  const wrongEmailSetup = await onRequestPost({ request: request({ method: "POST", body: { action: "login", email: "mattia@example.com", code: "000000" } }), env: configuredEnv });
  check("a different email is rejected before TOTP verification", wrongEmailSetup.status === 401);
  const code = await totpCode(secret);
  const login = await onRequestPost({ request: request({ method: "POST", body: { action: "login", email: "ceo@usepayle.com", code } }), env: configuredEnv });
  const session = sessionCookie(login);
  check("normal login requires the authorized email + current TOTP code", login.status === 200 && session.length > 20);
  check("wrong TOTP is rejected", (await onRequestPost({ request: request({ method: "POST", body: { action: "login", email: "ceo@usepayle.com", code: "000000" } }), env: configuredEnv })).status === 401);
  check("unrecognized email is rejected", (await onRequestPost({ request: request({ method: "POST", body: { action: "login", email: "other@example.com", code } }), env: configuredEnv })).status === 401);
  const queueResponse = await onRequestGet({ request: request({ cookie: session }), env: configuredEnv });
  const queueData = await queueResponse.json();
  check("session opens queue without returning token or secret", queueResponse.status === 200 && queueData.role === "ceo");
  check("queue response includes an unavailable-safe analytics payload", queueResponse.status === 200 && queueData.analytics?.available === false && Array.isArray(queueData.analytics?.daily) && Array.isArray(queueData.analytics?.pages) && Array.isArray(queueData.analytics?.flow) && Array.isArray(queueData.analytics?.acquisition) && Array.isArray(queueData.analytics?.conversions));
  const contentSave = await onRequestPost({ request: request({ method: "POST", cookie: session, body: { action: "content_save", content: { id: "draft-1", kind: "post", slug: "draft-one", status: "draft", title: "Draft one", description: "A draft", body_markdown: "## Hello\\n\\nDraft body", data: { category: "Thoughts", tags: [], keywords: [] } } } }), env: configuredEnv });
  const contentData = await contentSave.json();
  check("authenticated dashboard can save a CMS draft", contentSave.status === 200 && contentData.content?.status === "draft" && Array.isArray(contentData.content?.data?.content));
  // L'id restituito dal save, non quello inviato: `content_save` sostituisce un id
  // non-UUID con uno nuovo, quindi pubblicare `draft-1` cercherebbe una riga che
  // non esiste e riceverebbe 404. Il 503 che ci si aspetta viene dal fatto che
  // GitHub non e' configurato, e per verificarlo serve arrivare davvero al
  // controllo di configurazione.
  const savedId = contentData.content?.id;
  const contentPublish = await onRequestPost({ request: request({ method: "POST", cookie: session, body: { action: "content_publish", id: savedId } }), env: configuredEnv });
  check("CMS publish refuses to pretend GitHub is configured", contentPublish.status === 503, `got ${contentPublish.status}`);
  const contentHistory = await onRequestPost({ request: request({ method: "POST", cookie: session, body: { action: "content_history" } }), env: configuredEnv });
  const historyData = await contentHistory.json();
  check("CMS history is empty without GitHub instead of failing", contentHistory.status === 200 && historyData.github === false && Array.isArray(historyData.commits));
  const configStatus = await onRequestPost({ request: request({ method: "POST", cookie: session, body: { action: "settings_read" } }), env: configuredEnv });
  const configData = await configStatus.json();
  check("the panel can read why publishing is off", configStatus.status === 200 && configData.github === false && configData.deploy_hook === false);
  const badRestore = await onRequestPost({ request: request({ method: "POST", cookie: session, body: { action: "content_restore", kind: "not-a-kind", slug: "../escape", sha: "zz" } }), env: configuredEnv });
  check("CMS restore refuses a malformed target before touching GitHub", badRestore.status === 400);
  const testFeedback = await onRequestPost({ request: request({ method: "POST", body: { action: "create_test" }, cookie: session }), env: configuredEnv });
  const testFeedbackData = await testFeedback.json();
  check("authenticated dashboard can create a pending test feedback", testFeedback.status === 200 && testFeedbackData.record?.status === "pending_review" && testFeedbackData.record?.name === "Test submission");
  const logout = await onRequestPost({ request: request({ method: "POST", body: { action: "logout" }, cookie: session }), env: configuredEnv });
  check("logout revokes the session server-side", logout.status === 200 && (await onRequestGet({ request: request({ cookie: session }), env: configuredEnv })).status === 401);
}

// CLI access also needs the second factor; token-only bearer access is gone.
{
  const code = await totpCode(secret);
  check("email is required for CLI access", (await onRequestGet({ request: request({ totp: code }), env: configuredEnv })).status === 401);
  check("CLI access requires the authorized email and TOTP", (await onRequestGet({ request: request({ totp: code, headers: { "X-Admin-Email": "ceo@usepayle.com" } }), env: configuredEnv })).status === 200);
}

// Origin, body, and brute-force controls.
{
  const cross = await onRequestPost({ request: request({ method: "POST", origin: "https://evil.test", body: { action: "login", email: "ceo@usepayle.com", code: "000000" } }), env: configuredEnv });
  const big = await onRequestPost({ request: request({ method: "POST", length: 20000, body: { action: "login", email: "ceo@usepayle.com", code: "000000" } }), env: configuredEnv });
  check("cross-origin login → 403", cross.status === 403);
  check("oversized declared body → 413", big.status === 413);
  const statuses = [];
  for (let i = 0; i < 20; i += 1) statuses.push((await onRequestPost({ request: request({ method: "POST", body: { action: "login", email: "other@example.com", code: "000000" } }), env: configuredEnv })).status);
  check("token brute force reaches a 429", statuses.includes(429));
}

console.log(failures ? `\nadmin: ${failures} FAILED` : "\nadmin: TOTP bootstrap, token+code login, session, replay, CLI and attack checks passed");
process.exit(failures ? 1 : 0);
