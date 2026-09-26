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

// Il giro markdown → blocchi → markdown deve restituire lo stesso testo.
//
// Il blocco di un titolo era `h2` senza livello: un `###` di una pagina di
// ruolo tornava `##`, quindi ogni pubblicazione dal pannello perdeva un livello
// e il `JobPosting` restava senza `h3`. Il tipo del blocco non cambia (i
// renderer conoscono solo `h2`): a viaggiare e' il livello, che serve solo al
// ritorno.
const body = "Intro.\n\n### The role\n\nBody text.\n\n## Second\n\n- one\n- two";
const roundTripped = blocksToMarkdown(markdownToBlocks(body));
assert.equal(roundTripped, body);
// E il caso che non va dimenticato: un blocco scritto a mano, senza `level`,
// resta un `##` come prima. Il ripiego e' deliberato, non un default ereditato.
assert.equal(blocksToMarkdown([{ type: "h2", text: "Legacy" }]), "## Legacy");
assert.deepEqual(markdownToBlocks("### Deep")[0], { type: "h2", level: 3, text: "Deep" });

// Il merge con `keepUnlistedFields` esiste per i registri che il pannello non
// possiede interamente: un'offerta ha `postedAt` e `challenge`, e l'editor non ha
// un campo per nessuno dei due, quindi sostituire l'oggetto li avrebbe cancellati
// dalla pagina nel momento in cui la si pubblica.
const role = { slug: "role", title: "Role", postedAt: "2026-09-23", challenge: { title: "Artifact" }, description: "body" };
const [mergedRole] = mergeCmsCollection([role], [{ slug: "role", title: "Role", description: "new body" }], { keepUnlistedFields: true });
assert.equal(mergedRole.postedAt, "2026-09-23");
assert.deepEqual(mergedRole.challenge, { title: "Artifact" });
assert.equal(mergedRole.description, "new body");
// Senza l'opzione il comportamento e' quello di sempre: il file vince intero. Le
// collezioni editoriali dipendono da questo, perche' un campo svuotato dal
// pannello deve restare svuotato.
const [replacedRole] = mergeCmsCollection([role], [{ slug: "role", title: "Role" }]);
assert.equal(replacedRole.postedAt, undefined);

console.log("cms: Markdown blocks, round-trip, static override merge and Supabase schema probe passed");
