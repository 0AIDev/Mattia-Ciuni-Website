import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedHome } from "@/app/[locale]/[slug]/page";
import { copy, LOCALES, isLocale } from "@/lib/i18n";
import { socialImages } from "@/lib/social";
import { languageAlternates } from "@/lib/seo";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  // Il brand lo aggiunge il template del layout: scriverlo qui lo faceva
  // comparire due volte ("... | Mattia Ciuni | Mattia Ciuni").
  const title = copy[locale].homeTitle;
  const serpTitle = `${title} | Mattia Ciuni`;
  // La description è la riga di SERP, non il corpo della pagina: `homeBody` è
  // lungo 226-253 caratteri e Google lo tagliava a metà frase. Qui si compone
  // dalle due stringhe già tradotte (la riga del founder e la prima frase del
  // corpo), quindi non nasce copy nuovo e resta sotto i 155 caratteri in tutte
  // e cinque le lingue.
  const description = `${copy[locale].founder} ${copy[locale].homeBody.split(/(?<=\.)\s/)[0]}`;
  return {
    title,
    description,
    alternates: { canonical: `/${locale}/`, languages: languageAlternates("/") },
    openGraph: {
      type: "website",
      url: `/${locale}/`,
      siteName: "Mattia Ciuni",
      title: serpTitle,
      description,
      images: socialImages("/og.png", serpTitle).og,
    },
  };
}

export default async function LocalizedHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  return <div lang={raw}><main id="content" className="mx-auto w-full min-w-0 max-w-[692px] overflow-hidden px-5 py-10 leading-relaxed sm:px-6 sm:py-24"><LocalizedHome locale={raw} /></main></div>;
}
