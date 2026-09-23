import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import { HistoryBackButton } from "@/components/HistoryBackButton";
import { notes } from "@/lib/notes";
import { socialImages } from "@/lib/social";

// La card di questa sezione, dichiarata come su tutte le altre pagine: misure,
// tipo e alt compresi (un'anteprima non indovina niente da sola).
const pageTitle = "Notes on AI, payments and software | Mattia Ciuni";
const card = socialImages("/notes/og.png", "Notes | Mattia Ciuni");
// Il `title` del metadata non include il sito: lo aggiunge il template del
// layout (`%s | Mattia Ciuni`), che è lo stesso divisore di ogni altra pagina.

export const metadata: Metadata = {
  title: "Notes on AI, payments and software",
  description:
    "Long-form notes by Mattia Ciuni on AI, payments and the philosophy of building software. Written slowly, updated rarely.",
  alternates: {
    canonical: "/notes/",
    types: { "text/markdown": "/notes.md" },
  },
  openGraph: {
    type: "website",
    url: "/notes/",
    siteName: "Mattia Ciuni",
    title: pageTitle,
    description:
      "Long-form notes on AI agents, payments and the philosophy of building software.",
    images: card.og,
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description:
      "Long-form notes on AI agents, payments and the philosophy of building software.",
    images: card.twitter,
  },
};

export default function NotesIndex() {
  return (
    <main
      id="content"
      className="mx-auto max-w-[692px] px-6 py-12 leading-relaxed sm:py-24"
    >
      <header className="mb-16 flex items-center gap-4 sm:mb-24">
        <HistoryBackButton fallbackLabel="Go back" />
        <span className="text-sm text-gray-1000">Notes</span>
      </header>

      <div className="mb-16 sm:mb-24">
        <h1 className="mb-5 scroll-mt-20 font-serif text-3xl font-medium leading-tight text-gray-1200 sm:text-4xl">
          Notes
        </h1>
        <p className="m-0 max-w-[600px] text-text-paragraph">
          Longer, slower pieces on AI agents, payments and how to build things
          that last. Not news, but thinking.
        </p>
      </div>

      <ul className="m-0 list-none divide-y divide-gray-300 p-0">
        {notes.map((n) => (
          <li key={n.slug}>
            <Link
              href={`/notes/${n.slug}/`}
              className="group block py-5"
            >
              <div className="overflow-hidden rounded-xl border border-gray-300 bg-preview-bg">
                <Image
                  src={`/notes/${n.slug}/cover.png`}
                  alt={n.title}
                  width={1200}
                  height={630}
                  className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.01] motion-reduce:transition-none"
                />
              </div>
              <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
                <span className="min-w-0 font-serif font-medium">{n.title}</span>
                <span className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm text-gray-1000 sm:text-base">
                  {n.date}
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <nav aria-label="Thoughts" className="mt-16 border-t border-gray-300">
        <Link
          href="/thoughts/"
          className="group flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5 py-3.5"
        >
          <span className="text-gray-1000">Shorter, faster pieces</span>
          <span className="flex items-center gap-2 font-medium">
            Thoughts
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </nav>
    </main>
  );
}