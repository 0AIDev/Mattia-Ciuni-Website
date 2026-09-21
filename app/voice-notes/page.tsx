import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeftIcon } from "@/components/ui/arrow-up-left";
import { AudioPlayer } from "@/components/MediaPlayers";
import { voiceNotes } from "@/lib/voice-notes";
import { site } from "@/lib/site";
import { socialImages } from "@/lib/social";

const pageTitle = "Voice Notes | Mattia Ciuni | Spoken, unedited";
// Stesso helper delle altre pagine: mancava il `type`, quindi niente
// `og:image:type` nell'HTML e la card risultava incompleta a `check-live.mjs`.
const card = socialImages("/og.png", "Voice Notes | Mattia Ciuni");

export const metadata: Metadata = {
  title: "Voice Notes | Spoken, unedited",
  description: "Unedited spoken notes from Mattia Ciuni on building Payle, work and the questions between decisions.",
  authors: [{ name: "Mattia Ciuni", url: site.url }],
  alternates: { canonical: "/voice-notes/" },
  openGraph: {
    type: "website",
    url: "/voice-notes/",
    siteName: "Mattia Ciuni",
    title: pageTitle,
    description: "Unedited spoken notes from Mattia Ciuni on building Payle.",
    images: card.og,
  },
  twitter: { card: "summary_large_image", title: pageTitle, description: "Unedited spoken notes from Mattia Ciuni on building Payle.", images: card.twitter },
};

export default function VoiceNotesPage() {
  return (
    <main id="content" className="mx-auto max-w-[692px] px-6 py-12 leading-relaxed sm:py-24">
      <nav aria-label="Breadcrumb" className="mb-16 flex items-center gap-3 text-sm text-gray-1000">
        <Link href="/" aria-label="Go back home" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-300">
          <ArrowUpLeftIcon size={16} />
        </Link>
        <span aria-hidden="true">·</span>
        <span aria-current="page">Voice Notes</span>
      </nav>
      <header className="mb-16 sm:mb-24">
        <h1 className="font-serif text-4xl font-medium leading-tight text-gray-1200 sm:text-5xl">Voice Notes</h1>
        <p className="mt-5 max-w-[580px] text-text-paragraph">Some thoughts arrive before the sentence does. This is where I will leave them in my own voice, between a decision and the work that follows.</p>
      </header>
      {voiceNotes.length ? (
        <ol className="m-0 list-none divide-y divide-gray-300 p-0">
          {voiceNotes.map((note) => (
            <li key={note.slug} className="py-5">
              <h2 className="font-serif text-2xl">{note.title}</h2>
              <p className="mt-2 text-text-paragraph">{note.description}</p>
              <div className="mt-4">
                <AudioPlayer src={note.audioSrc} title={note.title} />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <section className="border-t border-gray-300 pt-6" aria-label="Voice notes coming soon">
          <p className="m-0 font-serif text-2xl leading-tight">The microphone is on its way.</p>
          <p className="mt-3 max-w-[560px] text-text-paragraph">The first recording will be a thought I did not want to flatten into text. Until then, the written notes are here.</p>
          <Link href="/notes/" className="mt-5 inline-flex article-underline text-sm text-gray-1000">Read the notes</Link>
        </section>
      )}
    </main>
  );
}
