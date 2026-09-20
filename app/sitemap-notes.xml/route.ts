import { site } from "@/lib/site";
import { notes } from "@/lib/notes";
import { latestOf, urlsetXml } from "@/lib/sitemap";

export const dynamic = "force-static";

export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const urls = [
    {
      loc: `${base}/notes/`,
      // L'indice cambia quando cambia la nota più recente.
      lastmod: latestOf(notes.map((n) => n.date)),
      changeFrequency: "monthly",
      priority: "0.6",
    },
    ...notes.map((n) => ({
      loc: `${base}/notes/${n.slug}/`,
      lastmod: n.date,
      changeFrequency: "monthly",
      priority: "0.6",
    })),
  ];
  const xml = urlsetXml(urls);
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}