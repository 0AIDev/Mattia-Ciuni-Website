import assert from "node:assert/strict";
import { markdownToBlocks, blocksToMarkdown } from "../lib/cms-format.ts";
import { mergeCmsCollection } from "../lib/cms-content.ts";
import { supabaseConfigured, supabaseTablesReady } from "../functions/lib/supabase.ts";

const markdown = [
  "Intro paragraph with **bold** and [Payle](https://usepayle.com).",
  "",
  "## A section",
  "",
  "> A quote",
  "",
  "- First item",
  "- Second item",
  "",
  "```ts",
  "const ready = true;",
  "```",
  "",
  "@@audio|/voice.mp3|One sentence",
].join("\n");
const blocks = markdownToBlocks(markdown);
assert.deepEqual(blocks[0], { type: "p", text: "Intro paragraph with **bold** and [Payle](https://usepayle.com)." });
assert.deepEqual(blocks[1], { type: "h2", text: "A section" });
assert.deepEqual(blocks[2], { type: "quote", text: "A quote" });
assert.deepEqual(blocks[3], { type: "list", items: ["First item", "Second item"] });
assert.deepEqual(blocks[4], { type: "code", lang: "ts", code: "const ready = true;" });
assert.deepEqual(blocks[5], { type: "audio", src: "/voice.mp3", title: "One sentence" });
assert.equal(blocksToMarkdown(blocks), markdown);

const base = [{ slug: "one", title: "Base" }, { slug: "two", title: "Two" }];
const merged = mergeCmsCollection(base, [{ slug: "one", title: "Published override" }, { slug: "three", title: "Three" }]);
assert.deepEqual(merged, [{ slug: "one", title: "Published override" }, { slug: "two", title: "Two" }, { slug: "three", title: "Three" }]);
// Le chiavi non sono lo schema.
//
// Con le variabili Supabase presenti e le tabelle mai migrate il pannello
// diceva `ready` e il primo salvataggio falliva: "pronto" era una promessa sul
// deploy, non sul database. Qui si sostituisce `fetch` per provare che i due
// stati si distinguono davvero, senza toccare nulla di reale.
const supabaseEnv = { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-role" };
const realFetch = globalThis.fetch;
let probes = 0;
try {
  assert.equal(supabaseConfigured(supabaseEnv), true);
  // Senza chiavi non si chiede niente in rete: non c'e' niente da chiedere.
  assert.equal(await supabaseTablesReady({}), false);
  assert.equal(probes, 0);
  globalThis.fetch = async () => { probes += 1; return new Response("[]", { status: 200 }); };
  assert.equal(await supabaseTablesReady(supabaseEnv), true);
  globalThis.fetch = async () => { probes += 1; return new Response(JSON.stringify({ code: "PGRST205" }), { status: 404 }); };
  assert.equal(await supabaseTablesReady(supabaseEnv), false);
  globalThis.fetch = async () => { probes += 1; throw new Error("network"); };
  assert.equal(await supabaseTablesReady(supabaseEnv), false);
  assert.equal(probes, 3);
} finally {
  globalThis.fetch = realFetch;
}

console.log("cms: Markdown blocks, round-trip, static override merge and Supabase schema probe passed");
