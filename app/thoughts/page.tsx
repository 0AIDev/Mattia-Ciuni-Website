import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import { ArrowUpLeftIcon } from "@/components/ui/arrow-up-left";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";
import { site } from "@/lib/site";
import { posts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Thoughts",
  description:
    "Thoughts by Mattia Ciuni on AI agents, payments and building Payle: the money layer for the agentic economy.",
  alternates: { canonical: "/thoughts/" },
  openGraph: {
    type: "website",
    url: "/thoughts/",
    title: "Thoughts · Mattia Ciuni",
    description:
      "Thoughts by Mattia Ciuni on AI agents, payments and building Payle.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Thoughts · Mattia Ciuni",
    description:
      "Thoughts by Mattia Ciuni on AI agents, payments and building Payle.",
    images: ["/og.png"],
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
      className="mx-auto max-w-[692px] px-6 py-12 leading-relaxed sm:py-24"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }}
      />
      <header className="mb-16 flex items-center justify-between sm:mb-24">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="Go back home"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-300 transition-colors hover:bg-gray-400"
          >
            <ArrowUpLeftIcon size={16} />
          </Link>
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
              className="group flex items-baseline justify-between gap-4 py-3.5"
            >
              <span className="font-serif font-medium">{p.title}</span>
              <span className="flex items-center gap-2 whitespace-nowrap text-gray-1000">
                {p.category} · {p.date}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <footer className="mt-16 border-t border-gray-300 pt-8 sm:mt-24">
        <a href="/feed.xml" className="flex w-fit items-center gap-1.5 text-gray-1000">
          Feed <ArrowUpRightIcon size={15} className="inline-flex shrink-0" />
        </a>
      </footer>
    </main>
  );
}