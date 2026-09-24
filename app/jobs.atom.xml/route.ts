import { site } from "@/lib/site";
import {
  escapeXmlText,
  feedJobs,
  jobDescriptionHtml,
} from "@/lib/careers/feed";

export const dynamic = "force-static";

/**
 * Atom 1.0 dei ruoli aperti: alcuni aggregatori europei lo preferiscono e a
 * differenza di RSS ha tipi di contenuto espliciti (`type="html"`), quindi il
 * lettore non deve indovinare se la description è testo o markup.
 */
export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const jobs = feedJobs();
  const lastBuild = jobs.reduce<string>((latest, job) => (job.postedAt && job.postedAt > latest ? job.postedAt : latest), "2026-01-01");

  const entries = jobs
    .map((job) => {
      const url = `${base}/careers/${job.slug}/`;
      const html = jobDescriptionHtml(job)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `  <entry>
    <title>${escapeXmlText(job.title)}</title>
    <link rel="alternate" href="${url}"/>
    <id>${url}</id>
    <updated>${new Date(`${job.postedAt || "2026-01-01"}T00:00:00Z`).toISOString()}</updated>
    <published>${new Date(`${job.postedAt || "2026-01-01"}T00:00:00Z`).toISOString()}</published>
    <summary type="text">${escapeXmlText(job.shortPitch)}</summary>
    <content type="html">${html}</content>
    <category term="${escapeXmlText(job.department.toLowerCase())}" label="${escapeXmlText(job.department)}"/>
  </entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXmlText("Payle — Careers")}</title>
  <subtitle>${escapeXmlText("Open positions at Payle — the money layer for AI agents.")}</subtitle>
  <link rel="alternate" href="${base}/careers/"/>
  <link rel="self" href="${base}/jobs.atom.xml"/>
  <id>${base}/jobs.atom.xml</id>
  <updated>${new Date(`${lastBuild}T00:00:00Z`).toISOString()}</updated>
  <author>
    <name>Payle</name>
    <uri>${escapeXmlText(site.payleUrl)}</uri>
  </author>
${entries}
</feed>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
