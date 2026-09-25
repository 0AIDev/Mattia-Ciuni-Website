import type { CmsContentData } from "./cms-types";

type UnknownBlock = Record<string, unknown>;

/**
 * Il JSON di un file pubblicato su Git.
 *
 * La prima versione di `publishContentToGit` aggiungeva `"\\n"` invece di un
 * ritorno a capo: due caratteri, backslash e n, dopo la graffa finale. Il file
 * risultava corrotto, il loader della build lo scartava con un `console.warn` e
 * il contenuto pubblicato non arrivava mai online, mentre il publish e il deploy
 * sembravano riusciti. Il writer e' corretto, e questa funzione accetta anche la
 * forma sbagliata: un file gia' scritto cosi' non deve sparire dal sito.
 */
export function parsePublishedJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    const healed = text.replace(/\\+n\s*$/, "");
    if (healed === text) throw error;
    return JSON.parse(healed) as T;
  }
}

export function blocksToMarkdown(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  return blocks.map((block) => {
    if (!block || typeof block !== "object") return "";
    const item = block as UnknownBlock;
    if (item.type === "h2") return `## ${String(item.text || "")}`;
    if (item.type === "quote") return String(item.text || "").split("\n").map((line) => `> ${line}`).join("\n");
    if (item.type === "list" && Array.isArray(item.items)) return item.items.map((entry) => `- ${String(entry)}`).join("\n");
    if (item.type === "code") return `\`\`\`${String(item.lang || "")}\n${String(item.code || "")}\n\`\`\``;
    if (item.type === "audio") return `@@audio|${String(item.src || "")}|${String(item.title || "")}`;
    return String(item.text || "");
  }).filter(Boolean).join("\n\n");
}

export function markdownToBlocks(markdown: string): UnknownBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: UnknownBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] || "";
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (line.startsWith("@@audio|")) {
      const [src, ...title] = line.slice(8).split("|");
      blocks.push({ type: "audio", src: src || "", title: title.join("|") || "Audio" });
      index += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !(lines[index] || "").startsWith("```")) {
        code.push(lines[index] || "");
        index += 1;
      }
      index += 1;
      blocks.push({ type: "code", lang, code: code.join("\n") });
      continue;
    }
    if (/^##\s+/.test(line)) {
      blocks.push({ type: "h2", text: line.replace(/^##\s+/, "").trim() });
      index += 1;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index] || "")) {
        quote.push((lines[index] || "").replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", text: quote.join("\n") });
      continue;
    }
    if (/^-\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^-\s+/.test(lines[index] || "")) {
        items.push((lines[index] || "").replace(/^-\s+/, "").trim());
        index += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length && (lines[index] || "").trim() && !/^(##|>|-\s|```|@@audio\|)/.test(lines[index] || "")) {
      paragraph.push(lines[index] || "");
      index += 1;
    }
    if (paragraph.length) blocks.push({ type: "p", text: paragraph.join("\n") });
    else index += 1;
  }
  return blocks;
}

export function contentDataWithBody(data: CmsContentData, bodyMarkdown: string): CmsContentData {
  return { ...data, content: markdownToBlocks(bodyMarkdown) };
}
