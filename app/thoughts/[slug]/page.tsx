import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import CopyPostLink from "@/components/CopyPostLink";
import { CoverImage } from "@/components/CoverImage";
import { GhassenLinks } from "@/components/GhassenLinks";
import { RelatedList } from "@/components/RelatedList";
import { InlineText } from "@/components/RichText";
import { ChevronRight } from "@/components/icons";
import { HistoryBackButton } from "@/components/HistoryBackButton";
import { MailCheckIcon } from "@/components/ui/mail-check";
import { AudioPlayer } from "@/components/MediaPlayers";
import SectionCopyLink from "@/components/SectionCopyLink";
import TableOfContents, {
  MobileTableOfContents,
  type TocItem,
} from "@/components/TableOfContents";
import { site } from "@/lib/site";
import { getPost, posts, type Block } from "@/lib/posts";
import { notes } from "@/lib/notes";
import { relatedArticles } from "@/lib/related";
import { slugify } from "@/lib/slug";
import { socialImages } from "@/lib/social";
import { articleUi } from "@/lib/article-ui";
import type { Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `/thoughts/${post.slug}/`;
  const card = socialImages(`/thoughts/${post.slug}/og.png`, post.title);
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: "Mattia Ciuni", url: site.url }],
    alternates: {
      canonical: url,
      types: { "text/markdown": `/thoughts/${post.slug}.md` },
    },
    openGraph: {
      type: "article",
      url,
      siteName: "Mattia Ciuni",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: ["Mattia Ciuni"],
      tags: post.tags,
      images: card.og,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: card.twitter,
    },
  };
}

function RenderBlock({ block }: { block: Block }) {
  if (block.type === "h2") {
    const anchor = slugify(block.text);
    return (
      <h2
        id={anchor}
        className="group mt-20 mb-5 flex min-w-0 items-center gap-3 scroll-mt-20"
      >
        <SectionCopyLink anchor={anchor} label={block.text} />
        <span className="min-w-0 break-words font-serif leading-tight">{block.text}</span>
        <span className="h-px min-w-8 flex-1 bg-gray-400" aria-hidden="true" />
      </h2>
    );
  }
  if (block.type === "quote")
    return (
      <blockquote className="m-0 border-l-2 border-gray-400 pl-4 font-serif italic text-gray-1100">
        <InlineText text={block.text} />
      </blockquote>
    );
  if (block.type === "list")
    return (
      <ul className="m-0 list-disc space-y-2 pl-5 text-text-paragraph marker:text-gray-1000">
        {block.items.map((it) => (
          <li key={it}>
            <InlineText text={it} />
          </li>
        ))}
      </ul>
    );
  if (block.type === "code")
    return (
      <pre className="m-0 overflow-x-auto bg-gray-100 p-4 text-sm text-gray-1100">
        <code>{block.code}</code>
      </pre>
    );
  if (block.type === "audio")
    return (
      <div className="my-1">
        <AudioPlayer src={block.src} title={block.title} />
      </div>
    );
  return (
    <p className="w-full text-text-paragraph">
      <InlineText text={block.text} />
    </p>
  );
}

function BlockFlow({ blocks }: { blocks: Block[] }) {
  const flowing = new Set(["p", "list", "quote"]);
  return (
    <div className="flex flex-col">
      {blocks.map((b, i) => {
        const next = blocks[i + 1];
        const hasBreak = next && flowing.has(next.type);
        return (
          <Fragment key={i}>
            <RenderBlock block={b} />
            {hasBreak ? <br /> : null}
          </Fragment>
        );
      })}
    </div>
  );
}

