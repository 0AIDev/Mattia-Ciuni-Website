import FeedbackPost, { generateMetadata as generateFeedbackMetadata } from "@/app/feedback/[slug]/page";
import { feedback } from "@/lib/feedback";
import { LOCALES } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => feedback.map((item) => ({ locale, slug: item.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  return generateFeedbackMetadata({ params: Promise.resolve({ slug }) });
}

export default async function LocalizedFeedback({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  return <FeedbackPost params={Promise.resolve({ slug })} />;
}
