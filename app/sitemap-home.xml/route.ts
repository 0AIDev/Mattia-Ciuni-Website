import { site } from "@/lib/site";
import { latestOf, urlsetXml } from "@/lib/sitemap";
import { posts } from "@/lib/posts";
import { notes } from "@/lib/notes";

export const dynamic = "force-static";

export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const xml = urlsetXml([
    {
      loc: `${base}/`,
      // La home cambia quando cambia quello che elenca (Thoughts + Notes).
      lastmod: latestOf([
        ...posts.map((p) => p.updated ?? p.date),
        ...notes.map((n) => n.date),
      ]),
      changeFrequency: "monthly",
      priority: "1.0",
    },
    {
      loc: `${base}/about/`,
      lastmod: "2026-09-21",
      changeFrequency: "monthly",
      priority: "0.8",
    },
    {
      loc: `${base}/voice-notes/`,
      lastmod: "2026-09-21",
      changeFrequency: "monthly",
      priority: "0.5",
    },
    {
      loc: `${base}/videos/`,
      lastmod: "2026-09-21",
      changeFrequency: "monthly",
      priority: "0.5",
    },
  ]);
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
