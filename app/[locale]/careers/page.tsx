import type { Metadata } from "next";
import { CareersPage } from "@/app/careers/page";
import { LOCALES, isLocale, type Locale } from "@/lib/i18n";
import { careersUi } from "@/lib/careers/ui";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: `${careersUi[locale].careers} — Payle`,
    description: `${careersUi[locale].careers}. ${careersUi[locale].sundayLog}`,
    alternates: { canonical: `/${locale}/careers/` },
  };
}

export default async function LocalizedCareersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return null;
  return <CareersPage locale={raw as Locale} basePath={`/${raw}/careers`} />;
}
