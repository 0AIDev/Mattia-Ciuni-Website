import { site } from "@/lib/site";
import { latestOf, urlsetXml } from "@/lib/sitemap";
import { posts } from "@/lib/posts";
import { notes } from "@/lib/notes";
import { LOCALES } from "@/lib/i18n";
import { publicJobs as publicCareerJobs } from "@/lib/careers/jobs";

export const dynamic = "force-static";

export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const localized = LOCALES.flatMap((locale) => [
    { loc: `${base}/${locale}/`, lastmod: "2026-09-22", changeFrequency: "monthly", priority: "0.9" },
    ...["about", "work", "thoughts", "notes", "feedback", "privacy", "terms", "cookies", "legal", "newsletter", "link", "voice-notes", "videos", "careers"].map((path) => ({
      loc: `${base}/${locale}/${path}/`, lastmod: "2026-09-22", changeFrequency: "monthly", priority: "0.6",
    })),
  ]);
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
      loc: `${base}/work/`,
      lastmod: "2026-09-21",
      changeFrequency: "monthly",
      priority: "0.8",
    },
    {
      loc: `${base}/voice-notes/`,
      lastmod: "2026-09-21",
      changeFrequency: "monthly",
      priority: "0.5",
    },      { loc: `${base}/videos/`,
      lastmod: "2026-09-21",
      changeFrequency: "monthly",
      priority: "0.5",
    },
    {
      loc: `${base}/careers/`,
      lastmod: "2026-09-23",
      changeFrequency: "monthly",
      priority: "0.7",
    },
    ...publicCareerJobs().map((job) => ({
      loc: `${base}/careers/${job.slug}/`,
      lastmod: "2026-09-23",
      changeFrequency: "weekly",
      priority: job.status === "open" ? "0.8" : "0.5",
    })),
    ...localized,
  ]);
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
