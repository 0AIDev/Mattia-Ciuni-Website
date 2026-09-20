import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpLeftIcon } from "@/components/ui/arrow-up-left";
import { RelatedList } from "@/components/RelatedList";
import { InlineText } from "@/components/RichText";
import SectionCopyLink from "@/components/SectionCopyLink";
import TableOfContents, {
  MobileTableOfContents,
  type TocItem,
} from "@/components/TableOfContents";
import { site } from "@/lib/site";
import { getNote, notes, type NoteBlock } from "@/lib/notes";
import { posts } from "@/lib/posts";
import { relatedArticles } from "@/lib/related";
import { slugify } from "@/lib/slug";

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
    alternates: {
      canonical: url,
      types: { "text/markdown": `/notes/${note.slug}.md` },
    },
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

function RenderBlock({ block }: { block: NoteBlock }) {
  if (block.type === "h2")
    return (
      <h2
        id={slugify(block.text)}
        className="group mt-10 mb-3 flex scroll-mt-20 items-center gap-3 font-serif text-xl font-medium leading-snug text-gray-1200"
      >
        <SectionCopyLink anchor={slugify(block.text)} label={block.text} />
        <span>{block.text}</span>
      </h2>
    );
  return (
    <p className="w-full text-text-paragraph">
      <InlineText text={block.text} />
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

  const toc: TocItem[] = note.content.flatMap((block) =>
    block.type === "h2" ? [{ anchor: slugify(block.text), label: block.text }] : [],
  );
  const relatedNotes = relatedArticles(note, notes, 2);
  const relatedPosts = relatedArticles(note, posts, 2);

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

  // Stesso percorso che la pagina mostra a video (Home · Notes · titolo).
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base + "/" },
      { "@type": "ListItem", position: 2, name: "Notes", item: base + "/notes/" },
      { "@type": "ListItem", position: 3, name: note.title, item: url },
    ],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="m-0 flex list-none flex-wrap items-center gap-x-2 p-0 text-sm text-gray-1000">
          <li>
            <Link href="/" className="transition-colors hover:text-gray-1200">
              Home
            </Link>
          </li>
          <li aria-hidden="true">·</li>
          <li>
            <Link
              href="/notes/"
              className="transition-colors hover:text-gray-1200"
            >
              Notes
            </Link>
          </li>
          <li aria-hidden="true">·</li>
          <li aria-current="page" className="truncate text-gray-1200">
            {note.title}
          </li>
        </ol>
      </nav>
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

      {toc.length > 0 ? <TableOfContents items={toc} /> : null}
      <MobileTableOfContents items={toc} />

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

      <RelatedList
        id="more-notes"
        heading="More notes"
        items={relatedNotes.map((n) => ({
          slug: n.slug,
          href: `/notes/${n.slug}/`,
          title: n.title,
          meta: n.date,
        }))}
      />

      <RelatedList
        id="thoughts"
        heading="Thoughts"
        className="mt-16"
        items={relatedPosts.map((p) => ({
          slug: p.slug,
          href: `/thoughts/${p.slug}/`,
          title: p.title,
          meta: `${p.category} · ${p.date}`,
        }))}
      />

      <nav aria-label="All notes" className="mt-8 border-t border-gray-300">
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