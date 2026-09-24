import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HistoryBackButton } from "@/components/HistoryBackButton";
import { getJob, publicJobs } from "@/lib/careers/jobs";
import { careerMeta, inlineCareerText } from "@/lib/careers/format";
import { site } from "@/lib/site";
import type { Locale } from "@/lib/i18n";
import { careersUi } from "@/lib/careers/ui";
import { ClockIcon } from "@/components/ui/clock";
import { GlobeIcon } from "@/components/ui/globe";
import { WalletIcon } from "@/components/ui/wallet";
import SectionCopyLink from "@/components/SectionCopyLink";
import TableOfContents, { MobileTableOfContents, type TocItem } from "@/components/TableOfContents";
import { slugify } from "@/lib/slug";
import { socialImages } from "@/lib/social";
import { languageAlternates } from "@/lib/seo";
import { jobDescriptionHtml } from "@/lib/careers/feed";

export const dynamicParams = false;

export function generateStaticParams() {
  return publicJobs().map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const job = getJob((await params).slug);
  if (!job) return {};
  const card = socialImages(`/careers/${job.slug}/og.png`, job.title);
  return { title: job.title, description: job.shortPitch, alternates: { canonical: `/careers/${job.slug}/`, languages: languageAlternates(`/careers/${job.slug}/`) }, openGraph: { type: "website", url: `/careers/${job.slug}/`, siteName: "Mattia Ciuni", title: job.title, description: job.shortPitch, images: card.og }, twitter: { card: "summary_large_image", title: job.title, description: job.shortPitch, images: card.twitter } };
}

function MinimalArrow({ direction = "right" }: { direction?: "left" | "right" }) { return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d={direction === "left" ? "m12.5 4-6 6 6 6" : "m7.5 4 6 6-6 6"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /></svg>; }

function MetaIcon({ type }: { type: "globe" | "clock" | "wallet" | "arrow" }) {
  if (type === "globe") return <GlobeIcon size={17} className="shrink-0 text-gray-1000" />;
  if (type === "clock") return <ClockIcon size={17} className="shrink-0 text-gray-1000" />;
  if (type === "wallet") return <WalletIcon size={18} className="shrink-0 text-gray-1000" />;
  return <MinimalArrow />;
}

function MetaItem({ label, value, icon }: { label: string; value: string; icon: "globe" | "clock" | "wallet" | "arrow" }) {
  return <div className="min-w-0 bg-white px-4 py-3.5 sm:px-5"><div className="flex items-center gap-2 text-xs text-gray-1000"><MetaIcon type={icon} /><span>{label}</span></div><p className="mt-1 break-words text-sm leading-snug text-gray-1200">{value}</p></div>;
}

function descriptionBlocks(text: string) {
  return text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
}

function renderDescription(text: string) {
  return descriptionBlocks(text).map((block, index) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 1 && lines[0].startsWith("### ")) {
      const label = lines[0].slice(4).trim();
      const anchor = slugify(label);
      return <h2 id={anchor} key={`${block}-${index}`} className="group flex scroll-mt-20 items-center gap-3 pt-8 font-serif text-3xl font-medium first:pt-0"><SectionCopyLink anchor={anchor} label={label} /><span>{inlineCareerText(label)}</span></h2>;
    }
    if (lines.length > 0 && lines.every((line) => /^[-*] /.test(line))) {
      return <ul key={`${block}-${index}`} className="list-disc space-y-3 pl-5 marker:text-gray-1000">{lines.map((line) => <li key={line}>{inlineCareerText(line.slice(2))}</li>)}</ul>;
    }
    return <p key={`${block}-${index}`}>{inlineCareerText(block)}</p>;
  });
}

