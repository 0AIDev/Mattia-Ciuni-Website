import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HistoryBackButton } from "@/components/HistoryBackButton";
import { InlineText } from "@/components/RichText";
import TableOfContents, { MobileTableOfContents, type TocItem } from "@/components/TableOfContents";
import { CopyPageLink } from "@/components/CopyPageLink";
import { LOCALES, isLocale, type Locale } from "@/lib/i18n";
import { cmsPage, cmsPageStaticParams, pageLocales } from "@/lib/cms-pages";
import { site } from "@/lib/site";
import { socialImages } from "@/lib/social";
import { languageAlternates } from "@/lib/seo";
import { slugify } from "@/lib/slug";

/**
 * Pagine create dal pannello.
 *
 * Questa route e' `output: export`, quindi `generateStaticParams` e' l'unico modo
 * perche' una pagina esista: senza una voce qui l'URL semplicemente non viene
 * generato. Per questo le pagine sono lette dal filesystem (`content/cms/page`)
 * e non da Supabase: il build deve poter produrre la pagina senza aspettare una
 * rete, e il rollback di un deploy deve funzionare anche con Supabase assente.
 */

type Block = { type?: string; text?: string; items?: string[]; lang?: string; code?: string; src?: string; title?: string };

function blocksOf(page: { content?: unknown }): Block[] {
  return Array.isArray(page.content) ? (page.content as Block[]) : [];
}

function tocOf(page: { content?: unknown }): TocItem[] {
  return blocksOf(page)
    .filter((block) => block.type === "h2" && block.text)
    .map((block) => ({ anchor: slugify(String(block.text)), label: String(block.text) }));
}

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    cmsPageStaticParams().map((entry) => ({ locale, slug: entry.slug })),
  );
}

/**
 * Solo i param elencati esistono.
 *
 * Senza questo, con `output: export` Next scrive comunque un `404.html` per
 * ogni percorso possibile: una pagina dichiarata solo in inglese produceva
 * `it/p/press/index.html` contenente la pagina di errore, e i generatori di card
 * e RAG la indicizzavano come se fosse contenuto reale. Quattro link a una 404
 * in quattro lingue, pubblicati dal pannello.
 */
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const page = cmsPage(slug, raw as Locale);
  if (!page) return {};
  const title = String(page.title || "");
  const description = String(page.description || "");
  // Gli hreflang si dichiarano solo per le lingue in cui la pagina esiste: un
  // annotazione verso una variante inesistente e' un 404 dichiarato come se
  // fosse una traduzione, che e' il modo peggiore di farsi deindicizzare.
  const languages: Record<string, string> = {};
  for (const locale of pageLocales(page)) languages[locale] = `/${locale}/p/${slug}/`;
  languages["x-default"] = `/en/p/${slug}/`;
  return {
    title,
    description,
    robots: page.noindex ? { index: false, follow: true } : undefined,
    alternates: { canonical: `/${raw}/p/${slug}/`, languages },
    openGraph: {
      type: "article",
      url: `/${raw}/p/${slug}/`,
      siteName: site.name,
      title,
      description,
      publishedTime: page.date ? new Date(String(page.date)).toISOString() : undefined,
      modifiedTime: page.updated ? new Date(String(page.updated)).toISOString() : undefined,
      images: socialImages(String(page.ogImage || "/og.png"), title).og,
    },
    twitter: { card: "summary_large_image", title, description, images: socialImages(String(page.ogImage || "/og.png"), title).twitter },
  };
}

function renderBlock(block: Block, index: number) {
  const key = `${block.type}-${index}`;
  if (block.type === "h2") {
    return (
      <h2 id={slugify(String(block.text))} className="mb-4 mt-12 flex scroll-mt-20 items-center gap-3 font-serif text-2xl font-medium leading-tight text-gray-1200">
        <span><InlineText text={String(block.text || "")} /></span>
        <span className="h-px min-w-8 flex-1 bg-gray-300" aria-hidden="true" />
      </h2>
    );
  }
  if (block.type === "h3") {
    return <h3 className="mb-3 mt-8 font-serif text-xl font-medium leading-tight text-gray-1200"><InlineText text={String(block.text || "")} /></h3>;
  }
  if (block.type === "quote") {
    return <blockquote className="m-0 my-8 border-l-2 border-gray-400 pl-4 font-serif text-xl italic leading-snug text-gray-1100"><InlineText text={String(block.text || "")} /></blockquote>;
  }
  if (block.type === "list" && Array.isArray(block.items)) {
    return <ul className="m-0 my-6 list-disc space-y-2 pl-5 text-text-paragraph">{block.items.map((item) => <li key={item}><InlineText text={String(item)} /></li>)}</ul>;
  }
  if (block.type === "code") {
    return <pre className="my-6 overflow-x-auto rounded-2xl bg-gray-100 p-4 text-sm"><code>{String(block.code || "")}</code></pre>;
  }
  if (block.type === "audio" && block.src) {
    return <audio className="mt-4 w-full" controls preload="none" src={String(block.src)} aria-label={String(block.title || "Audio")} />;
  }
  return <p className="m-0 mb-5 text-text-paragraph"><InlineText text={String(block.text || "")} /></p>;
}

export default async function CmsPageRoute({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const page = cmsPage(slug, raw as Locale);
  if (!page) notFound();
  const toc = tocOf(page);
  const blocks = blocksOf(page);
  return (
    <main id="content" className="mx-auto max-w-[692px] px-6 py-12 leading-relaxed sm:py-24">
      <nav aria-label="Breadcrumb" className="mb-16 flex items-center gap-3 text-sm text-gray-1000">
        <HistoryBackButton fallbackLabel="Go back" />
        <span aria-hidden="true">·</span>
        <span aria-current="page">{String(page.title || "")}</span>
      </nav>
      <header className="mb-12">
        <h1 className="font-serif text-4xl font-medium leading-tight text-gray-1200 sm:text-5xl">{String(page.title || "")}</h1>
        {page.description ? <p className="mt-5 max-w-[580px] text-text-paragraph">{String(page.description)}</p> : null}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-gray-1000">
          {page.date ? <time dateTime={String(page.date)}>Published {String(page.date)}</time> : null}
          <CopyPageLink />
        </div>
      </header>
      {toc.length ? <TableOfContents items={toc} /> : null}
      {toc.length ? <MobileTableOfContents items={toc} /> : null}
      <article data-article-content className="mt-10 space-y-1">
        {blocks.map(renderBlock)}
      </article>
    </main>
  );
}
