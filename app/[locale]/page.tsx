import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedHome } from "@/app/[locale]/[slug]/page";
import { copy, LOCALES, isLocale } from "@/lib/i18n";
import { socialImages } from "@/lib/social";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const title = `Mattia Ciuni | ${copy[locale].founder}`;
  return {
    title,
    description: copy[locale].homeBody,
    alternates: { canonical: `/${locale}/` },
    openGraph: {
      type: "website",
      url: `/${locale}/`,
      siteName: "Mattia Ciuni",
      title,
      description: copy[locale].homeBody,
      images: socialImages("/og.png", title).og,
    },
  };
}

export default async function LocalizedHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  return <main id="content" className="mx-auto w-full min-w-0 max-w-[692px] overflow-hidden px-5 py-10 leading-relaxed sm:px-6 sm:py-24"><LocalizedHome locale={raw} /></main>;
}
