import type { Metadata } from "next";
import Link from "next/link";
import { HistoryBackButton } from "@/components/HistoryBackButton";
import { site } from "@/lib/site";
import { socialImages } from "@/lib/social";
import { languageAlternates } from "@/lib/seo";

const pageTitle = "Work by Mattia Ciuni | Payle, Celeste and AI Payments";
const description =
  "The work of Mattia Ciuni: building Payle's payments infrastructure for AI agents, after building Celeste, an AI browser.";
const card = socialImages("/og.png", "Work | Mattia Ciuni");
const base = site.url.replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Work by Mattia Ciuni | Payle, Celeste and AI Payments",
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
        name: "Payle",
        url: site.payleUrl,
        item: { "@type": "Organization", name: "Payle", url: site.payleUrl },
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
          This is the short map of Mattia Ciuni&apos;s work. The common thread is not a job title or a list of technologies. It is the point where software stops being a tool you click and starts acting on someone&apos;s behalf. First that meant helping an agent navigate the web. Now it means giving an agent controlled, accountable spending power.
        </p>
      </section>

      <section id="payle" aria-labelledby="payle-title" className="mb-16 border-t border-gray-300 pt-8 sm:mb-24">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="payle-title" className="font-serif text-3xl font-medium">Payle</h2>
          <span className="text-sm text-gray-1000">Current work</span>
        </div>
        <p className="mt-5 max-w-[600px] text-text-paragraph">
          Payle is the money layer for AI agents. I am building the authorization and payments infrastructure that makes autonomous spending safe enough to use: scoped capabilities, per-agent and per-task limits, merchant rules, approval thresholds, idempotency, revocation and receipts that explain what happened. The goal is not to hand a model an unrestricted wallet. The goal is controlled delegation: a person or company defines the boundaries once, an agent works inside them, and every decision can be inspected afterwards.
        </p>
        <p className="mt-4 max-w-[600px] text-text-paragraph">
          This work sits across AI agents, agentic commerce, fintech infrastructure, risk, payments and software reliability. The difficult questions are deliberately practical. What happens when two identical requests arrive together? What does a merchant need to verify? How should a failed risk service behave? How can an operator revoke authority immediately? I write the answers as I discover them in <Link href="/thoughts/" className="article-underline">Thoughts</Link> and <Link href="/notes/" className="article-underline">Notes</Link>, and I publish useful corrections from other people in <Link href="/feedback/" className="article-underline">Feedback</Link>.
        </p>
        <a href={site.payleUrl} rel="noopener noreferrer" className="mt-5 inline-flex article-underline text-sm text-gray-1000">Visit Payle →</a>
      </section>

      <section id="celeste" aria-labelledby="celeste-title" className="mb-16 border-t border-gray-300 pt-8 sm:mb-24">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="celeste-title" className="font-serif text-3xl font-medium">Celeste</h2>
          <span className="text-sm text-gray-1000">Earlier work</span>
        </div>
        <p className="mt-5 max-w-[600px] text-text-paragraph">
          Before Payle, I built Celeste, an AI browser. It could open pages, follow instructions, research, compare options and complete workflows. The important lesson was not that the agent could navigate a browser. It was that the last ten percent of an apparently finished task exposed a completely different infrastructure problem. The agent could do the thinking and the work, then it stopped at the credit card form because the financial system assumed that every actor was a human with a hand, a wallet and a phone.
        </p>
        <p className="mt-4 max-w-[600px] text-text-paragraph">
          That experience became the starting point for Payle. It connected a product question about browsers to a larger question about authority, liability and trust. Celeste is part of the context for the current work, not a separate keyword page or a claim that the two products are the same.
        </p>
      </section>

      <section aria-labelledby="topics-title" className="mb-16 border-t border-gray-300 pt-8 sm:mb-24">
        <h2 id="topics-title" className="font-serif text-3xl font-medium">The topics underneath</h2>
        <p className="mt-5 max-w-[600px] text-text-paragraph">
          The projects are connected by a set of questions I keep returning to: how agents receive permissions, how a payment system remains deterministic under concurrency, how trust can be represented in a receipt, and how a founder can build in public without turning the work into theatre. These are the subjects behind the site, and they are more useful than a page of invented expertise.
        </p>
        <ul className="mt-6 grid gap-x-8 gap-y-3 text-text-paragraph sm:grid-cols-2">
          <li>AI agent payments</li>
          <li>Agentic commerce</li>
          <li>Authorization and policy</li>
          <li>Spending limits and revocation</li>
          <li>Idempotency and reliable systems</li>
          <li>Fintech infrastructure</li>
          <li>Founder-led product building</li>
          <li>Artifact-based hiring</li>
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
