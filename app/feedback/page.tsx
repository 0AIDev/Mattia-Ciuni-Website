import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeftIcon } from "@/components/ui/arrow-up-left";
import { site } from "@/lib/site";
import { feedback } from "@/lib/feedback";
import { socialImages } from "@/lib/social";

// Il master di sezione è disegnato a mano come per Thoughts e Notes; finché non
// esiste la OG della home fa da immagine provvisoria dichiarata (verify.js
// pretende che ogni og:image dichiarato esista davvero, e questa esiste).
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
      <header className="mb-16 flex items-center gap-4 sm:mb-24">
        <Link
          href="/"
          aria-label="Go back home"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-300 transition-colors hover:bg-gray-400"
        >
          <ArrowUpLeftIcon size={16} />
        </Link>
        <span className="text-sm text-gray-1000">Feedback</span>
      </header>

      <div className="mb-16 border-t-2 border-gray-1200 pt-5 sm:mb-24">
        <h1 className="mb-5 scroll-mt-20 font-serif text-3xl font-medium leading-tight text-gray-1200 sm:text-4xl">
          Feedback
        </h1>
        <p className="m-0 max-w-[600px] text-text-paragraph">
          Public exchanges where engineers attacked Payle&apos;s architecture,
          and what their attacks changed. I publish the corrections, not just
          the wins.
        </p>
        <p className="mt-4 m-0 max-w-[600px] text-sm leading-relaxed text-gray-1000">
          Want yours here?{" "}
          <a
            href={`mailto:${site.email}?subject=Feedback%20on%20Payle`}
            className="article-underline"
          >
            Send it by email
          </a>
          . Every submission is read and reviewed; if it holds up, it gets
          published with your name or just an initial, your choice.
        </p>
      </div>

      <ul className="m-0 list-none divide-y divide-gray-300 border-t-2 border-gray-1200 p-0">
        {feedback.map((f) => (
          <li key={f.slug}>
            <Link
              href={`/feedback/${f.slug}/`}
              className="group block py-5"
            >
              <div className="flex items-baseline gap-3 text-[13px] uppercase tracking-wide text-gray-1000">
                <span>Feedback series</span>
                <span aria-hidden="true">·</span>
                <span>{f.date}</span>
              </div>
              <span className="mt-1 block font-serif text-lg font-medium leading-snug text-gray-1200 transition-colors group-hover:text-gray-1100">
                {f.title}
              </span>
              <p className="mt-2 m-0 text-sm leading-relaxed text-gray-1000">
                {f.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <nav aria-label="More writing" className="mt-16 border-t border-gray-300">
        <Link
          href="/thoughts/"
          className="group flex items-baseline justify-between gap-4 py-3.5"
        >
          <span className="text-gray-1000">Short, sharp posts</span>
          <span className="flex items-center gap-2 font-medium">
            Thoughts
            <ChevronRight />
          </span>
        </Link>
        <Link
          href="/notes/"
          className="group flex items-baseline justify-between gap-4 py-3.5"
        >
          <span className="text-gray-1000">Longer, slower pieces</span>
          <span className="flex items-center gap-2 font-medium">
            Notes
            <ChevronRight />
          </span>
        </Link>
      </nav>
    </main>
  );
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="transition-transform group-hover:translate-x-1"
    >
      <path
        d="M6 3.5L10.5 8L6 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
