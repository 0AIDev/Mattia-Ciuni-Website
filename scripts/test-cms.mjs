import assert from "node:assert/strict";
import { markdownToBlocks, blocksToMarkdown } from "../lib/cms-format.ts";
import { mergeCmsCollection } from "../lib/cms-content.ts";

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
console.log("cms: Markdown blocks, round-trip and static override merge passed");
