import type { Metadata } from "next";
import { CareersPage } from "@/app/careers/page";
import { LOCALES, isLocale, type Locale } from "@/lib/i18n";
import { careersUi } from "@/lib/careers/ui";
import { socialImages } from "@/lib/social";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const title = `${careersUi[locale].careers} — Payle`;
  const description = `${careersUi[locale].careers}. ${careersUi[locale].sundayLog}`;
  const card = socialImages("/careers/og.png", title);
  return { title, description, alternates: { canonical: `/${locale}/careers/` }, openGraph: { type: "website", url: `/${locale}/careers/`, siteName: "Mattia Ciuni", title, description, images: card.og }, twitter: { card: "summary_large_image", title, description, images: card.twitter } };
}

export default async function LocalizedCareersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return null;
  return <CareersPage locale={raw as Locale} basePath={`/${raw}/careers`} />;
}
