import { site } from "@/lib/site";
import { sitemapIndexXml } from "@/lib/sitemap";

export const dynamic = "force-static";

export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const xml = sitemapIndexXml([
    { loc: `${base}/sitemap-home.xml`, lastmod: "2026-09-20" },
    { loc: `${base}/sitemap-thoughts.xml`, lastmod: "2026-09-20" },
    { loc: `${base}/sitemap-notes.xml`, lastmod: "2026-09-20" },
  ]);
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}