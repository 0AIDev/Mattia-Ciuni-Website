import { site } from "@/lib/site";
import { posts } from "@/lib/posts";

export const dynamic = "force-static";

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${base}/thoughts/${p.slug}/</link>
      <guid>${base}/thoughts/${p.slug}/</guid>
      <description>${escapeXml(p.description)}</description>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml("Mattia Ciuni | Thoughts")}</title>
    <link>${base}/thoughts/</link>
    <description>${escapeXml("Thoughts by Mattia Ciuni on AI agents, payments and building Payle.")}</description>
    <language>en</language>
${items}
  </channel>
</rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
