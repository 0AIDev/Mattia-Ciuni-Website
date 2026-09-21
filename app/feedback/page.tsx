import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeftIcon } from "@/components/ui/arrow-up-left";
import { GithubIcon } from "@/components/ui/github";
import { site } from "@/lib/site";
import { feedback } from "@/lib/feedback";
import { socialImages } from "@/lib/social";
import { FeedbackModalButton } from "@/components/FeedbackForm";

/**
 * Feedback ha una pagina volutamente diversa da tutte le altre sezioni: non è
 * un archivio di testi scritti da Mattia, è il muro dei contributi degli altri.
 * Card piccole e minimal come le righe degli altri elenchi, ma chiuse in un
 * riquadro tondo; l'autore in testa con il suo GitHub quando lo rivendica.
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
      className="mx-auto max-w-[692px] px-6 py-12 leading-relaxed sm:py-24"
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

      {/* Hero: la pagina parla di chi contribuisce prima che dei post. */}
      <section className="mb-16 sm:mb-20">
        <h1 className="max-w-[560px] text-balance font-serif text-3xl font-medium leading-[1.15] text-gray-1200 sm:text-4xl">
          You attack it. It gets better. I publish it.
        </h1>
        <p className="mt-5 max-w-[560px] text-text-paragraph">
          Payle&apos;s architecture is public, and the sharpest corrections it
          ever got came from strangers. Every exchange that survives review is
          published here, credited: your name, or just an initial, your choice.
        </p>
        <div className="mt-7">
          <FeedbackModalButton label="Give feedback" />
        </div>
      </section>

      {/* Le voci: card piccole, minimal, come le righe delle altre sezioni ma
          con l'autore in testa e il bordo che si stringe all'hover. */}
      <section aria-label="Published feedback exchanges">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-xl font-medium">The exchanges</h2>
          <span className="text-sm text-gray-1000">{feedback.length} published</span>
        </div>
        <div className="grid gap-3">
          {feedback.map((f) => (
            <Link
              key={f.slug}
              href={`/feedback/${f.slug}/`}
              className="group rounded-2xl border border-gray-300 px-5 py-4 transition-colors hover:border-gray-1200"
            >
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
                <span className="font-medium text-gray-1200">{f.author}</span>
                {f.github ? (
                  <a
                    href={f.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${f.author} on GitHub`}
                    className="relative z-10 inline-flex items-center gap-1.5 text-gray-1000 transition-colors hover:text-gray-1200"
                  >
                    <GithubIcon size={14} className="inline-flex shrink-0" />
                    <span className="text-xs">{f.github.replace("https://github.com/", "")}</span>
                  </a>
                ) : null}
                <span aria-hidden="true" className="text-gray-1000">·</span>
                <span className="text-gray-1000">{f.date}</span>
              </div>
              <span className="mt-1.5 block font-serif text-lg font-medium leading-snug text-gray-1200">
                {f.title}
              </span>
              <p className="mt-1 m-0 line-clamp-2 text-sm leading-relaxed text-gray-1000">
                {f.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* La promessa, in una riga: chiudo con il gesto, non con la prosa. */}
      <section className="mt-14 rounded-3xl bg-gray-1200 px-6 py-10 text-center sm:py-12" aria-label="Send your feedback">
        <p className="mx-auto max-w-[420px] font-serif text-xl leading-snug text-white sm:text-2xl">
          The next Feedback post might be about your comment.
        </p>
        <div className="mt-5">
          <FeedbackModalButton
            variant="outline"
            className="!border-white !bg-transparent !text-white hover:!border-white hover:!opacity-80"
          />
        </div>
      </section>

      <nav aria-label="More writing" className="mt-14 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-1000">
        <Link href="/thoughts/" className="article-underline">Thoughts</Link>
        <Link href="/notes/" className="article-underline">Notes</Link>
        <Link href="/" className="article-underline">Home</Link>
      </nav>
    </main>
  );
}
