import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import CopyPostLink from "@/components/CopyPostLink";
import { ChevronRight } from "@/components/icons";
import { ArrowUpLeftIcon } from "@/components/ui/arrow-up-left";
import { LinkIcon } from "@/components/ui/link";
import { MailCheckIcon } from "@/components/ui/mail-check";
import { site } from "@/lib/site";
import { getPost, posts, type Block } from "@/lib/posts";

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
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: "Mattia Ciuni", url: site.url }],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: ["Mattia Ciuni"],
      tags: post.tags,
      images: [
        {
          url: `/thoughts/${post.slug}/og.png`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [`/thoughts/${post.slug}/og.png`],
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

function RenderBlock({ block }: { block: Block }) {
  if (block.type === "h2") {
    const anchor = slugify(block.text);
    return (
      <h2
        id={anchor}
        className="group mt-20 mb-5 flex scroll-mt-20 items-center gap-3"
      >
        <a
          href={`#${anchor}`}
          aria-label={`Link to section: ${block.text}`}
          className="text-gray-1000 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <LinkIcon size={16} />
        </a>
        <span className="font-serif leading-tight">{block.text}</span>
        <span className="h-px min-w-8 flex-1 bg-gray-400" aria-hidden="true" />
      </h2>
    );
  }
  if (block.type === "quote")
    return (
      <blockquote className="m-0 border-l-2 border-gray-400 pl-4 font-serif italic text-gray-1100">
        <Inline text={block.text} />
      </blockquote>
    );
  if (block.type === "list")
    return (
      <ul className="m-0 list-disc space-y-2 pl-5 text-text-paragraph marker:text-gray-1000">
        {block.items.map((it) => (
          <li key={it}>
            <Inline text={it} />
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
  return (
    <p className="w-full text-text-paragraph">
      <Inline text={block.text} />
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
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
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
      { "@type": "ListItem", position: 1, name: "Home", item: base + "/" },
      { "@type": "ListItem", position: 2, name: "Thoughts", item: base + "/thoughts/" },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  const idx = posts.findIndex((p) => p.slug === post.slug);
  const next = posts[idx + 1] ?? posts[idx - 1];
  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 2);

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
      <header className="mb-16 flex items-center justify-between sm:mb-24">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="Go back home"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-300 transition-colors hover:bg-gray-400"
          >
            <ArrowUpLeftIcon size={16} />
          </Link>
          <span className="text-sm text-gray-1000">
            <time dateTime={post.date}>{post.date}</time>
            {post.updated ? (
              <>
                {" "}
                · updated <time dateTime={post.updated}>{post.updated}</time>
              </>
            ) : null}{" "}
            · {post.readingMinutes} min read
          </span>
        </div>
        <CopyPostLink />
      </header>

      <article>
        <h1
          id={post.slug}
          className="mb-5 scroll-mt-20 font-serif text-3xl font-medium leading-tight text-gray-1200 sm:text-4xl"
        >
          {post.title}
        </h1>
        <BlockFlow blocks={post.content} />
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
      </article>

      {related.length > 0 && (
        <section aria-labelledby="more" className="mt-24">
          <h2 id="more" className="mb-2 font-medium">More</h2>
          <ul className="m-0 list-none divide-y divide-gray-300 p-0">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/thoughts/${r.slug}/`}
                  className="group flex items-baseline justify-between gap-4 py-3.5"
                >
                  <span className="font-serif font-[450]">{r.title}</span>
                  <span className="flex items-center gap-2 whitespace-nowrap text-gray-1000">
                    {r.category} · {r.date}
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Continue reading" className="mt-8 border-t border-gray-300">
        {next ? (
          <Link
            href={`/thoughts/${next.slug}/`}
            className="group flex items-baseline justify-between gap-4 py-3.5"
          >
            <span className="text-gray-1000">Next</span>
            <span className="flex items-center gap-2 text-right font-serif font-[450]">
              {next.title}
              <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ) : (
          <Link
            href="/thoughts/"
            className="group flex items-baseline justify-between py-3.5"
          >
            <span className="text-gray-1000">Thoughts</span>
            <span className="font-medium">All posts</span>
          </Link>
        )}
      </nav>
    </main>
  );
}