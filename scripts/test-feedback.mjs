// Mette alla prova l'endpoint pubblico del feedback (`functions/api/feedback.ts`).
//
// Perché esiste: le cose che contano qui non si vedono nell'export. Che un
// honeypot non salvi niente, che il tetto del corpo valga sui byte arrivati e non
// su quelli dichiarati, che la notifica porti alla dashboard **dell'host che ha
// ricevuto il feedback** e non a un dominio scritto a mano: nessuna di queste
// lascia traccia nell'HTML, e tutte si possono rompere senza che niente protesti.
//
// È un test **offline**: carica la Function vera (Node esegue i `.ts`
// direttamente), le dà uno storage in memoria e un `fetch` finto, e non tocca né
// la rete né KV né Resend.
//
//   node scripts/test-feedback.mjs
const { onRequestPost } = await import(
  new URL("../functions/api/feedback.ts", import.meta.url).href
);

const ORIGIN = "https://feedback.test";
const IP = "203.0.113.7";
const API_KEY = "re_test_key_not_a_secret";
const FROM = "log@feedback.test";

let failures = 0;
function check(name, condition) {
  console.log((condition ? "PASS" : "FAIL") + " " + name);
  if (!condition) failures += 1;
}

function newStore() {
  const map = new Map();
  return {
    map,
    async get(key) {
      const entry = map.get(key);
      if (!entry) return null;
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        map.delete(key);
        return null;
      }
      return entry.value;
    },
    async put(key, value, options = {}) {
      map.set(key, {
        value,
        expiresAt: options.expirationTtl ? Date.now() + options.expirationTtl * 1000 : null,
      });
    },
    async delete(key) {
      map.delete(key);
    },
  };
}

function newEnv(overrides = {}) {
  return { FEEDBACK: newStore(), RATE_LIMIT: newStore(), ...overrides };
}

function request(payload, { contentType = "application/json", body, stream } = {}) {
  const headers = { "CF-Connecting-IP": IP };
  if (contentType) headers["Content-Type"] = contentType;
  return new Request(`${ORIGIN}/api/feedback`, {
    method: "POST",
    headers,
    body:
      stream ??
      (body === undefined
        ? JSON.stringify(payload)
        : body),
  });
}

/** Un corpo in chunked: nessuna `Content-Length`, quindi il limite non ha niente
 *  da leggere se non i byte che arrivano. */
