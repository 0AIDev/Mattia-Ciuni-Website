import { site } from "@/lib/site";
import {
  escapeXmlText,
  feedJobs,
  jobDescriptionHtml,
  rfc2822,
} from "@/lib/careers/feed";

export const dynamic = "force-static";

/**
 * RSS 2.0 dei ruoli aperti: lo stesso contenuto di `jobs.xml`, nel formato che
 * leggono i lettori generici e Careerjet. La description è HTML (il campo RSS
 * ammette markup con entità escaped).
 */
export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const jobs = feedJobs();
  const lastBuild = jobs.reduce<string>((latest, job) => (job.postedAt && job.postedAt > latest ? job.postedAt : latest), "2026-01-01");

  const items = jobs
    .map((job) => {
      const url = `${base}/careers/${job.slug}/`;
      const html = jobDescriptionHtml(job)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `    <item>
      <title>${escapeXmlText(job.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${html}</description>
      <pubDate>${rfc2822(job.postedAt || "2026-01-01")}</pubDate>
      <category>${escapeXmlText(job.department)}</category>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXmlText("Payle — Careers")}</title>
    <link>${base}/careers/</link>
    <description>${escapeXmlText("Open positions at Payle — the money layer for AI agents.")}</description>
    <language>en</language>
    <lastBuildDate>${rfc2822(lastBuild)}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
