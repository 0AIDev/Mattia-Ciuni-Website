import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HistoryBackButton } from "@/components/HistoryBackButton";
import { GithubIcon } from "@/components/ui/github";
import { InlineText } from "@/components/RichText";
import SectionCopyLink from "@/components/SectionCopyLink";
import { site } from "@/lib/site";
import {
  feedback,
  feedbackExchange,
  feedbackMinutes,
  getFeedback,
  type FeedbackBlock,
} from "@/lib/feedback";
import { slugify } from "@/lib/slug";
import { socialImages } from "@/lib/social";
import { FeedbackModalButton } from "@/components/FeedbackForm";
import { articleUi } from "@/lib/article-ui";
import type { Locale } from "@/lib/i18n";

/**
 * La pagina di un feedback non è un post del blog, e non deve sembrarlo.
 *
 * Un articolo si apre con la sua copertina e un filetto nero sopra: qui non c'è
 * né l'una né l'altro, perché questo non è un pezzo scritto da Mattia con una
 * sua immagine, è il **verbale di uno scambio**. Perciò:
 *
 *   - prima il credito di chi ha scritto (nome, eventuale GitHub, data, numero
 *     dello scambio), poi il titolo: l'ordine è quello della card in `/feedback/`;
 *   - nessuna copertina: la OG card in pagina mostrerebbe dentro l'articolo la
 *     sua stessa call to action («Read feedback»), cioè una pagina che chiede di
 *     leggere sé stessa;
 *   - nessun indice laterale: uno scambio si legge dall'inizio, e la TOC lo
 *     faceva somigliare a un documento;
 *   - colonna più stretta (652px invece di 692px) e spazi diversi: si vede prima
 *     del testo che si è in un'altra sezione.
 *
 * Il resto è la stessa grammatica del sito: serif per i titoli, corpo a 15-16px,
 * il virgolettato del contributo con la barra a sinistra.
 */

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
  fallbackHref = "/",
  locale = "en",
}: {
  params: Promise<{ slug: string }>;
  fallbackHref?: string;
  locale?: Locale;
}) {
  const { slug } = await params;
  const post = getFeedback(slug);
  if (!post) notFound();
  const ui = articleUi[locale];
  const prefix = locale === "en" ? "" : `/${locale}`;

  const base = site.url.replace(/\/$/, "");
  const url = `${base}/feedback/${post.slug}/`;
  const exchange = feedbackExchange(post.slug);
  const readTime = feedbackMinutes(post);

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
    // Il contributo è citato come tale: la pagina è di Mattia, il feedback è di
    // chi l'ha scritto, e questo è il posto in cui dirlo a una macchina.
    contributor: {
      "@type": "Person",
      name: post.author,
      ...(post.github ? { url: post.github } : {}),
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: ui.home, item: base + `${prefix}/` },
      { "@type": "ListItem", position: 2, name: ui.feedback, item: base + `${prefix}/feedback/` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <main
      id="content"
      className="mx-auto max-w-[652px] px-6 py-12 leading-relaxed sm:py-24"
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
              href={`${prefix}/feedback/`}
              className="transition-colors hover:text-gray-1200"
            >
              {ui.feedback}
            </Link>
          </li>
          <li aria-hidden="true">·</li>
          <li aria-current="page" className="truncate text-gray-1200">
            {post.title}
          </li>
        </ol>
      </nav>

      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <HistoryBackButton fallbackHref={fallbackHref} fallbackLabel={ui.back} />
          <Link href={`${prefix}/feedback/`} className="text-sm text-gray-1000">
            {ui.feedback}
          </Link>
        </div>
        <span className="text-sm text-gray-1000">
          {ui.exchange} {exchange} · {readTime}
        </span>
      </header>

      {/* Niente filetto nero in cima e niente copertina: il primo blocco è il
          credito di chi ha scritto, come nella card dell'elenco. */}
      <article>
        <div data-article-content>
          {/* The credit is a small metadata row, not a paragraph: every item
              shares one center line, while the flex wrap keeps the author,
              handle and date readable on narrow screens. */}
          <div className="rounded-2xl border border-gray-300 px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm leading-5">
              <span className="font-medium text-gray-1200">{post.author}</span>
              {post.github ? (
                <a
                  href={post.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${post.author} on GitHub`}
                  className="inline-flex items-center gap-1.5 text-gray-1000 transition-colors hover:text-gray-1200"
                >
                  <GithubIcon size={14} className="shrink-0" />
                  <span className="text-xs leading-5">
                    {post.github.replace("https://github.com/", "")}
                  </span>
                </a>
              ) : null}
              <span aria-hidden="true" className="text-gray-1000">·</span>
              <time dateTime={post.date} className="text-gray-1000">{post.date}</time>
            </div>
          </div>

          <h1 className="mt-7 mb-6 scroll-mt-20 font-serif text-3xl font-medium leading-tight text-gray-1200 sm:text-4xl">
            {post.title}
          </h1>
          <div className="flex flex-col">
            {post.content.map((b, i) => (
              <RenderBlock key={i} block={b} />
            ))}
          </div>
        </div>
      </article>

      <section aria-labelledby="send-feedback" className="mt-16 border-t border-gray-300 pt-8">
        <h2 id="send-feedback" className="mb-3 font-serif text-xl font-medium">
          {ui.sendFeedback}
        </h2>
        <p className="m-0 max-w-[600px] text-text-paragraph">{ui.feedbackPrompt}</p>
        <div className="mt-6">
          <FeedbackModalButton variant="outline" label={ui.sendFeedback} locale={locale} />
        </div>
        <p className="mt-4 text-sm text-gray-1000">
          {ui.feedbackReviewed}
        </p>
      </section>

      <nav aria-label={ui.allFeedback} className="mt-8 border-t border-gray-300">
        <Link
          href={`${prefix}/feedback/`}
          className="group flex items-baseline justify-between py-3.5"
        >
          <span className="text-gray-1000">{ui.feedback}</span>
          <span className="font-medium">{ui.allFeedback}</span>
        </Link>
      </nav>
    </main>
  );
}
