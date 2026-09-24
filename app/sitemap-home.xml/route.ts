import { site } from "@/lib/site";
import { latestOf, urlsetXml } from "@/lib/sitemap";
import { posts } from "@/lib/posts";
import { notes } from "@/lib/notes";
import { feedback } from "@/lib/feedback";
import { LOCALES } from "@/lib/i18n";
import { publicJobs as publicCareerJobs } from "@/lib/careers/jobs";

export const dynamic = "force-static";

export async function GET() {
  const base = site.url.replace(/\/$/, "");
  // Le sitemap figlie dei contenuti qui sotto portano la lingua principale.
  // Ogni pagina localizzata dichiara una canonical propria ed è quindi una URL
  // indicizzabile: elenchiamo anche articoli, note, feedback e ruoli per ciascun
  // locale. I flussi applicativi Careers (`apply`, `confirmed`, `thank-you` e
  // `preview`) restano deliberatamente fuori: hanno `noindex` e non sono pagine
  // editoriali.
  const localized = LOCALES.flatMap((locale) => [
    { loc: `${base}/${locale}/`, lastmod: "2026-09-22", changeFrequency: "monthly", priority: "0.9" },
    ...["about", "work", "thoughts", "notes", "feedback", "privacy", "terms", "cookies", "legal", "newsletter", "link", "voice-notes", "videos", "careers"].map((path) => ({
      loc: `${base}/${locale}/${path}/`, lastmod: "2026-09-22", changeFrequency: "monthly", priority: "0.6",
    })),
    ...posts.map((post) => ({
      loc: `${base}/${locale}/thoughts/${post.slug}/`,
      lastmod: post.updated ?? post.date,
      changeFrequency: "monthly",
      priority: "0.7",
    })),
    ...notes.map((note) => ({
      loc: `${base}/${locale}/notes/${note.slug}/`,
      lastmod: note.date,
      changeFrequency: "monthly",
      priority: "0.6",
    })),
    ...feedback.map((item) => ({
      loc: `${base}/${locale}/feedback/${item.slug}/`,
      lastmod: item.date,
      changeFrequency: "monthly",
      priority: "0.6",
    })),
    ...publicCareerJobs().map((job) => ({
      loc: `${base}/${locale}/careers/${job.slug}/`,
      lastmod: "2026-09-23",
      changeFrequency: "weekly",
      priority: job.status === "open" ? "0.8" : "0.5",
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
    },
    {
      loc: `${base}/videos/`,
      lastmod: "2026-09-21",
      changeFrequency: "monthly",
      priority: "0.5",
    },
    {
      loc: `${base}/cookies/`,
      lastmod: "2026-09-21",
      changeFrequency: "monthly",
      priority: "0.5",
    },
    {
      loc: `${base}/legal/`,
      lastmod: "2026-09-21",
      changeFrequency: "monthly",
      priority: "0.5",
    },
    {
      loc: `${base}/link/`,
      lastmod: "2026-09-21",
      changeFrequency: "monthly",
      priority: "0.5",
    },
    {
      loc: `${base}/newsletter/`,
      lastmod: "2026-09-21",
      changeFrequency: "monthly",
      priority: "0.5",
    },
    {
      loc: `${base}/privacy/`,
      lastmod: "2026-09-21",
      changeFrequency: "monthly",
      priority: "0.5",
    },
    {
      loc: `${base}/terms/`,
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
