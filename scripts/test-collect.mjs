// Mette alla prova il raccoglitore dei dati di misura
// (`functions/api/collect.ts`), cioè la copia che vive nel database del sito.
//
// Perché esiste: qui dentro ci sono le promesse che non lasciano traccia
// nell'HTML e che si rompono in silenzio. Che l'indirizzo IP non finisca mai nel
// database, che l'hash giornaliero non colleghi un giorno all'altro, che
// l'endpoint pubblico non diventi una tabella jsonb dove chiunque scrive quello
// che vuole, e che senza database il sito continui a funzionare.
//
// È un test **offline**: carica la Function vera, le dà uno storage in memoria e
// un `fetch` finto, e non tocca né la rete né Supabase.
//
//   node scripts/test-collect.mjs
const { onRequestPost } = await import(
  new URL("../functions/api/collect.ts", import.meta.url).href
);

const ORIGIN = "https://collect.test";
const IP = "203.0.113.7";
const IP_BOT = "198.51.100.4";
const SUPABASE_URL = "https://project.supabase.test";
const SERVICE_KEY = "service_role_key_not_a_secret";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";

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
  };
}

function newEnv(overrides = {}) {
  return {
    RATE_LIMIT: newStore(),
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
    ...overrides,
  };
}

function event(overrides = {}) {
  return {
    event: "page_view",
    at: new Date().toISOString(),
    path: "/notes/",
    kind: "notes",
    data: {
      content_kind: "notes",
      from_path: "/",
      attribution: { source: "meta", medium: "paid_social", campaign: "launch", campaign_id: "c123", landing_page: "/notes/", referrer_domain: "instagram.com" },
      first_touch: { source: "google", medium: "organic_search", landing_page: "/" },
      last_touch: { source: "meta", medium: "paid_social", campaign: "launch", landing_page: "/notes/" },
    },
    ...overrides,
  };
}

function request(payload, { contentType = "application/json", headers = {}, body } = {}) {
  return new Request(`${ORIGIN}/api/collect`, {
    method: "POST",
    headers: { "CF-Connecting-IP": IP, "User-Agent": UA, "Content-Type": contentType, ...headers },
    body: body === undefined ? JSON.stringify(payload) : body,
  });
}

/** Cattura le scritture verso Supabase senza fare rete. */
async function withStubbedSupabase(run, { ok = true } = {}) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    // `supabaseRequest` costruisce un oggetto `Headers`, non un dizionario: leggerlo
    // come tale restituirebbe `undefined` e il test passerebbe per il motivo sbagliato.
    calls.push({ url: String(url), headers: new Headers(init.headers || {}), rows: JSON.parse(init.body || "[]") });
    return new Response(null, { status: ok ? 201 : 400 });
  };
  try {
    return { result: await run(), calls };
  } finally {
    globalThis.fetch = original;
  }
}

/** Le righe scritte, con i campi che contano. */
function rowsOf(calls) {
  return calls[0]?.rows || [];
}

// --- 1 · solo una richiesta ben formata entra --------------------------------
{
  const env = newEnv();
  const wrongType = await onRequestPost({ request: request({ events: [] }, { contentType: "text/plain" }), env });
  const malformed = await onRequestPost({ request: request({}, { body: "non json" }), env });
  const empty = await onRequestPost({ request: request({ events: [] }), env });
  const crossOrigin = await onRequestPost({
    request: request({ events: [event()] }, { headers: { Origin: "https://evil.test" } }),
    env,
  });
  check(
    "wrong type, malformed JSON and an empty batch are refused",
    wrongType.status === 415 && malformed.status === 400 && empty.status === 400,
  );
  check("a browser on another origin cannot post", crossOrigin.status === 403);
}

// --- 2 · il tetto del corpo -------------------------------------------------
{
  const env = newEnv();
  const huge = await onRequestPost({
    request: request({ events: [event({ data: { pad: "x".repeat(40000) } })] }),
    env,
  });
  check("an oversized body is refused", huge.status === 413);
}

// --- 3 · senza database il sito non se ne accorge ---------------------------
{
  const env = { RATE_LIMIT: newStore() };
  const { calls } = await withStubbedSupabase(async () =>
    onRequestPost({ request: request({ events: [event()] }), env }),
  );
  const response = await onRequestPost({ request: request({ events: [event()] }), env });
  check(
    "without Supabase the endpoint answers 204 and writes nothing",
    response.status === 204 && calls.length === 0,
  );
}

