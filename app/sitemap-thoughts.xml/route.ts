import { site } from "@/lib/site";
import { posts } from "@/lib/posts";
import { urlsetXml } from "@/lib/sitemap";

export const dynamic = "force-static";

export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const urls = [
    {
      loc: `${base}/thoughts/`,
      lastmod: "2026-09-20",
      changeFrequency: "weekly",
      priority: "0.8",
    },
    ...posts.map((p) => ({
      loc: `${base}/thoughts/${p.slug}/`,
      lastmod: p.updated ?? p.date,
      changeFrequency: "monthly",
      priority: "0.7",
    })),
  ];
  const xml = urlsetXml(urls);
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}