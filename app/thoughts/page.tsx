import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import { HistoryBackButton } from "@/components/HistoryBackButton";
import { site } from "@/lib/site";
import { posts } from "@/lib/posts";
import { socialImages } from "@/lib/social";

// La card di questa sezione, dichiarata come su tutte le altre pagine: misure,
// tipo e alt compresi (un'anteprima non indovina niente da sola).
const pageTitle = "Thoughts on AI agents and payments | Mattia Ciuni";
const card = socialImages("/thoughts/og.png", "Thoughts | Mattia Ciuni");

export const metadata: Metadata = {
  title: "Thoughts on AI agents and payments",
  description:
    "Thoughts by Mattia Ciuni on AI agents, payments and building Payle: the money layer for the agentic economy.",
  alternates: {
    canonical: "/thoughts/",
    types: { "text/markdown": "/thoughts.md" },
  },
  openGraph: {
    type: "website",
    url: "/thoughts/",
    siteName: "Mattia Ciuni",
    title: pageTitle,
    description:
      "Thoughts by Mattia Ciuni on AI agents, payments and building Payle.",
    images: card.og,
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description:
      "Thoughts by Mattia Ciuni on AI agents, payments and building Payle.",
    images: card.twitter,
  },
};

const listJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Mattia Ciuni | Thoughts",
  url: `${site.url.replace(/\/$/, "")}/thoughts/`,
  author: { "@type": "Person", name: "Mattia Ciuni", url: site.url },
};

export default function BlogIndex() {
  return (
    <main
      id="content"
      className="mx-auto w-full min-w-0 max-w-[692px] overflow-x-clip px-6 py-12 leading-relaxed sm:py-24"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }}
      />
      <header className="mb-16 flex min-w-0 items-center justify-between sm:mb-24">
        <div className="flex items-center gap-4">
          <HistoryBackButton fallbackLabel="Go back" />
          <span className="text-sm text-gray-1000">Thoughts</span>
        </div>
      </header>

      <div className="mb-16 sm:mb-24">
        <h1 className="mb-5 scroll-mt-20 font-serif text-3xl font-medium leading-tight text-gray-1200 sm:text-4xl">
          Thoughts
        </h1>
        <p className="m-0 max-w-[600px] text-text-paragraph">
          Thoughts on AI agents, payments and building Payle. Short, no fluff.
          written for myself, public by default.
        </p>
      </div>

      <ul className="m-0 list-none divide-y divide-gray-300 p-0">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/thoughts/${p.slug}/`}
              className="group flex min-w-0 flex-col items-start gap-1.5 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <span className="min-w-0 break-words font-serif font-medium [overflow-wrap:anywhere]">{p.title}</span>
              <span className="flex min-w-0 max-w-full items-center gap-2 break-words text-sm text-gray-1000 sm:whitespace-nowrap sm:text-base">
                {p.category} · {p.date}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <nav aria-label="Notes" className="mt-16 border-t border-gray-300">
        <Link
          href="/notes/"
          className="group flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5 py-3.5"
        >
          <span className="text-gray-1000">Longer, slower pieces</span>
          <span className="flex items-center gap-2 font-medium">
            Notes
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </nav>
    </main>
  );
}