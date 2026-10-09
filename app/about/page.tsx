import type { Metadata } from "next";
import Link from "next/link";
import { HistoryBackButton } from "@/components/HistoryBackButton";
import { site } from "@/lib/site";
import { socialImages } from "@/lib/social";
import { languageAlternates } from "@/lib/seo";

const pageTitle = "About Mattia Ciuni | Founder & CEO of Know Computer";
const description =
  "Mattia Ciuni is an Italian founder and the founder and CEO of Know Computer, building a personal context layer for the AI era.";
const card = socialImages("/og.png", pageTitle);

export const metadata: Metadata = {
  title: "About Mattia Ciuni | Founder & CEO of Know Computer",
  description,
  alternates: { canonical: "/about/", languages: languageAlternates("/about/") },
  openGraph: {
    type: "profile",
    url: "/about/",
    siteName: "Mattia Ciuni",
    title: pageTitle,
    description,
    images: card.og,
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description,
    images: card.twitter,
  },
};

const personId = `${site.url.replace(/\/$/, "")}/#mattia-ciuni`;
const profileJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  name: pageTitle,
  url: `${site.url.replace(/\/$/, "")}/about/`,
  mainEntity: {
    "@type": "Person",
    "@id": personId,
    name: "Mattia Ciuni",
    url: site.url,
    jobTitle: "Founder & CEO of Know Computer",
    worksFor: { "@type": "Organization", name: "Know Computer", url: site.companyUrl },
    sameAs: Object.values(site.social),
    knowsAbout: [
      "AI agents",
      "context",
      "memory",
      "intelligence augmentation",
      "software engineering",
    ],
  },
};

export default function AboutPage() {
  return (
    <main id="content" className="mx-auto max-w-[692px] px-6 py-12 leading-relaxed sm:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }} />
      <header className="mb-16 flex items-center gap-4 sm:mb-24">
        <HistoryBackButton fallbackLabel="Go back" />
        <span className="text-sm text-gray-1000">About</span>
      </header>

      <section aria-labelledby="about-title" className="mb-16 sm:mb-24">
        <h1 id="about-title" className="max-w-[600px] font-serif text-4xl font-medium leading-tight text-gray-1200 sm:text-5xl">
          Mattia Ciuni is building Know Computer.
        </h1>
        <p className="mt-6 max-w-[600px] text-lg leading-relaxed text-text-paragraph">
          Mattia Ciuni is an Italian founder and the founder and CEO of Know Computer. He&apos;s building a personal context layer for the AI era, to help people remember what matters and pick up where they left off.
        </p>
      </section>

      <section aria-labelledby="work-title" className="mb-16 sm:mb-24">
        <h2 id="work-title" className="mb-4 font-serif text-2xl font-medium">What Mattia Ciuni does</h2>
        <div className="space-y-4 text-text-paragraph">
          <p>At Know Computer, he&apos;s building a personal context layer for computers and AI, to help people maintain continuity across their tools and work.</p>
          <p>Before Know, he built Celeste and worked on financial infrastructure for AI agents through Payle, Ceilya and Noesia. That work continues through Know Layer, bringing controlled actions and payments into the Know ecosystem.</p>
          <p>He writes about context, intelligence augmentation, and the decisions behind building in public.</p>
        </div>
      </section>

      <nav aria-label="Explore Mattia Ciuni's work" className="border-t border-gray-300">
        <Link href="/work/" className="group flex items-baseline justify-between gap-4 border-b border-gray-300 py-4">
          <span className="font-serif text-lg">Work</span>
          <span className="text-sm text-gray-1000 transition-transform group-hover:translate-x-1">Know Computer, Celeste and the topics underneath →</span>
        </Link>
        <Link href="/thoughts/" className="group flex items-baseline justify-between gap-4 border-b border-gray-300 py-4">
          <span className="font-serif text-lg">Thoughts</span>
          <span className="text-sm text-gray-1000 transition-transform group-hover:translate-x-1">Building Know Computer →</span>
        </Link>
        <Link href="/notes/" className="group flex items-baseline justify-between gap-4 border-b border-gray-300 py-4">
          <span className="font-serif text-lg">Notes</span>
          <span className="text-sm text-gray-1000 transition-transform group-hover:translate-x-1">Longer, slower pieces →</span>
        </Link>
        <a href={site.companyUrl} rel="noopener noreferrer" className="group flex items-baseline justify-between gap-4 border-b border-gray-300 py-4">
          <span className="font-serif text-lg">Know Computer</span>
          <span className="text-sm text-gray-1000 transition-transform group-hover:translate-x-1">A personal context layer for the AI era →</span>
        </a>
      </nav>
    </main>
  );
}
