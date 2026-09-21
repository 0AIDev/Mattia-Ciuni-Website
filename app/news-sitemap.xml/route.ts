import { posts } from "@/lib/posts";
import { site } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const urls = posts.map((post) => `  <url>\n    <loc>${base}/thoughts/${post.slug}/</loc>\n    <news:news>\n      <news:publication>\n        <news:name>Mattia Ciuni</news:name>\n        <news:language>en</news:language>\n      </news:publication>\n      <news:publication_date>${post.date}</news:publication_date>\n      <news:title>${escapeXml(post.title)}</news:title>\n    </news:news>\n  </url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" } });
}