export default async function CareerDetailPage({ params, locale = "en", basePath = "/careers" }: { params: Promise<{ slug: string }>; locale?: Locale; basePath?: string }) {
  const job = getJob((await params).slug);
  if (!job) notFound();
  const text = careersUi[locale];
  const meta = careerMeta(job, locale);
  const toc: TocItem[] = descriptionBlocks(job.description).flatMap((block) => {
    const line = block.trim();
    if (!line.startsWith("### ")) return [];
    const label = line.slice(4).trim();
    return [{ anchor: slugify(label), label }];
  });
  const jsonLd = job.status === "open" ? {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    // Google Jobs renderizza il campo come HTML: lo stesso markup pulito dei
    // feed (`lib/careers/feed.ts`), non il testo del registro con i `###`.
    description: jobDescriptionHtml(job),
    datePosted: job.postedAt,
    employmentType: job.employmentType || "FULL_TIME",
    hiringOrganization: { "@type": "Organization", name: "Payle", url: site.payleUrl, logo: `${site.url.replace(/\/$/, "")}/logo.svg` },
    jobLocationType: "TELECOMMUTE",
    applicantLocationRequirements: { "@type": "AdministrativeArea", name: job.location },
    baseSalary: { "@type": "MonetaryAmount", currency: "EUR", value: { "@type": "QuantitativeValue", minValue: job.salaryMin ?? 2500, maxValue: job.salaryMax ?? 3000, unitText: "MONTH" } },
    // Il form di candidatura è su questa pagina: è il campo che dice a Google
    // Jobs che l'utente applica qui, non su un sito esterno.
    directApply: true,
  } : null;
  return (
    <main id="content" data-career-detail className="pb-20 lg:pb-0"><TableOfContents items={toc} locale={locale} placement="viewport-left" />
      <article className="mx-auto grid w-full max-w-[1040px] gap-10 px-5 py-12 leading-relaxed sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,692px)_280px] lg:items-start lg:gap-16">
        {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
        <header className="lg:col-span-2">
          <div className="flex items-center gap-3"><HistoryBackButton fallbackHref={`${basePath}/`} fallbackLabel={text.back} /><Link href={`${basePath}/`} className="text-sm text-gray-1000 underline-offset-4 hover:underline">{text.careers}</Link></div>
          <h1 className="mt-10 max-w-[720px] font-serif text-5xl font-medium leading-[.98] tracking-[-.03em] text-gray-1200 sm:text-6xl">{job.title}</h1>
          <p className="mt-6 max-w-[620px] text-xl leading-relaxed text-text-paragraph">{job.shortPitch}</p>
          <div className="career-meta mt-8 grid max-w-[760px] grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-300 bg-gray-300 lg:grid-cols-4">
            <MetaItem label={job.department} value={job.location} icon="globe" />
            <MetaItem label={locale === "it" ? "Contratto" : locale === "fr" ? "Contrat" : locale === "es" ? "Contrato" : locale === "de" ? "Vertrag" : "Type"} value={job.type} icon="arrow" />
            <MetaItem label={locale === "it" ? "Compenso" : locale === "fr" ? "Rémunération" : locale === "es" ? "Compensación" : locale === "de" ? "Vergütung" : "Compensation"} value={job.compensation || "—"} icon="wallet" />
            <MetaItem label={locale === "it" ? "Disponibilità" : locale === "fr" ? "Disponibilité" : locale === "es" ? "Disponibilidad" : locale === "de" ? "Verfügbarkeit" : "Availability"} value={meta.availability} icon="clock" />
          </div>
        </header>

        <div className="career-main-grid lg:col-span-2"><div className="max-w-[620px] space-y-6 text-[17px] leading-relaxed text-text-paragraph"><MobileTableOfContents items={toc} locale={locale} /><div id="the-role-content">{renderDescription(job.description)}</div>
          {job.challenge ? <section id="first-artifact" className="mt-16 border-t border-gray-300 pt-8" aria-labelledby="first-artifact-heading"><p className="text-xs uppercase tracking-[.12em] text-gray-1000">{locale === "it" ? "Primo artefatto" : locale === "fr" ? "Premier artefact" : locale === "es" ? "Primer artefacto" : locale === "de" ? "Erstes Artefakt" : "First artifact"}</p><h2 id="first-artifact-heading" className="mt-3 font-serif text-3xl font-medium">{job.challenge.title}</h2><p className="mt-4">{inlineCareerText(job.challenge.description)}</p><p className="mt-4 text-sm text-gray-1000"><strong>{locale === "it" ? "Consegna:" : locale === "fr" ? "Livrable :" : locale === "es" ? "Entrega:" : locale === "de" ? "Lieferumfang:" : "Deliverable:"}</strong> {inlineCareerText(job.challenge.deliverable)}</p>{job.datasetNote ? <aside aria-label="Dataset note" className="mt-6 rounded-2xl border border-gray-300 bg-white p-5 text-sm leading-relaxed text-gray-1000"><p className="m-0">{inlineCareerText(job.datasetNote)}</p>{job.datasetHref ? <p className="m-0 mt-3"><a href={job.datasetHref} className="font-medium text-gray-1200 underline underline-offset-4">{job.datasetHrefLabel || "Download the dataset"}</a></p> : null}</aside> : null}</section> : null}
          <section id="fit" className="mt-16 border-t border-gray-300 pt-8" aria-labelledby="not-for-you-heading"><p className="text-xs uppercase tracking-[.12em] text-gray-1000">{locale === "it" ? "Fit" : locale === "fr" ? "Compatibilité" : locale === "es" ? "Encaje" : locale === "de" ? "Passung" : "Fit"}</p><h2 id="not-for-you-heading" className="mt-3 font-serif text-3xl font-medium">{text.notForYou}</h2><ul className="mt-6 grid gap-3 sm:grid-cols-2">{text.notForYouItems.map((item) => <li key={item} className="rounded-2xl border border-gray-300 bg-white px-4 py-4 text-[15px] leading-relaxed">{inlineCareerText(item)}</li>)}</ul><blockquote className="mt-6 border-l-2 border-gray-400 pl-5 font-serif text-xl italic leading-relaxed text-gray-1100">{text.stillReading}</blockquote></section>
        </div>

        <aside className="career-sidebar">
          <div className="rounded-2xl border border-gray-300 bg-white p-5">
            <p className="font-serif text-2xl leading-tight">{job.title}</p>
            <p className="mt-4 text-sm leading-relaxed text-gray-1000">{job.status === "open" ? (job.applyNote || (locale === "it" ? "Le candidature sono aperte." : locale === "fr" ? "Les candidatures sont ouvertes." : locale === "es" ? "Las candidaturas están abiertas." : locale === "de" ? "Bewerbungen sind offen." : "Applications are open.")) : (locale === "it" ? "Le candidature non sono ancora aperte." : "Applications are not open yet.")}</p>
            {job.status === "open" ? <Link href={`${basePath}/${job.slug}/apply/`} className="group mt-6 flex min-h-11 items-center justify-center gap-2 rounded-full bg-gray-1200 px-5 text-center text-sm font-medium text-white transition-opacity hover:opacity-80"><span>{(locale === "en" ? "Start your application" : locale === "it" ? "Inizia la candidatura" : locale === "fr" ? "Commencer la candidature" : locale === "es" ? "Empezar la candidatura" : "Bewerbung starten")}</span><MinimalArrow /></Link> : null}
          </div>
        </aside>
      </div>
      </article>
      {job.status === "open" ? <div className="career-mobile-apply fixed inset-x-0 bottom-0 z-40 border-t border-gray-300 bg-white/95 p-3 backdrop-blur"><Link href={`${basePath}/${job.slug}/apply/`} className="group flex min-h-11 items-center justify-center gap-2 rounded-full bg-gray-1200 px-5 text-center text-sm font-medium text-white"><span>{(locale === "en" ? "Start your application" : locale === "it" ? "Inizia la candidatura" : locale === "fr" ? "Commencer la candidature" : locale === "es" ? "Empezar la candidatura" : "Bewerbung starten")}</span><MinimalArrow /></Link></div> : null}
    </main>
  );
}
