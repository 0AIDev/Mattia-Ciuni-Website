import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeftIcon } from "@/components/ui/arrow-up-left";
import { site } from "@/lib/site";
import { feedback } from "@/lib/feedback";
import { socialImages } from "@/lib/social";
import { FeedbackModalButton } from "@/components/FeedbackForm";

/**
 * Feedback ha una pagina volutamente diversa da tutte le altre sezioni: non è
 * un archivio di testi scritti da Mattia, è il muro dei contributi degli altri.
 * Layout a due colonne (chi ha contribuito + invito), card tonde, nessun bordo
 * doppio: la gerarchia è data dal spazio e dalle voci, non dai filetti.
 */
const pageTitle = "Feedback on Payle | Mattia Ciuni";
const card = socialImages("/og.png", "Feedback | Mattia Ciuni");

export const metadata: Metadata = {
  title: "Feedback on Payle",
  description:
    "Public exchanges where engineers attacked Payle's architecture and what their attacks changed. Send your own feedback: it gets reviewed, and if it holds, it gets published.",
  alternates: {
    canonical: "/feedback/",
    types: { "text/markdown": "/feedback.md" },
  },
  openGraph: {
    type: "website",
    url: "/feedback/",
    siteName: "Mattia Ciuni",
    title: pageTitle,
    description:
      "Public feedback on Payle's architecture: what engineers caught, what changed, and how to send your own.",
    images: card.og,
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description:
      "Public feedback on Payle's architecture: what engineers caught, what changed, and how to send your own.",
    images: card.twitter,
  },
};

const listJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Mattia Ciuni | Feedback",
  url: `${site.url.replace(/\/$/, "")}/feedback/`,
  author: { "@type": "Person", name: "Mattia Ciuni", url: site.url },
};

export default function FeedbackIndex() {
  return (
    <main
      id="content"
      className="mx-auto max-w-[820px] px-6 py-12 leading-relaxed sm:py-24"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }}
      />
      <header className="mb-14 flex items-center gap-4 sm:mb-20">
        <Link
          href="/"
          aria-label="Go back home"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-300 transition-colors hover:bg-gray-400"
        >
          <ArrowUpLeftIcon size={16} />
        </Link>
        <span className="text-sm text-gray-1000">Feedback</span>
      </header>

      {/* Hero centrato sul lettore che può diventare contributore: la pagina
          parla di loro prima che dei post. */}
      <section className="mb-16 text-center sm:mb-24">
        <p className="text-[13px] uppercase tracking-[0.2em] text-gray-1000">
          Feedback series
        </p>
        <h1 className="mx-auto mt-4 max-w-[560px] text-balance font-serif text-4xl font-medium leading-[1.1] text-gray-1200 sm:text-5xl">
          You attack it. It gets better. I publish it.
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-text-paragraph">
          Payle&apos;s architecture is public, and the sharpest corrections it
          ever got came from strangers. Every exchange that survives review is
          published here, credited: your name, or just an initial, your choice.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <FeedbackModalButton />
          <a
            href="#the-exchanges"
            className="rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-1000 transition-colors hover:border-gray-1200 hover:text-gray-1200"
          >
            Read the exchanges
          </a>
        </div>
      </section>

      {/* Le voci: una card tonda per contributo, l'autore in evidenza. */}
      <section id="the-exchanges" aria-label="Published feedback exchanges">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-xl font-medium">The exchanges</h2>
          <span className="text-sm text-gray-1000">{feedback.length} published</span>
        </div>
        <div className="grid gap-4">
          {feedback.map((f) => (
            <Link
              key={f.slug}
              href={`/feedback/${f.slug}/`}
              className="group rounded-3xl border border-gray-300 p-6 transition-colors hover:border-gray-1200 sm:p-8"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-1200 font-serif text-sm text-white"
                >
                  {f.author.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-sm font-medium text-gray-1200">{f.author}</span>
                <span aria-hidden="true" className="text-gray-1000">·</span>
                <span className="text-sm text-gray-1000">{f.date}</span>
              </div>
              <span className="mt-4 block font-serif text-xl font-medium leading-snug text-gray-1200 sm:text-2xl">
                {f.title}
              </span>
              <p className="mt-2 m-0 text-[15px] leading-relaxed text-gray-1000">
                {f.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* La promessa, in una riga: chiudo con il gesto, non con la prosa. */}
      <section className="mt-16 rounded-3xl bg-gray-1200 px-6 py-12 text-center sm:mt-20 sm:py-16" aria-label="Send your feedback">
        <p className="mx-auto max-w-[420px] font-serif text-2xl leading-snug text-white">
          The next Feedback post might be about your comment.
        </p>
        <div className="mt-6">
          <FeedbackModalButton
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-gray-1200"
          />
        </div>
      </section>

      <nav aria-label="More writing" className="mt-16 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-1000">
        <Link href="/thoughts/" className="article-underline">Thoughts</Link>
        <Link href="/notes/" className="article-underline">Notes</Link>
        <Link href="/" className="article-underline">Home</Link>
      </nav>
    </main>
  );
}
