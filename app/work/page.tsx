import type { Metadata } from "next";
import Link from "next/link";
import { HistoryBackButton } from "@/components/HistoryBackButton";
import { site } from "@/lib/site";
import { socialImages } from "@/lib/social";
import { languageAlternates } from "@/lib/seo";

const pageTitle = "Work by Mattia Ciuni | Know Computer, Celeste, Payle, Ceilya, Noesia";
const description =
  "The work of Mattia Ciuni: building Know Computer, a personal context layer for the AI era, with Celeste and earlier payment work for AI agents.";
const card = socialImages("/og.png", "Work | Mattia Ciuni");
const base = site.url.replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Work by Mattia Ciuni | Know Computer, Celeste, Payle, Ceilya, Noesia",
  description,
  alternates: { canonical: "/work/", types: { "text/markdown": "/work.md" }, languages: languageAlternates("/work/") },
  openGraph: {
    type: "profile",
    url: "/work/",
    siteName: "Mattia Ciuni",
    title: pageTitle,
    description,
    images: card.og,
  },
  twitter: { card: "summary_large_image", title: pageTitle, description, images: card.twitter },
};

const workJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${base}/work/#webpage`,
  url: `${base}/work/`,
  name: pageTitle,
  description,
  isPartOf: { "@type": "WebSite", name: site.name, url: base + "/" },
  about: { "@id": `${base}/#mattia-ciuni` },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Know Computer",
        url: site.companyUrl,
        item: { "@type": "Organization", name: "Know Computer", url: site.companyUrl },
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Celeste",
        url: `${base}/work/#celeste`,
        item: { "@type": "SoftwareApplication", name: "Celeste", applicationCategory: "AI browser" },
      },
    ],
  },
};

export default function WorkPage() {
  return (
    <main id="content" className="mx-auto max-w-[692px] px-6 py-12 leading-relaxed sm:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(workJsonLd) }} />
      <header className="mb-16 flex items-center gap-4 sm:mb-24">
        <HistoryBackButton fallbackLabel="Go back" />
        <span className="text-sm text-gray-1000">Work</span>
      </header>

      <section aria-labelledby="work-page-title" className="mb-16 sm:mb-24">
        <h1 id="work-page-title" className="max-w-[620px] font-serif text-4xl font-medium leading-tight text-gray-1200 sm:text-5xl">
          I build the systems that let software act in the real world.
        </h1>
        <p className="mt-6 max-w-[600px] text-lg leading-relaxed text-text-paragraph">
          This is the short map of Mattia Ciuni&apos;s work. The common thread is context and continuity: helping computers and AI understand what matters so people can pick up where they left off.
        </p>
      </section>

      <section id="know" aria-labelledby="company-title" className="mb-16 border-t border-gray-300 pt-8 sm:mb-24">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="company-title" className="font-serif text-3xl font-medium">Know Computer</h2>
          <span className="text-sm text-gray-1000">Current work</span>
        </div>
        <p className="mt-5 max-w-[600px] text-text-paragraph">
          Know Computer is a personal context and intelligence layer for computers and AI. It gives people continuous, useful context across their files, browser activity, applications, conversations, coding tools, and connected services. The goal is to make personal information retrievable and actionable while keeping people in control of their context, permissions and data.
        </p>
        <p className="mt-4 max-w-[600px] text-text-paragraph">
          Know Layer is the financial action and payment infrastructure within the Know Computer ecosystem, carrying forward controlled actions and payments from earlier work on Payle, Ceilya and Noesia.
        </p>
        <a href={site.companyUrl} rel="noopener noreferrer" className="mt-5 inline-flex article-underline text-sm text-gray-1000">Visit Know Computer →</a>
      </section>

      <section id="celeste" aria-labelledby="celeste-title" className="mb-16 border-t border-gray-300 pt-8 sm:mb-24">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="celeste-title" className="font-serif text-3xl font-medium">Celeste</h2>
          <span className="text-sm text-gray-1000">Earlier work</span>
        </div>
        <p className="mt-5 max-w-[600px] text-text-paragraph">
          Before Know, I built Celeste, an AI browser. Earlier work on Payle, Ceilya and Noesia focused on financial infrastructure for AI agents. These experiences informed the shift toward a broader personal context layer for computers and AI.
        </p>
        <p className="mt-4 max-w-[600px] text-text-paragraph">
          I preserve the full history of these projects across the site - the lessons, not just the outcomes.
        </p>
      </section>

      <section aria-labelledby="topics-title" className="mb-16 border-t border-gray-300 pt-8 sm:mb-24">
        <h2 id="topics-title" className="font-serif text-3xl font-medium">The topics underneath</h2>
        <p className="mt-5 max-w-[600px] text-text-paragraph">
          The projects are connected by a set of questions I keep returning to: how agents receive permissions, how a payment system remains deterministic under concurrency, how trust can be represented in a receipt, and how a founder can build in public without turning the work into theatre. These are the subjects behind the site, and they are more useful than a page of invented expertise.
        </p>
        <ul className="mt-6 grid gap-x-8 gap-y-3 text-text-paragraph sm:grid-cols-2">
          <li>Personal context and memory</li>
          <li>Intelligence augmentation</li>
          <li>Context-aware AI</li>
          <li>Controlled actions and payments</li>
          <li>Data ownership and permissions</li>
          <li>Building in public</li>
          <li>Founder-led product building</li>
          <li>Reliable systems</li>
        </ul>
      </section>

      <nav aria-label="Explore the work" className="border-t border-gray-300">
        <Link href="/about/" className="group flex flex-wrap items-baseline justify-between gap-3 border-b border-gray-300 py-4">
          <span className="font-serif text-lg">About Mattia Ciuni</span>
          <span className="text-sm text-gray-1000 transition-transform group-hover:translate-x-1">The person behind the work →</span>
        </Link>
        <Link href="/thoughts/" className="group flex flex-wrap items-baseline justify-between gap-3 border-b border-gray-300 py-4">
          <span className="font-serif text-lg">Thoughts</span>
          <span className="text-sm text-gray-1000 transition-transform group-hover:translate-x-1">The arguments and decisions →</span>
        </Link>
        <Link href="/notes/" className="group flex flex-wrap items-baseline justify-between gap-3 border-b border-gray-300 py-4">
          <span className="font-serif text-lg">Notes</span>
          <span className="text-sm text-gray-1000 transition-transform group-hover:translate-x-1">The slower context →</span>
        </Link>
      </nav>
    </main>
  );
}
