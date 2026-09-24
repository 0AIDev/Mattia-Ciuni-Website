import type { Metadata } from "next";
import Link from "next/link";
import { HistoryBackButton } from "@/components/HistoryBackButton";
import { site } from "@/lib/site";
import { socialImages } from "@/lib/social";
import { languageAlternates } from "@/lib/seo";

const pageTitle = "About Mattia Ciuni | Founder & CEO of Payle";
const description =
  "Mattia Ciuni is an Italian founder and the founder and CEO of Payle, building the money layer for AI agents.";
const card = socialImages("/og.png", pageTitle);

export const metadata: Metadata = {
  title: "About Mattia Ciuni | Founder & CEO of Payle",
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
    jobTitle: "Founder & CEO of Payle",
    worksFor: { "@type": "Organization", name: "Payle", url: site.payleUrl },
    sameAs: Object.values(site.social),
    knowsAbout: [
      "AI agents",
      "agentic commerce",
      "payments infrastructure",
      "fintech",
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
          Mattia Ciuni is building the money layer for AI agents.
        </h1>
        <p className="mt-6 max-w-[600px] text-lg leading-relaxed text-text-paragraph">
          Mattia Ciuni is an Italian founder and the founder and CEO of Payle. He works on the rules, authorization and receipts that let software act and spend on behalf of people without turning autonomy into a black box.
        </p>
      </section>

      <section aria-labelledby="work-title" className="mb-16 sm:mb-24">
        <h2 id="work-title" className="mb-4 font-serif text-2xl font-medium">What Mattia Ciuni does</h2>
        <div className="space-y-4 text-text-paragraph">
          <p>At Payle, he is building controlled spending infrastructure for the agentic economy: per-agent policies, budgets, merchant rules, authorization and verifiable receipts.</p>
          <p>Before Payle, he built Celeste, an AI browser. The experience of watching an agent complete almost an entire task and then stop at a credit card form became the starting point for Payle.</p>
          <p>He writes about AI agents, payments, software, hiring and the decisions behind building a company in public.</p>
        </div>
      </section>

      <nav aria-label="Explore Mattia Ciuni's work" className="border-t border-gray-300">
        <Link href="/work/" className="group flex items-baseline justify-between gap-4 border-b border-gray-300 py-4">
          <span className="font-serif text-lg">Work</span>
          <span className="text-sm text-gray-1000 transition-transform group-hover:translate-x-1">Payle, Celeste and the topics underneath →</span>
        </Link>
        <Link href="/thoughts/" className="group flex items-baseline justify-between gap-4 border-b border-gray-300 py-4">
          <span className="font-serif text-lg">Thoughts</span>
          <span className="text-sm text-gray-1000 transition-transform group-hover:translate-x-1">AI agents, payments and building Payle →</span>
        </Link>
        <Link href="/notes/" className="group flex items-baseline justify-between gap-4 border-b border-gray-300 py-4">
          <span className="font-serif text-lg">Notes</span>
          <span className="text-sm text-gray-1000 transition-transform group-hover:translate-x-1">Longer, slower pieces →</span>
        </Link>
        <a href={site.payleUrl} rel="noopener noreferrer" className="group flex items-baseline justify-between gap-4 border-b border-gray-300 py-4">
          <span className="font-serif text-lg">Payle</span>
          <span className="text-sm text-gray-1000 transition-transform group-hover:translate-x-1">The money layer for AI agents →</span>
        </a>
      </nav>
    </main>
  );
}
