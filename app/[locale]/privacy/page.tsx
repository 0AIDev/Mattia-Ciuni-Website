import type { Metadata } from "next";
import { LOCALES, isLocale, type Locale } from "@/lib/i18n";
import { LocalizedSection } from "@/components/LocalizedSection";
import { copy } from "@/lib/i18n";
import { languageAlternates } from "@/lib/seo";

export function generateStaticParams() { return LOCALES.map((locale) => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  return { title: copy[raw].privacy, alternates: { canonical: `/${raw}/privacy/`, languages: languageAlternates("/privacy/") } };
}
export default async function LocalizedPrivacy({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "en";
  return <div lang={locale}><LocalizedSection locale={locale} section="privacy" /></div>;
}
