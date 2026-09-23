import type { Metadata } from "next";
import CareerDetailPage, { generateStaticParams as generateCareerParams } from "@/app/careers/[slug]/page";
import { LOCALES, isLocale, type Locale } from "@/lib/i18n";
import { getJob } from "@/lib/careers/jobs";
import { socialImages } from "@/lib/social";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => generateCareerParams().map(({ slug }) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const job = getJob(slug);
  if (!job) return {};
  const jobTitle = job.title;
  const description = job.shortPitch;
  const card = socialImages(`/careers/${slug}/og.png`, jobTitle);
  return { title: jobTitle, description, alternates: { canonical: `/${raw}/careers/${slug}/` }, openGraph: { type: "website", url: `/${raw}/careers/${slug}/`, siteName: "Mattia Ciuni", title: jobTitle, description, images: card.og }, twitter: { card: "summary_large_image", title: jobTitle, description, images: card.twitter } };
}

export default async function LocalizedCareerDetail({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "en";
  return <CareerDetailPage params={Promise.resolve({ slug })} locale={locale} basePath={`/${locale}/careers`} />;
}
