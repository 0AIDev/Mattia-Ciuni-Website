import type { Metadata } from "next";
import CareerDetailPage, { generateStaticParams as generateCareerParams } from "@/app/careers/[slug]/page";
import { LOCALES, isLocale, type Locale } from "@/lib/i18n";
import { careersUi } from "@/lib/careers/ui";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => generateCareerParams().map(({ slug }) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  return { title: `${careersUi[raw].careers}: ${slug}`, alternates: { canonical: `/${raw}/careers/${slug}/` } };
}

export default async function LocalizedCareerDetail({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "en";
  return <CareerDetailPage params={Promise.resolve({ slug })} locale={locale} basePath={`/${locale}/careers`} />;
}