// --- 4 · quello che arriva nel database, e quello che non ci arriva mai -----
{
  const env = newEnv();
  const { result, calls } = await withStubbedSupabase(async () =>
    onRequestPost({
      request: request({
        events: [
          event(),
          event({ event: "page_leave", path: "/", kind: "home", data: { next_page: "/notes/", dwell_seconds: 42 } }),
          event({ event: "scroll_depth", data: { percent: 75 } }),
          // Cose che non devono passare: nome sconosciuto, oggetto annidato,
          // chiave maliziosa, stringa lunghissima, data impossibile.
          event({ event: "DROP TABLE analytics_events" }),
          event({ event: "cta_click", data: { nested: { a: 1 }, "UPPER-KEY": "x", long: "y".repeat(900) } }),
        ],
      }),
      env,
    }),
  );
  const rows = rowsOf(calls);
  const serialized = JSON.stringify(rows);
  const response = await result;

  check(
    "the batch is written to the analytics table with the service role",
    calls.length === 1 &&
      calls[0].url === `${SUPABASE_URL}/rest/v1/analytics_events` &&
      calls[0].headers.get("apikey") === SERVICE_KEY &&
      calls[0].headers.get("authorization") === `Bearer ${SERVICE_KEY}` &&
      response.status === 204,
  );
  check(
    "the IP and the user agent are never written",
    rows.length === 4 &&
      !serialized.includes(IP) &&
      !serialized.includes("iPhone") &&
      !serialized.includes("Mozilla"),
  );
  check(
    "campaign attribution is lifted into queryable columns",
    rows[0].source === "meta" && rows[0].medium === "paid_social" && rows[0].campaign_id === "c123" && rows[0].first_touch.source === "google" && rows[0].last_touch.source === "meta",
  );
  check(
    "the device is reduced to one word and the country to a code",
    rows.every((row) => row.device === "mobile") &&
      rows.every((row) => row.country === "" || row.country.length <= 8),
  );
  check(
    "an unknown event name is dropped instead of creating a row",
    rows.every((row) => row.event !== "DROP TABLE analytics_events") &&
      rows.filter((row) => row.event === "page_view").length === 1,
  );
  check(
    "the pageview is in the copy: it is the one Umami does not get from us",
    rows.some((row) => row.event === "page_view" && row.page_path === "/notes/"),
  );
  check(
    "nested values, foreign keys and long strings never reach jsonb",
    rows.every((row) => typeof row.params !== "object" || row.params === null || !("nested" in row.params)) &&
      rows.every((row) => !("UPPER-KEY" in row.params)) &&
      rows.every((row) =>
        Object.values(row.params || {}).every((value) => typeof value !== "string" || value.length <= 300),
      ),
  );
  check(
    "the page_leave columns are lifted out of the payload",
    rows.some((row) => row.event === "page_leave" && row.next_page === "/notes/" && row.params.dwell_seconds === 42),
  );
}

// --- 5 · l'hash giornaliero conta, non riconosce ----------------------------
{
  const first = newEnv();
  const second = newEnv();
  const { calls: a } = await withStubbedSupabase(async () =>
    onRequestPost({ request: request({ events: [event()] }), env: first }),
  );
  const { calls: b } = await withStubbedSupabase(async () =>
    onRequestPost({ request: request({ events: [event()] }), env: second }),
  );
  const { calls: other } = await withStubbedSupabase(async () =>
    onRequestPost({
      request: request({ events: [event()] }, { headers: { "CF-Connecting-IP": IP_BOT } }),
      env: newEnv(),
    }),
  );
  const visitor = rowsOf(a)[0].visitor_day;
  check(
    "the same visit on the same day hashes to the same value, another address does not",
    /^[0-9a-f]{32}$/.test(visitor) &&
      rowsOf(b)[0].visitor_day === visitor &&
      rowsOf(other)[0].visitor_day !== visitor,
  );

  // Il giorno fa parte dell'hash: senza questo, l'hash sarebbe un identificatore
  // permanente travestito.
  const source = await import("node:fs").then((fs) =>
    fs.readFileSync(new URL("../functions/api/collect.ts", import.meta.url), "utf8"),
  );
  check(
    "the day is part of the hash, so it cannot link one day to the next",
    source.includes("toISOString().slice(0, 10)") && source.includes("salt}|${ip}|${day}"),
  );
}

// --- 6 · l'orologio di una macchina non decide la data ---------------------
{
  const env = newEnv();
  const future = new Date(Date.now() + 90 * 86400000).toISOString();
  const { calls } = await withStubbedSupabase(async () =>
    onRequestPost({ request: request({ events: [event({ at: future })] }), env }),
  );
  const stored = rowsOf(calls)[0];
  check(
    "an impossible timestamp is replaced with the server's clock",
    Date.parse(stored.occurred_at) < Date.now() + 60000,
  );
}

// --- 7 · rate limit e log ---------------------------------------------------
{
  const env = newEnv();
  let last = 204;
  let statuses = [];
  for (let index = 0; index < 121; index += 1) {
    const response = await withStubbedSupabase(async () =>
      onRequestPost({ request: request({ events: [event()] }), env }),
    );
    last = (await response.result).status;
    statuses.push(last);
  }
  check(
    "the endpoint stops answering after the window is full",
    statuses.slice(0, 120).every((status) => status === 204) && last === 429,
  );

  const lines = [];
  const original = console.log;
  const quiet = newEnv();
  console.log = (...args) => lines.push(args.join(" "));
  try {
    await withStubbedSupabase(async () =>
      onRequestPost({ request: request({ events: [event(), event({ event: "nope" })] }), env: quiet }),
    );
  } finally {
    console.log = original;
  }
  const log = lines.join("\n");
  check(
    "the log carries counts and outcomes, never the address or the page",
    log.includes("analytics_collect") &&
      log.includes('"stored":1') &&
      log.includes('"skipped":1') &&
      !log.includes(IP) &&
      !log.includes("/notes/") &&
      !log.includes("iPhone"),
  );
}

console.log(
  failures === 0
    ? "\ncollect: the owned copy is anonymized (no IP, no device string, daily hash, whitelisted events) and survives a missing database or a broken client clock"
    : `\ncollect: ${failures} FAILED`,
);
process.exit(failures ? 1 : 0);