export default async function BlogPost({
  params,
  fallbackHref = "/",
  locale = "en",
}: {
  params: Promise<{ slug: string }>;
  fallbackHref?: string;
  locale?: Locale;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const ui = articleUi[locale];
  const prefix = locale === "en" ? "" : `/${locale}`;
  const base = site.url.replace(/\/$/, "");
  const url = `${base}/thoughts/${post.slug}/`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { "@type": "Person", name: "Mattia Ciuni", url: site.url },
    publisher: { "@type": "Person", name: "Mattia Ciuni", url: site.url },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: `${base}/thoughts/${post.slug}/og.png`,
    keywords: post.keywords.join(", "),
    articleSection: post.category,
    inLanguage: "en",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: ui.home, item: base + `${prefix}/` },
      { "@type": "ListItem", position: 2, name: ui.thoughts, item: base + `${prefix}/thoughts/` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  const toc: TocItem[] = post.content.flatMap((block) =>
    block.type === "h2" ? [{ anchor: slugify(block.text), label: block.text }] : [],
  );

  const idx = posts.findIndex((p) => p.slug === post.slug);
  const next = posts[idx + 1] ?? posts[idx - 1];
  const related = relatedArticles(post, posts, 2);
  const relatedNotes = relatedArticles(post, notes, 2);

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
              href={`${prefix}/thoughts/`}
              className="transition-colors hover:text-gray-1200">{ui.thoughts}
            </Link>
          </li>
          <li aria-hidden="true">·</li>
          <li aria-current="page" className="min-w-0 break-words text-gray-1200">
            {post.title}
          </li>
        </ol>
      </nav>
      <header className="mb-16 flex min-w-0 flex-wrap items-center justify-between gap-4 sm:mb-24">
        <div className="flex min-w-0 max-w-full items-center gap-4">
          <HistoryBackButton fallbackHref={fallbackHref} fallbackLabel={ui.back} />
          <span className="min-w-0 text-sm text-gray-1000">
            <time dateTime={post.date}>{post.date}</time>
            {post.updated ? (
              <>
                {" "}
                · {ui.updated} <time dateTime={post.updated}>{post.updated}</time>
              </>
            ) : null}{" "}
            · {post.readingMinutes} {ui.minRead}
          </span>
        </div>
        <CopyPostLink locale={locale} />
      </header>

      <article className="relative min-w-0 max-w-full">
        {toc.length > 0 ? <TableOfContents items={toc} locale={locale} /> : null}
        <MobileTableOfContents items={toc} locale={locale} />
        <div data-article-content className="min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
          <CoverImage src={`/thoughts/${post.slug}/cover.png`} />
          <h1
            id={post.slug}
            className="mb-5 min-w-0 scroll-mt-20 break-words font-serif text-3xl font-medium leading-tight text-gray-1200 sm:text-4xl [overflow-wrap:anywhere]"
          >
            {post.title}
          </h1>
          <BlockFlow blocks={post.content} />
          {post.slug === "finding-ghassen-the-co-founder-question-answered-in-three-weeks" ? <GhassenLinks /> : null}
          <p className="mt-12 w-full text-text-paragraph">
            Building the money layer for AI agents at{" "}
            <a href={site.payleUrl} rel="noopener noreferrer" className="article-underline">
              Payle
            </a>
            . Reply via{" "}
            <a
              href={`mailto:${site.email}`}
              className="article-underline inline-flex items-center gap-1.5"
            >
              <MailCheckIcon size={15} className="inline-flex shrink-0" />
              {site.email}
            </a>
            .
          </p>
        </div>
      </article>

      <RelatedList
        id="more"
        heading={ui.more}
        items={related.map((r) => ({
          slug: r.slug,
          href: `${prefix}/thoughts/${r.slug}/`,
          title: r.title,
          meta: `${r.category} · ${r.date}`,
        }))}
      />

      <RelatedList
        id="notes"
        heading={ui.notes}
        className="mt-16"
        items={relatedNotes.map((n) => ({
          slug: n.slug,
          href: `${prefix}/notes/${n.slug}/`,
          title: n.title,
          meta: n.date,
        }))}
      />

      <nav aria-label={ui.continueReading} className="mt-8 border-t border-gray-300">
        {next ? (
          <Link
            href={`${prefix}/thoughts/${next.slug}/`}
            className="group flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5 py-3.5"
          >
            <span className="text-gray-1000">{ui.next}</span>
            <span className="flex min-w-0 items-center gap-2 text-right font-serif font-[450]">
              {next.title}
              <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ) : (
          <Link
            href={`${prefix}/thoughts/`}
            className="group flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5 py-3.5"
          >
            <span className="text-gray-1000">{ui.thoughts}</span>
            <span className="font-medium">{ui.allPosts}</span>
          </Link>
        )}
      </nav>
    </main>
  );
}