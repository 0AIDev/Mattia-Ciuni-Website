import type { Metadata } from "next";
import Link from "next/link";
import { CareersRoleSearch } from "@/components/CareersRoleSearch";
import { HistoryBackButton } from "@/components/HistoryBackButton";
import { comingSoonJobs, openJobs, publicJobs, shouldShowRoleSearch } from "@/lib/careers/jobs";
import type { Locale } from "@/lib/i18n";
import { careersUi } from "@/lib/careers/ui";
import { socialImages } from "@/lib/social";

const careersTitle = "Build with Payle — Careers";
const careersDescription = "I hire by artifact: ship something real, then we talk. Open roles at Payle.";
const careersCard = socialImages("/careers/og.png", careersTitle);

export const metadata: Metadata = {
  title: careersTitle,
  description: careersDescription,
  alternates: { canonical: "/careers/" },
  openGraph: { type: "website", url: "/careers/", siteName: "Mattia Ciuni", title: careersTitle, description: careersDescription, images: careersCard.og },
  twitter: { card: "summary_large_image", title: careersTitle, description: careersDescription, images: careersCard.twitter },
};

export function CareersPage({ locale = "en", basePath = "/careers" }: { locale?: Locale; basePath?: string }) {
  const text = careersUi[locale];
  const jobs = publicJobs();
  const openCount = openJobs().length;
  const comingSoonCount = comingSoonJobs().length;
  const newsletterPath = `${locale === "en" ? "" : `/${locale}`}/newsletter/`;
  const showSearchControls = shouldShowRoleSearch(jobs.length);

  return (
    <main id="content" className="min-h-[70vh]">
      <article className="mx-auto w-full max-w-[692px] px-5 py-12 leading-relaxed sm:px-6 sm:py-24">
        <header className="mb-16 sm:mb-24">
          <div className="mb-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3"><HistoryBackButton fallbackHref={locale === "en" ? "/" : `/${locale}/`} fallbackLabel={text.back} /><Link href={locale === "en" ? "/" : `/${locale}/`} className="text-sm text-gray-1000 underline-offset-4 hover:underline">{text.home}</Link></div>
            <span className="text-sm text-gray-1000">{text.careers}</span>
          </div>
          <h1 className="max-w-[620px] font-serif text-5xl font-medium leading-[.98] tracking-[-.03em] text-gray-1200 sm:text-6xl">{text.title}</h1>
          <div className="mt-7 max-w-[600px] space-y-4 text-lg text-text-paragraph">
            <p>{text.intro}</p>
            <p>{text.introSecond}</p>
          </div>
        </header>

        <section aria-labelledby="roles-heading">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="roles-heading" className="font-serif text-2xl font-medium">{text.roles}</h2>
            <span className="text-sm text-gray-1000">{openCount} {text.open} · {comingSoonCount} {text.comingSoon}</span>
          </div>
          <CareersRoleSearch jobs={jobs} basePath={basePath} locale={locale} showControls={showSearchControls} />
        </section>

        <section className="mt-16 border-t border-gray-300 pt-8 sm:mt-24" aria-labelledby="not-for-you-heading">
          <h2 id="not-for-you-heading" className="font-serif text-2xl font-medium">{text.notForYou}</h2>
          <ul className="mt-5 list-disc space-y-3 pl-5 text-text-paragraph">{text.notForYouItems.map((item) => <li key={item}>{item}</li>)}</ul>
          <p className="mt-5 text-text-paragraph">{text.stillReading}</p>
        </section>

        <section className="mt-16 border-t border-gray-300 pt-8 sm:mt-24" aria-labelledby="process-heading">
          <h2 id="process-heading" className="font-serif text-2xl font-medium">{text.process}</h2>
          <p className="mt-4 max-w-[600px] text-text-paragraph">{text.processIntro}</p>
          <ol className="mt-5 list-decimal space-y-4 pl-5 text-text-paragraph">{text.processSteps.map((item) => <li key={item}>{item}</li>)}</ol>
          <p className="mt-5 text-text-paragraph">{text.processClosing}</p>
        </section>

        <p className="mt-8 text-sm text-gray-1000">{text.testimonial} <Link href="/thoughts/welcoming-alex-mwaniki-founding-engineer-core/" className="underline underline-offset-4">{text.testimonialLink}</Link></p>

        <section className="mt-16 border-t border-gray-300 pt-8 sm:mt-24" aria-labelledby="how-we-work-heading">
          <h2 id="how-we-work-heading" className="font-serif text-2xl font-medium">{text.howWeWork}</h2>
          <div className="mt-5 space-y-5 text-text-paragraph">{text.howWeWorkItems.map((item) => <p key={item}>{item}</p>)}</div>
        </section>

        <section className="mt-16 border-t border-gray-300 pt-8 sm:mt-24" aria-labelledby="newsletter-heading">
          <h2 id="newsletter-heading" className="font-serif text-2xl font-medium">{text.stayClose}</h2>
          <p className="mt-4 max-w-[600px] text-text-paragraph">{text.sundayLog}</p>
          <Link href={newsletterPath} className="mt-5 inline-block text-sm text-gray-1000 underline underline-offset-4">{text.subscribe}</Link>
        </section>
      </article>
    </main>
  );
}

export default function CareersPageRoute() {
  return <CareersPage />;
}
