import BlogPost from "@/app/thoughts/[slug]/page";
import { getPost, posts } from "@/lib/posts";
import { LOCALES, isLocale } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => posts.map((post) => ({ locale, slug: post.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const post = getPost(slug);
  return post ? { title: post.title, description: post.description, alternates: { canonical: `/${raw}/thoughts/${slug}/` } } : {};
}

export default async function LocalizedArticle({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : "en";
  return <BlogPost params={Promise.resolve({ slug })} fallbackHref={`/${locale}/thoughts/`} locale={locale} />;
}
