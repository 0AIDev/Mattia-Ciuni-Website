import Note, { generateMetadata as generateNoteMetadata } from "@/app/notes/[slug]/page";
import { notes } from "@/lib/notes";
import { LOCALES } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => notes.map((note) => ({ locale, slug: note.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  return generateNoteMetadata({ params: Promise.resolve({ slug }) });
}

export default async function LocalizedNote({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  return <Note params={Promise.resolve({ slug })} />;
}
