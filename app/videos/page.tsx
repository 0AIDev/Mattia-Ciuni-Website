import type { Metadata } from "next";
import Link from "next/link";
import { founderVideos } from "@/lib/videos";

export const metadata: Metadata = {
  title: "Videos",
  description: "Founder videos from Mattia Ciuni on building Payle, working through hard problems and staying close to the work.",
  alternates: { canonical: "/videos/" },
  openGraph: {
    type: "website",
    url: "/videos/",
    title: "Videos · Mattia Ciuni",
    description: "Founder videos from Mattia Ciuni on building Payle.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Mattia Ciuni" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function VideosPage() {
  return (
    <main id="content" className="mx-auto max-w-[692px] px-6 py-12 leading-relaxed sm:py-24">
      <nav aria-label="Breadcrumb" className="mb-16 text-sm text-gray-1000">
        <Link href="/" className="article-underline">Home</Link> <span aria-hidden="true">·</span> <span aria-current="page">Videos</span>
      </nav>
      <header className="mb-16 sm:mb-24">
        <h1 className="font-serif text-4xl font-medium leading-tight text-gray-1200 sm:text-5xl">Videos</h1>
        <p className="mt-5 max-w-[580px] text-text-paragraph">A visual log of the work: founder notes, decisions in progress and the quiet parts of building a company.</p>
      </header>
      {founderVideos.length ? (
        <div className="grid gap-8 sm:grid-cols-2">
          {founderVideos.map((video) => (
            <article key={video.slug}>
              <video className="w-full rounded-xl border border-gray-300" controls preload="none" poster={video.poster} src={video.videoSrc} />
              <h2 className="mt-4 font-serif text-2xl">{video.title}</h2>
              <p className="mt-2 text-text-paragraph">{video.description}</p>
            </article>
          ))}
        </div>
      ) : (
        <section className="border-t border-gray-300 pt-6" aria-label="Videos coming soon">
          <p className="m-0 font-serif text-2xl leading-tight">The camera is waiting.</p>
          <p className="mt-3 max-w-[560px] text-text-paragraph">The first videos will stay close to the work: what I am building, what failed, and what changed my mind.</p>
          <Link href="/thoughts/" className="mt-5 inline-flex article-underline text-sm text-gray-1000">Read the thoughts</Link>
        </section>
      )}
    </main>
  );
}
