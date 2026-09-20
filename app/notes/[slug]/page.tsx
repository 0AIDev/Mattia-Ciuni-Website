import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { ArrowUpLeftIcon } from "@/components/ui/arrow-up-left";
import { site } from "@/lib/site";
import { getNote, notes, type NoteBlock } from "@/lib/notes";

export function generateStaticParams() {
  return notes.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) return {};
  const url = `/notes/${note.slug}/`;
  return {
    title: note.title,
    description: note.description,
    keywords: note.keywords,
    authors: [{ name: "Mattia Ciuni", url: site.url }],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: note.title,
      description: note.description,
      publishedTime: note.date,
      authors: ["Mattia Ciuni"],
      tags: note.keywords.slice(0, 3),
    },
    twitter: {
      card: "summary_large_image",
      title: note.title,
      description: note.description,
      images: ["/og.png"],
    },
  };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.length > 2 && part.startsWith("*") && part.endsWith("*") ? (
          <em key={i} className="font-serif italic">
            {part.slice(1, -1)}
          </em>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

function RenderBlock({ block }: { block: NoteBlock }) {
  if (block.type === "h2")
    return (
      <h2
        id={slugify(block.text)}
        className="mt-10 mb-3 scroll-mt-20 font-serif text-xl font-medium leading-snug text-gray-1200"
      >
        {block.text}
      </h2>
    );
  return (
    <p className="w-full text-text-paragraph">
      <Inline text={block.text} />
    </p>
  );
}

export default async function Note({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) notFound();

  const base = site.url.replace(/\/$/, "");
  const url = `${base}/notes/${note.slug}/`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: note.title,
    description: note.description,
    datePublished: note.date,
    author: { "@type": "Person", name: "Mattia Ciuni", url: site.url },
    publisher: { "@type": "Person", name: "Mattia Ciuni", url: site.url },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: note.keywords.join(", "),
    inLanguage: "en",
  };

  return (
    <main
      id="content"
      className="mx-auto max-w-[692px] px-6 py-12 leading-relaxed sm:py-24"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
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
          <Link href="/notes/" className="text-sm text-gray-1000">
            Notes
          </Link>
        </div>
        <span className="text-sm text-gray-1000">
          <time dateTime={note.date}>{note.date}</time>
        </span>
      </header>

      <article>
        <h1
          className="mb-5 scroll-mt-20 font-serif text-3xl font-medium leading-tight text-gray-1200 sm:text-4xl"
        >
          {note.title}
        </h1>
        <div className="flex flex-col">
          {note.content.map((b, i) => (
            <RenderBlock key={i} block={b} />
          ))}
        </div>
      </article>

      <nav aria-label="All notes" className="mt-16 border-t border-gray-300">
        <Link
          href="/notes/"
          className="group flex items-baseline justify-between py-3.5"
        >
          <span className="text-gray-1000">Notes</span>
          <span className="font-medium">All notes</span>
        </Link>
      </nav>
    </main>
  );
}