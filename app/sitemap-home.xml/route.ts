import { site } from "@/lib/site";
import { urlsetXml } from "@/lib/sitemap";

export const dynamic = "force-static";

export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const xml = urlsetXml([
    {
      loc: `${base}/`,
      lastmod: "2026-09-20",
      changeFrequency: "monthly",
      priority: "1.0",
    },
  ]);
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}