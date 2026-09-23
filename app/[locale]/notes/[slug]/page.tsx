import Note from "@/app/notes/[slug]/page";
import { getNote, notes } from "@/lib/notes";
import { LOCALES, isLocale } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => notes.map((note) => ({ locale, slug: note.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const note = getNote(slug);
  return note ? { title: note.title, description: note.description, alternates: { canonical: `/${raw}/notes/${slug}/` } } : {};
}

export default async function LocalizedNote({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : "en";
  return <Note params={Promise.resolve({ slug })} fallbackHref={`/${locale}/notes/`} locale={locale} />;
}
