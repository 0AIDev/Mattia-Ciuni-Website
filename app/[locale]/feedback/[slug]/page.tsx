import FeedbackPost from "@/app/feedback/[slug]/page";
import { getFeedback, feedback } from "@/lib/feedback";
import { LOCALES, isLocale } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => feedback.map((item) => ({ locale, slug: item.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const item = getFeedback(slug);
  return item ? { title: item.title, description: item.description, alternates: { canonical: `/${raw}/feedback/${slug}/` } } : {};
}

export default async function LocalizedFeedback({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : "en";
  return <FeedbackPost params={Promise.resolve({ slug })} fallbackHref={`/${locale}/feedback/`} locale={locale} />;
}
