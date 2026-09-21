import type { Metadata } from "next";
import Link from "next/link";
import { founderVideos } from "@/lib/videos";
import { VideoPlayer } from "@/components/MediaPlayers";
import { site } from "@/lib/site";

const pageTitle = "Videos | Mattia Ciuni | Building Payle in public";
const pageDescription =
  "Founder videos from Mattia Ciuni on building Payle, working through hard problems and staying close to the work.";

export const metadata: Metadata = {
  title: "Videos | Building Payle in public",
  description: pageDescription,
  keywords: [
    "Mattia Ciuni videos",
    "founder videos",
    "building Payle",
    "AI agents",
    "startup founder",
  ],
  authors: [{ name: "Mattia Ciuni", url: site.url }],
  alternates: {
    canonical: "/videos/",
    types: { "text/markdown": "/videos.md" },
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/videos/",
    siteName: "Mattia Ciuni",
    title: pageTitle,
    description: pageDescription,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Mattia Ciuni" }],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: ["/og.png"],
  },
};

function absoluteAsset(value: string) {
  return value.startsWith("http") ? value : `${site.url}${value.startsWith("/") ? value : `/${value}`}`;
}

function VideoStructuredData() {
  const videos = founderVideos.map((video) => ({
    "@type": "VideoObject",
    name: video.title,
    description: video.description,
    thumbnailUrl: absoluteAsset(video.poster ?? "/og.png"),
    uploadDate: video.date,
    contentUrl: absoluteAsset(video.videoSrc),
    ...(video.duration ? { duration: video.duration } : {}),
  }));

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${site.url}/videos/#webpage`,
        url: `${site.url}/videos/`,
        name: pageTitle,
        description: pageDescription,
        isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
        about: { "@type": "Person", name: "Mattia Ciuni", url: site.url },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: founderVideos.map((video, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: video.title,
            url: `${site.url}/videos/#${video.slug}`,
          })),
        },
      },
      ...videos,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
    />
  );
}

export default function VideosPage() {
  return (
    <main id="content" className="mx-auto max-w-[692px] px-6 py-12 leading-relaxed sm:py-24">
      <VideoStructuredData />
      <nav aria-label="Breadcrumb" className="mb-16 text-sm text-gray-1000">
        <Link href="/" className="article-underline">Home</Link> <span aria-hidden="true">·</span> <span aria-current="page">Videos</span>
      </nav>
      <header className="mb-16 sm:mb-24">
        <p className="mb-3 text-sm text-gray-1000">Founder log</p>
        <h1 className="font-serif text-4xl font-medium leading-tight text-gray-1200 sm:text-5xl">Videos</h1>
        <p className="mt-5 max-w-[580px] text-text-paragraph">{pageDescription}</p>
      </header>
      {founderVideos.length ? (
        <div className="space-y-12">
          {founderVideos.map((video) => (
            <article key={video.slug} id={video.slug}>
              <VideoPlayer src={video.videoSrc} poster={video.poster} title={video.title} />
              <h2 className="mt-4 font-serif text-2xl">{video.title}</h2>
              <p className="mt-2 text-text-paragraph">{video.description}</p>
              <time dateTime={video.date} className="mt-2 block text-sm text-gray-1000">{video.date}</time>
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
