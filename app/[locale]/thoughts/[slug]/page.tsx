import BlogPost, { generateMetadata as generateArticleMetadata } from "@/app/thoughts/[slug]/page";
import { posts } from "@/lib/posts";
import { LOCALES } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => posts.map((post) => ({ locale, slug: post.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  return generateArticleMetadata({ params: Promise.resolve({ slug }) });
}

export default async function LocalizedArticle({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  return <BlogPost params={Promise.resolve({ slug })} />;
}
