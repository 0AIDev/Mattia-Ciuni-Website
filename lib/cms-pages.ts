import { loadCmsCollection } from "./cms-content";
import { LOCALES, type Locale } from "./i18n";

/**
 * Pagine pubblicate dal pannello.
 *
 * Una pagina e' un JSON in `content/cms/page/<slug>.json` con lo stesso modello
 * degli altri contenuti piu' un campo `locales`. Il campo e' una lista esplicita
 * di lingue, non un flag "tradotto": una pagina senza `locales` esiste solo in
 * inglese, e questo e' un default onesto perche' una versione Francese scritta
 * male fa piu' danno di una versione assente. Il pannello mostra quindi quante
 * lingue mancano invece di pubblicarle in silenzio.
 */
export type CmsPage = {
  slug: string;
  title: string;
  description?: string;
  date?: string;
  updated?: string;
  locales?: string[];
  noindex?: boolean;
  inSitemap?: boolean;
  content?: unknown[];
  [key: string]: unknown;
};

function normalizeLocales(value: unknown): Locale[] {
  if (!Array.isArray(value)) return ["en"];
  const wanted = value.filter((entry): entry is Locale => typeof entry === "string" && (LOCALES as readonly string[]).includes(entry));
  return wanted.length ? [...new Set(wanted)] : ["en"];
}

const rawPages = loadCmsCollection<CmsPage>("page");

export const cmsPages: CmsPage[] = rawPages
  .filter((page) => typeof page?.slug === "string" && Array.isArray(page.content))
  .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

export function pageLocales(page: CmsPage): Locale[] {
  return normalizeLocales(page.locales);
}

export function cmsPage(slug: string, locale: Locale): CmsPage | null {
  const page = cmsPages.find((entry) => entry.slug === slug);
  if (!page) return null;
  return pageLocales(page).includes(locale) ? page : null;
}

/** Le lingue in cui la pagina esiste davvero, per `generateStaticParams`. */
export function cmsPageStaticParams(): Array<{ locale: Locale; slug: string }> {
  return cmsPages.flatMap((page) => pageLocales(page).map((locale) => ({ locale, slug: page.slug })));
}

export function cmsPageSlugs(): string[] {
  return cmsPages.map((page) => page.slug);
}