function streamed(payload) {
  return new Request(`${ORIGIN}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": IP },
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(payload));
        controller.close();
      },
    }),
    duplex: "half",
  });
}

const message = "Ho usato la demo e la parte sui limiti per agente mi convince.";

/** Cattura le chiamate che la Function farebbe a Resend, senza fare rete. */
async function withStubbedResend(run) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), headers: init.headers || {}, body: JSON.parse(init.body || "{}") });
    return new Response(JSON.stringify({ id: "test" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  try {
    return { result: await run(calls), calls };
  } finally {
    globalThis.fetch = original;
  }
}

// --- 1 · la porta si apre solo a una richiesta ben formata -------------------
{
  const env = newEnv();
  const wrongType = await onRequestPost({ request: request({}, { contentType: "text/plain" }), env });
  const malformed = await onRequestPost({ request: request({}, { body: "non json" }), env });
  const short = await onRequestPost({ request: request({ message: "ok" }), env });
  const honeypot = await onRequestPost({
    request: request({ message, company_website: "https://spam.test" }),
    env,
  });
  check(
    "wrong type, malformed JSON and a too-short message are refused",
    wrongType.status === 415 && malformed.status === 400 && short.status === 400,
  );
  check("the honeypot answers 200 and stores nothing", honeypot.status === 200 && env.FEEDBACK.map.size === 0);
}

// --- 2 · il tetto del corpo vale sui byte arrivati ---------------------------
{
  const env = newEnv();
  const huge = await onRequestPost({
    request: streamed(JSON.stringify({ message, pad: "x".repeat(20000) })),
    env,
  });
  check("an oversized chunked body → 413, nothing stored", huge.status === 413 && env.FEEDBACK.map.size === 0);
}

// --- 3 · un feedback vero finisce in coda, senza il resto dell'IP ------------
{
  const env = newEnv();
  const response = await onRequestPost({
    request: request({
      message,
      name: "  Liam  ",
      email: "Liam@Example.com",
      page_url: "/feedback/",
    }),
    env,
  });
  const body = await response.json();
  const id = (await env.FEEDBACK.get("fb:index")) || "";
  const record = JSON.parse((await env.FEEDBACK.get(id)) || "{}");
  check("a valid feedback is stored and answered 200", response.status === 200 && body.ok === true);
  // Due ottetti, non tre: dalla `203.0.113.7` resta `203.0`, che è quello che
  // `/privacy/` promette. Se un giorno qualcuno allarga il campo, questo check
  // cade prima che la promessa diventi falsa.
  check(
    "the record is pending review, trimmed, lowercased, and keeps only two IP octets",
    record.status === "pending_review" &&
      record.name === "Liam" &&
      record.email === "liam@example.com" &&
      record.ip_first_octets === "203.0" &&
      !JSON.stringify(record).includes(IP),
  );
  check("without Resend keys the record says so instead of pretending", record.notification_status === "not_configured");
}

// --- 4 · la notifica porta alla dashboard dell'host che ha ricevuto il post --
// Il caso da non ripetere: il link era `https://mattiaciuni.pages.dev` scritto a
// mano, quindi la notifica di un deploy di prova mandava al sito di produzione (e
// viceversa). Adesso l'origine si legge dalla richiesta, e `SITE_URL` la fissa solo
// quando il progetto la imposta.
{
  const resend = {
    RESEND_API_KEY: API_KEY,
    RESEND_FROM_EMAIL: FROM,
  };

  const plain = newEnv(resend);
  const { calls } = await withStubbedResend(async () => onRequestPost({ request: request({ message }), env: plain }));
  const html = calls[0]?.body?.html || "";
  check(
    "the notification links to the host that served the request",
    calls.length === 1 &&
      calls[0].url === "https://api.resend.com/emails" &&
      html.includes(`${ORIGIN}/admin/feedback/`) &&
      !html.includes("mattiaciuni.pages.dev"),
  );
  check(
    "the notification is idempotent per record and sends no PII beyond the feedback itself",
    calls[0]?.headers?.["Idempotency-Key"]?.startsWith("feedback-notification:fb:") === true &&
      calls[0]?.headers?.Authorization === `Bearer ${API_KEY}`,
  );

  const configured = newEnv({ ...resend, SITE_URL: "https://mattiaciuni.pages.dev/" });
  const { calls: fixed } = await withStubbedResend(async () =>
    onRequestPost({ request: request({ message }), env: configured }),
  );
  check(
    "SITE_URL, when the project sets it, wins over the request host (trailing slash removed)",
    (fixed[0]?.body?.html || "").includes("https://mattiaciuni.pages.dev/admin/feedback/"),
  );
}

// --- 5 · rate limit e log ------------------------------------------------------
{
  const env = newEnv();
  const statuses = [];
  for (let i = 0; i < 4; i += 1) {
    const response = await onRequestPost({ request: request({ message }), env });
    statuses.push(response.status);
  }
  check(
    "the fourth submission in the window is refused",
    statuses.slice(0, 3).every((status) => status === 200) && statuses[3] === 429,
  );

  const lines = [];
  const original = console.log;
  const quiet = newEnv();
  console.log = (...args) => lines.push(args.join(" "));
  try {
    await onRequestPost({ request: request({ message, name: "Liam", email: "liam@example.com" }), env: quiet });
  } finally {
    console.log = original;
  }
  const log = lines.join("\n");
  check(
    "the log carries the outcome, never the message, the email or the IP",
    log.includes("feedback_submit") &&
      !log.includes(message) &&
      !log.includes("liam@example.com") &&
      !log.includes(IP),
  );
}

console.log(
  failures === 0
    ? "\nfeedback: public endpoint attacks passed (honeypot, body cap on real bytes, PII trimming, origin-derived notification, rate limit, quiet logs)"
    : `\nfeedback: ${failures} FAILED`,
);
process.exit(failures ? 1 : 0);
