import { site } from "@/lib/site";
import { posts } from "@/lib/posts";
import { latestOf, urlsetXml } from "@/lib/sitemap";

export const dynamic = "force-static";

export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const urls = [
    {
      loc: `${base}/thoughts/`,
      // L'indice cambia quando cambia l'articolo più recente.
      lastmod: latestOf(posts.map((p) => p.updated ?? p.date)),
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
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}