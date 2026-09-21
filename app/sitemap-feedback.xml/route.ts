import { site } from "@/lib/site";
import { feedback } from "@/lib/feedback";
import { latestOf, urlsetXml } from "@/lib/sitemap";

export const dynamic = "force-static";

export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const urls = [
    {
      loc: `${base}/feedback/`,
      lastmod: latestOf(feedback.map((f) => f.date)),
      changeFrequency: "monthly",
      priority: "0.6",
    },
    ...feedback.map((f) => ({
      loc: `${base}/feedback/${f.slug}/`,
      lastmod: f.date,
      changeFrequency: "monthly",
      priority: "0.6",
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
