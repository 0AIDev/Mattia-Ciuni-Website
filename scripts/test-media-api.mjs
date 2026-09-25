// Test offline dell'endpoint media admin, con un R2 finto in memoria.
//
// L'endpoint non puo' essere provato davvero senza un bucket, e un bucket vero in
// un test significherebbe scrivere file pubblici per verificare una lista di
// estensioni. Il R2 finto copre la parte che conta: cosa viene accettato, cosa
// viene rifiutato e cosa finisce dove.

import { onRequestGet, onRequestPost } from "../functions/api/admin/media.ts";

let failures = 0;
function check(name, ok, detail = "") {
  if (ok) {
    console.log(`PASS ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
  }
}

/** R2 minimale: le quattro operazioni che l'endpoint usa davvero. */
function fakeBucket() {
  const store = new Map();
  return {
    store,
    async get(key) {
      const entry = store.get(key);
      return entry ? { ...entry, body: new Blob([entry.value]).stream() } : null;
    },
    async put(key, value, options) {
      store.set(key, { key, value, size: value.byteLength ?? value.length ?? 0, httpMetadata: options?.httpMetadata });
    },
    async delete(key) {
      store.delete(key);
    },
    async list(options) {
      return { objects: [...store.values()].filter((entry) => !options?.prefix || entry.key.startsWith(options.prefix)) };
    },
  };
}

function kv() {
  const map = new Map();
  return {
    async get(key) { return map.get(key) ?? null; },
    async put(key, value) { map.set(key, value); },
    async delete(key) { map.delete(key); },
  };
}

const bucket = fakeBucket();
const env = { MEDIA: bucket, FEEDBACK: kv(), LOCAL_ADMIN: "1" };

function post(body, headers = {}) {
  return onRequestPost({
    request: new Request("https://127.0.0.1/api/admin/media", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
    env,
  });
}

function base64(text) {
  return Buffer.from(text, "utf8").toString("base64");
}

// Auth senza sessione e senza localhost: il bypass e' doppio gate, e qui si
// verifica proprio che il gate singolo non basta.
{
  const unauthorized = await onRequestPost({
    request: new Request("https://admin.example.com/api/admin/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upload", name: "a.png", data: base64("x") }),
    }),
    env: { MEDIA: bucket, FEEDBACK: kv(), LOCAL_ADMIN: "1" },
  });
  check("media: a remote host is not authorized by LOCAL_ADMIN alone", unauthorized.status === 401, `got ${unauthorized.status}`);
}

// Upload valido.
{
  const response = await post({ action: "upload", name: "raj.mp3", content_type: "audio/mpeg", data: base64("fake audio") });
  const data = await response.json();
  check("media: a valid audio upload is stored under content/", response.status === 201 && data.item?.key === "content/raj.mp3", JSON.stringify(data));
  check("media: the stored object is really in the bucket", bucket.store.has("content/raj.mp3"));
  check("media: the public URL is the /media/ path", data.item?.url === "/media/content/raj.mp3");
}

// Tipi pericolosi e traversal.
{
  for (const name of ["payload.html", "payload.svg", "notes.txt"]) {
    const response = await post({ action: "upload", name, data: base64("x") });
    check(`media: ${name} is refused`, response.status === 415 || response.status === 400, `got ${response.status}`);
  }
  // Un percorso con `..` viene ridotto al nome finale, quindi finisce in
  // `content/escape.png`: non e' una scrittura fuori dal bucket, e' una
  // normalizzazione. Il check che conta e' quello dopo, sul prefix.
  const traversal = await post({ action: "upload", name: "../../escape.png", data: base64("x") });
  check("media: a traversal name is normalized, not written outside content/", traversal.status === 201 || traversal.status === 415, `got ${traversal.status}`);
  check("media: nothing outside content/ was written", [...bucket.store.keys()].every((key) => key.startsWith("content/")));
}

// MIME mentitore: un file `.png` dichiarato come HTML non viene accettato.
{
  const response = await post({ action: "upload", name: "lie.png", content_type: "text/html", data: base64("<script>") });
  check("media: a renamed file with an HTML type is refused", response.status === 415, `got ${response.status}`);
}

// Limite di dimensione.
{
  const big = "A".repeat(11 * 1024 * 1024);
  const response = await post({ action: "upload", name: "huge.png", content_type: "image/png", data: base64(big) });
  check("media: an oversized file is refused with 413", response.status === 413, `got ${response.status}`);
}

// Elenco e metadati.
{
  const list = await onRequestGet({ request: new Request("https://127.0.0.1/api/admin/media"), env });
  const data = await list.json();
  check("media: the library lists what was uploaded", list.status === 200 && data.items.some((item) => item.key === "content/raj.mp3"), JSON.stringify(data.items?.map((i) => i.key)));

  const updated = await post({ action: "update", key: "content/raj.mp3", alt: "Raj explaining the founding engineer role", caption: "Recorded in March" });
  const updatedData = await updated.json();
  check("media: alt text and caption are saved", updated.status === 200 && updatedData.item?.alt?.includes("founding engineer"), JSON.stringify(updatedData));

  const traversal = await post({ action: "delete", key: "content/../../etc/passwd" });
  check("media: delete refuses a traversal key", traversal.status === 400, `got ${traversal.status}`);
}

// Bucket non configurato: il pannello deve dirlo, non fallire in silenzio.
{
  const list = await onRequestGet({ request: new Request("https://127.0.0.1/api/admin/media"), env: { FEEDBACK: kv(), LOCAL_ADMIN: "1" } });
  const data = await list.json();
  check("media: an unconfigured bucket is reported, not hidden", list.status === 200 && data.storage === "unconfigured");
}

if (failures) {
  console.error(`\n${failures} media API test(s) failed`);
  process.exit(1);
}
console.log("\nmedia API: all checks passed");
