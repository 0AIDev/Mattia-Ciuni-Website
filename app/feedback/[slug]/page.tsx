import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpLeftIcon } from "@/components/ui/arrow-up-left";
import { CoverImage } from "@/components/CoverImage";
import { InlineText } from "@/components/RichText";
import SectionCopyLink from "@/components/SectionCopyLink";
import TableOfContents, {
  MobileTableOfContents,
  type TocItem,
} from "@/components/TableOfContents";
import { site } from "@/lib/site";
import { feedback, getFeedback, type FeedbackBlock } from "@/lib/feedback";
import { slugify } from "@/lib/slug";
import { socialImages } from "@/lib/social";

export function generateStaticParams() {
  return feedback.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getFeedback(slug);
  if (!post) return {};
  const url = `/feedback/${post.slug}/`;
  const card = socialImages(`/feedback/${post.slug}/og.png`, post.title);
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: "Mattia Ciuni", url: site.url }],
    alternates: {
      canonical: url,
      types: { "text/markdown": `/feedback/${post.slug}.md` },
    },
    openGraph: {
      type: "article",
      url,
      siteName: "Mattia Ciuni",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      authors: ["Mattia Ciuni"],
      tags: post.keywords.slice(0, 3),
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

function RenderBlock({ block }: { block: FeedbackBlock }) {
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
  if (block.type === "quote")
    return (
      <blockquote className="my-6 border-l-2 border-gray-1200 pl-5 font-serif text-lg italic leading-relaxed text-gray-1200">
        <InlineText text={block.text} />
      </blockquote>
    );
  if (block.type === "list")
    return (
      <ul className="my-6 list-disc space-y-3 pl-5 text-text-paragraph">
        {block.items.map((item, i) => (
          <li key={i}>
            <InlineText text={item} />
          </li>
        ))}
      </ul>
    );
  return (
    <p className="w-full text-text-paragraph">
      <InlineText text={block.text} />
    </p>
  );
}

export default async function FeedbackPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getFeedback(slug);
  if (!post) notFound();

  const base = site.url.replace(/\/$/, "");
  const url = `${base}/feedback/${post.slug}/`;

  const toc: TocItem[] = post.content.flatMap((block) =>
    block.type === "h2" ? [{ anchor: slugify(block.text), label: block.text }] : [],
  );

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Person", name: "Mattia Ciuni", url: site.url },
    publisher: { "@type": "Person", name: "Mattia Ciuni", url: site.url },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: `${base}/feedback/${post.slug}/og.png`,
    keywords: post.keywords.join(", "),
    inLanguage: "en",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base + "/" },
      { "@type": "ListItem", position: 2, name: "Feedback", item: base + "/feedback/" },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
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
              href="/feedback/"
              className="transition-colors hover:text-gray-1200"
            >
              Feedback
            </Link>
          </li>
          <li aria-hidden="true">·</li>
          <li aria-current="page" className="truncate text-gray-1200">
            {post.title}
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
          <Link href="/feedback/" className="text-sm text-gray-1000">
            Feedback
          </Link>
        </div>
        <span className="text-sm text-gray-1000">
          <time dateTime={post.date}>{post.date}</time>
        </span>
      </header>

      <article className="border-t-2 border-gray-1200 pt-10">
        {toc.length > 0 ? <TableOfContents items={toc} /> : null}
        <MobileTableOfContents items={toc} />
        <div data-article-content>
          <CoverImage src={`/feedback/${post.slug}/cover.png`} />
          <p className="mb-3 text-[13px] uppercase tracking-wide text-gray-1000">
            Feedback series · {post.author}
          </p>
          <h1
            className="mb-5 scroll-mt-20 font-serif text-3xl font-medium leading-tight text-gray-1200 sm:text-4xl"
          >
            {post.title}
          </h1>
          <div className="flex flex-col">
            {post.content.map((b, i) => (
              <RenderBlock key={i} block={b} />
            ))}
          </div>
        </div>
      </article>

      <section aria-labelledby="send-feedback" className="mt-16 border-t border-gray-300">
        <h2 id="send-feedback" className="mb-3 font-serif text-xl font-medium">
          Send your feedback
        </h2>
        <p className="m-0 max-w-[600px] text-text-paragraph">
          Every submission is read and reviewed. If it holds up, it gets
          published here, with your name or just an initial, your choice. The
          next Feedback post might be about your comment.
        </p>
        <a
          href={`mailto:${site.email}?subject=Feedback%20on%20Payle`}
          className="mt-4 inline-flex items-center rounded-full bg-gray-1200 px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
        >
          Email your feedback
        </a>
      </section>

      <nav aria-label="All feedback" className="mt-8 border-t border-gray-300">
        <Link
          href="/feedback/"
          className="group flex items-baseline justify-between py-3.5"
        >
          <span className="text-gray-1000">Feedback</span>
          <span className="font-medium">All feedback</span>
        </Link>
      </nav>
    </main>
  );
}
