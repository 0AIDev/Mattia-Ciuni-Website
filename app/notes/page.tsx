import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import { ArrowUpLeftIcon } from "@/components/ui/arrow-up-left";
import { notes } from "@/lib/notes";

export const metadata: Metadata = {
  title: "Notes",
  description:
    "Long-form notes by Mattia Ciuni on AI, payments and the philosophy of building software. Written slowly, updated rarely.",
  alternates: {
    canonical: "/notes/",
    types: { "text/markdown": "/notes.md" },
  },
  openGraph: {
    type: "website",
    url: "/notes/",
    title: "Notes · Mattia Ciuni",
    description:
      "Long-form notes on AI agents, payments and the philosophy of building software.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Notes · Mattia Ciuni",
    description:
      "Long-form notes on AI agents, payments and the philosophy of building software.",
    images: ["/og.png"],
  },
};

export default function NotesIndex() {
  return (
    <main
      id="content"
      className="mx-auto max-w-[692px] px-6 py-12 leading-relaxed sm:py-24"
    >
      <header className="mb-16 flex items-center gap-4 sm:mb-24">
        <Link
          href="/"
          aria-label="Go back home"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-300 transition-colors hover:bg-gray-400"
        >
          <ArrowUpLeftIcon size={16} />
        </Link>
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
              className="group flex items-baseline justify-between gap-4 py-3.5"
            >
              <span className="font-serif font-medium">{n.title}</span>
              <span className="flex items-center gap-2 whitespace-nowrap text-gray-1000">
                {n.date}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <nav aria-label="Thoughts" className="mt-16 border-t border-gray-300">
        <Link
          href="/thoughts/"
          className="group flex items-baseline justify-between gap-4 py-3.5"
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