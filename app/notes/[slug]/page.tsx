import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HistoryBackButton } from "@/components/HistoryBackButton";
import { CoverImage } from "@/components/CoverImage";
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
import { socialImages } from "@/lib/social";
import { articleUi } from "@/lib/article-ui";
import type { Locale } from "@/lib/i18n";

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
  const card = socialImages(`/notes/${note.slug}/og.png`, note.title);
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
      siteName: "Mattia Ciuni",
      title: note.title,
      description: note.description,
      publishedTime: note.date,
      authors: ["Mattia Ciuni"],
      modifiedTime: note.date,
      tags: note.keywords.slice(0, 3),
      images: card.og,
    },
    twitter: {
      card: "summary_large_image",
      title: note.title,
      description: note.description,
      images: card.twitter,
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
  fallbackHref = "/",
  locale = "en",
}: {
  params: Promise<{ slug: string }>;
  fallbackHref?: string;
  locale?: Locale;
}) {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) notFound();
  const ui = articleUi[locale];
  const prefix = locale === "en" ? "" : `/${locale}`;

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
    dateModified: note.date,
    author: { "@type": "Person", name: "Mattia Ciuni", url: site.url },
    publisher: { "@type": "Person", name: "Mattia Ciuni", url: site.url },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: `${base}/notes/${note.slug}/og.png`,
    keywords: note.keywords.join(", "),
    inLanguage: "en",
  };

  // Stesso percorso che la pagina mostra a video (Home · Notes · titolo).
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: ui.home, item: base + `${prefix}/` },
      { "@type": "ListItem", position: 2, name: ui.notes, item: base + `${prefix}/notes/` },
      { "@type": "ListItem", position: 3, name: note.title, item: url },
    ],
  };

  return (
    <main
      id="content"
      className="mx-auto w-full min-w-0 max-w-[692px] overflow-x-clip px-6 py-12 leading-relaxed sm:py-24"
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
            <Link href={`${prefix}/`} className="transition-colors hover:text-gray-1200">
              {ui.home}
            </Link>
          </li>
          <li aria-hidden="true">·</li>
          <li>
            <Link
              href={`${prefix}/notes/`}
              className="transition-colors hover:text-gray-1200"
            >
              {ui.notes}
            </Link>
          </li>
          <li aria-hidden="true">·</li>
          <li aria-current="page" className="min-w-0 break-words text-gray-1200">
            {note.title}
          </li>
        </ol>
      </nav>
      <header className="mb-16 flex flex-wrap items-center justify-between gap-4 sm:mb-24">
        <div className="flex items-center gap-4">
          <HistoryBackButton fallbackHref={fallbackHref} fallbackLabel={ui.back} />
          <Link href={`${prefix}/notes/`} className="text-sm text-gray-1000">
            {ui.notes}
          </Link>
        </div>
        <span className="text-sm text-gray-1000">
          <time dateTime={note.date}>{note.date}</time>
        </span>
      </header>

      <article className="relative min-w-0 max-w-full">
        {toc.length > 0 ? <TableOfContents items={toc} /> : null}
        <MobileTableOfContents items={toc} />
        <div data-article-content className="min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
          <CoverImage src={`/notes/${note.slug}/cover.png`} />
          <h1
            className="mb-5 min-w-0 scroll-mt-20 break-words font-serif text-3xl font-medium leading-tight text-gray-1200 sm:text-4xl [overflow-wrap:anywhere]"
          >
            {note.title}
          </h1>
          <div className="flex flex-col">
            {note.content.map((b, i) => (
              <RenderBlock key={i} block={b} />
            ))}
          </div>
        </div>
      </article>

      <RelatedList
        id="more-notes"
        heading={ui.moreNotes}
        items={relatedNotes.map((n) => ({
          slug: n.slug,
          href: `${prefix}/notes/${n.slug}/`,
          title: n.title,
          meta: n.date,
        }))}
      />

      <RelatedList
        id="thoughts"
        heading={ui.thoughts}
        className="mt-16"
        items={relatedPosts.map((p) => ({
          slug: p.slug,
          href: `${prefix}/thoughts/${p.slug}/`,
          title: p.title,
          meta: `${p.category} · ${p.date}`,
        }))}
      />

      <nav aria-label={ui.allNotes} className="mt-8 border-t border-gray-300">
        <Link
          href={`${prefix}/notes/`}
          className="group flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5 py-3.5"
        >
          <span className="text-gray-1000">{ui.notes}</span>
          <span className="font-medium">{ui.allNotes}</span>
        </Link>
      </nav>
    </main>
  );
}