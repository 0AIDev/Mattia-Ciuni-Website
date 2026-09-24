import { site } from "@/lib/site";
import {
  cdata,
  escapeXmlText,
  feedJobs,
  indeedJobType,
  jobDescriptionHtml,
  rfc2822,
  salaryLine,
} from "@/lib/careers/feed";

export const dynamic = "force-static";

/**
 * Il feed nel formato Indeed XML, che leggono anche Glassdoor, Jooble,
 * Talent.com/Neuvoo, Careerjet e la maggior parte degli aggregatori. Ogni
 * `<url>` torna qui: la candidatura avviene sul sito, mai sulla board.
 *
 * Il publisher è Payle (chi assume), non il sito personale: è il nome che il
 * candidato vede sulla board, e deve combaciare con `hiringOrganization` del
 * JSON-LD. Le voci XML non hanno date di build dinamiche: l'export è statico e
 * `lastBuildDate` segue la data dell'ultimo ruolo pubblicato, così il valore
 * non cambia a ogni build senza che sia cambiato nulla.
 */
export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const jobs = feedJobs();
  const lastBuild = jobs.reduce<string>((latest, job) => (job.postedAt && job.postedAt > latest ? job.postedAt : latest), "2026-01-01");

  const entries = jobs
    .map((job) => {
      const url = `${base}/careers/${job.slug}/`;
      return `  <job>
    <title>${cdata(escapeXmlText(job.title))}</title>
    <date>${cdata(job.postedAt || "2026-01-01")}</date>
    <referenceno>${cdata(job.slug)}</referenceno>
    <url>${cdata(url)}</url>
    <company>${cdata("Payle")}</company>
    <companyurl>${cdata(site.payleUrl)}</companyurl>
    <city>${cdata(job.location)}</city>
    <country>${cdata("Remote")}</country>
    <description>${cdata(jobDescriptionHtml(job))}</description>
    <salary>${cdata(salaryLine(job))}</salary>
    <jobtype>${cdata(indeedJobType(job))}</jobtype>
    <category>${cdata(job.department.toLowerCase())}</category>
  </job>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>${escapeXmlText("Payle")}</publisher>
  <publisherUrl>${escapeXmlText(site.payleUrl)}</publisherUrl>
  <lastBuildDate>${rfc2822(lastBuild)}</lastBuildDate>
${entries}
</source>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
