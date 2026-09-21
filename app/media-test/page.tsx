import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeftIcon } from "@/components/ui/arrow-up-left";

export const metadata: Metadata = {
  title: "Media test",
  robots: { index: false, follow: false },
};

const sampleVoiceNotes = [
  {
    title: "The thought before the decision",
    date: "2026-09-21",
    duration: "04:18",
  },
  {
    title: "What changed this week",
    date: "2026-09-18",
    duration: "07:42",
  },
];

const sampleVideos = [
  {
    title: "Building the money layer",
    date: "2026-09-21",
    duration: "08:24",
  },
  {
    title: "A founder's desk, in progress",
    date: "2026-09-16",
    duration: "12:06",
  },
];

export default function MediaTestPage() {
  return (
    <main id="content" className="mx-auto max-w-[692px] px-6 py-12 leading-relaxed sm:py-24">
      <nav aria-label="Breadcrumb" className="mb-16 flex items-center gap-3 text-sm text-gray-1000">
        <Link href="/" aria-label="Go back home" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-300">
          <ArrowUpLeftIcon size={16} />
        </Link>
        <span aria-hidden="true">·</span>
        <span aria-current="page">Media test</span>
      </nav>

      <header className="mb-16 sm:mb-24">
        <p className="mb-3 text-sm text-gray-1000">Temporary design board</p>
        <h1 className="font-serif text-4xl font-medium leading-tight text-gray-1200 sm:text-5xl">
          Voice and video
        </h1>
        <p className="mt-5 max-w-[580px] text-text-paragraph">
          This page is only here to choose the visual language. The real pages and registries stay in place underneath it.
        </p>
      </header>

      <section aria-labelledby="voice-test" className="mb-20">
        <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-gray-300 pb-3">
          <h2 id="voice-test" className="font-serif text-2xl font-medium">Voice Notes</h2>
          <span className="text-xs text-gray-1000">audio template</span>
        </div>
        <div className="space-y-5">
          {sampleVoiceNotes.map((note) => (
            <article key={note.title} className="border-t border-gray-300 pt-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl leading-tight">{note.title}</h3>
                  <p className="mt-1 text-xs text-gray-1000">{note.date} · {note.duration}</p>
                </div>
                <span aria-hidden="true" className="text-gray-1000">◉</span>
              </div>
              <audio controls preload="none" className="mt-4 h-10 w-full" aria-label={`Play ${note.title}`} />
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="video-test">
        <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-gray-300 pb-3">
          <h2 id="video-test" className="font-serif text-2xl font-medium">Videos</h2>
          <span className="text-xs text-gray-1000">video template</span>
        </div>
        <div className="space-y-12">
          {sampleVideos.map((video) => (
            <article key={video.title}>
              <div className="relative aspect-video overflow-hidden rounded-xl border border-gray-300 bg-gray-200">
                <video controls preload="none" className="h-full w-full" poster="/og.png" aria-label={video.title} />
              </div>
              <h3 className="mt-4 font-serif text-xl leading-tight">{video.title}</h3>
              <p className="mt-1 text-xs text-gray-1000">{video.date} · {video.duration}</p>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-20 border-t border-gray-300 pt-5 text-sm text-gray-1000">
        Temporary page. Send the preferred direction, then this route can be removed without touching the production templates.
      </p>
    </main>
  );
}
