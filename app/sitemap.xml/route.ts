import { site } from "@/lib/site";
import { latestOf, sitemapIndexXml } from "@/lib/sitemap";
import { posts } from "@/lib/posts";
import { notes } from "@/lib/notes";
import { feedback } from "@/lib/feedback";

export const dynamic = "force-static";

export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const thoughtDates = posts.map((p) => p.updated ?? p.date);
  const noteDates = notes.map((n) => n.date);
  const feedbackDates = feedback.map((f) => f.date);
  const xml = sitemapIndexXml([
    // Ogni figlia è datata con il contenuto più recente che contiene: l'indice
    // segue i contenuti, non la data del deploy.
    { loc: `${base}/sitemap-home.xml`, lastmod: latestOf([...thoughtDates, ...noteDates]) },
    { loc: `${base}/sitemap-thoughts.xml`, lastmod: latestOf(thoughtDates) },
    { loc: `${base}/sitemap-notes.xml`, lastmod: latestOf(noteDates) },
    { loc: `${base}/sitemap-feedback.xml`, lastmod: latestOf(feedbackDates) },
  ]);
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
