import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import CopyEmail from "@/components/CopyEmail";
import MilanClock from "@/components/MilanClock";
import NowSection from "@/components/NowSection";
import { ChevronRight } from "@/components/icons";
import { GithubIcon } from "@/components/ui/github";
import { LinkedinIcon } from "@/components/ui/linkedin";
import { CrunchbaseIcon } from "@/components/ui/crunchbase";
import { InstagramIcon } from "@/components/ui/instagram";
import { TwitterIcon } from "@/components/ui/twitter";
import { site } from "@/lib/site";
import { posts } from "@/lib/posts";

export const metadata: Metadata = {
  // La card markdown della pagina si annuncia nella <head>, non solo nel piè di
  // pagina: chi legge la testata (un crawler) non esegue la pagina.
  alternates: { canonical: "/", types: { "text/markdown": "/index.md" } },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Mattia Ciuni",
  jobTitle: "Founder & CEO",
  worksFor: { "@type": "Organization", name: "Payle", url: site.payleUrl },
  url: site.url,
  sameAs: [site.social.github, site.social.linkedin, site.social.x, site.social.instagram, site.social.crunchbase],
  email: `mailto:${site.email}`,
  description: "Founder & CEO of Payle, the money layer for AI agents",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Milan",
    addressCountry: "IT",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Mattia Ciuni",
  url: site.url,
};

export default function Home() {
  return (
    <main
      id="content"
      className="mx-auto max-w-[692px] px-6 py-12 leading-relaxed sm:py-24"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <header className="mb-16 flex items-center gap-4 sm:mb-24">
        {/* 80×80 nel file (WebP, ~2KB) per i 40px a cui è mostrato: `next/image`
            è `unoptimized` (static export), quindi la dimensione giusta la Decide
            il file, e la fa `scripts/gen-avatar.mjs`. */}
        <Image
          src="/mattia.webp"
          alt=""
          width={80}
          height={80}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
        <h1 className="m-0 font-serif text-lg font-semibold">Mattia Ciuni</h1>
        <p className="m-0 text-gray-1000">Founder & CEO @ Payle</p>
      </header>

      <div className="mb-16 space-y-6 text-text-paragraph sm:mb-24">
        <MilanClock className="text-gray-1000" />

        <p className="m-0">
          I&apos;m building the money layer for AI agents at{" "}
          <a href={site.payleUrl} rel="noopener noreferrer" className="article-underline">
            Payle
          </a>
          . AI agents can already research, compare and execute entire tasks.
          Then they stop and ask you for a credit card. Payle gives each agent a{" "}
          <em className="font-serif italic">wallet with rules</em>: per-agent
          budgets, merchant allowlists, a deterministic authorization engine, and a
          verifiable receipt for every transaction.
        </p>
        <p className="m-0">
          Before this I built <em className="font-serif italic">Celeste</em>, an
          AI browser, and watched users finish the hard part of a task, then
          abandon it at the payment step. That observation became Payle. We&apos;re
          applying to YC and relocating to San Francisco.
        </p>
        <p className="m-0">
          I ship code under strict acceptance tests and hire on artifacts, not
          titles. Reach me at <CopyEmail /> or on{" "}
          <a
            href={site.social.x}
            rel="me noopener"
            className="article-underline inline-flex items-center gap-1.5"
          >
            <TwitterIcon size={15} className="inline-flex shrink-0" />
            @mattiaciuni
          </a>
          ,{" "}
          <a
            href={site.social.github}
            rel="me noopener"
            className="article-underline inline-flex items-center gap-1.5"
          >
            <GithubIcon size={15} className="inline-flex shrink-0" />
            GitHub
          </a>{" "}
          and{" "}
          <a
            href={site.social.linkedin}
            rel="me noopener"
            className="article-underline inline-flex items-center gap-1.5"
          >
            <LinkedinIcon size={15} className="inline-flex shrink-0" />
            LinkedIn
          </a>
          ,{" "}
          <a
            href={site.social.instagram}
            rel="noopener noreferrer"
            className="article-underline inline-flex items-center gap-1.5"
          >
            <InstagramIcon size={15} className="inline-flex shrink-0" />
            Instagram
          </a>{" "}
          and{" "}
          <a
            href={site.social.crunchbase}
            rel="noopener noreferrer"
            className="article-underline inline-flex items-center gap-1.5"
          >
            <CrunchbaseIcon size={15} className="inline-flex shrink-0" />
            Crunchbase
          </a>
          .
        </p>
      </div>

      <section aria-labelledby="principles" className="mb-16 sm:mb-24">
        <h2 id="principles" className="mb-4 font-serif font-medium">Principles</h2>
        <ul className="m-0 list-disc space-y-5 pl-5">
          <li>
            <p className="m-0 font-serif italic">Build the hard part first.</p>
            <p className="m-0 text-gray-1000">
              Everyone ships the demo; the money path is where products die. I
              start where the risk lives.
            </p>
          </li>
          <li>
            <p className="m-0 font-serif italic">Verification over vibes.</p>
            <p className="m-0 text-gray-1000">
              If a claim can&apos;t survive an audit, a test, or a skeptical
              engineer, it doesn&apos;t go on the internet. Including this site.
            </p>
          </li>
          <li>
            <p className="m-0 font-serif italic">Small teams, heavy leverage.</p>
            <p className="m-0 text-gray-1000">
              AI tools multiplied my output; discipline multiplied the AI. Two
              people with tests beat ten with meetings.
            </p>
          </li>
          <li>
            <p className="m-0 font-serif italic">The best ideas survive attack.</p>
            <p className="m-0 text-gray-1000">
              I post my architecture before I have a pitch. What survives the
              comments is what gets built.
            </p>
          </li>
        </ul>
      </section>

      <NowSection />

      <section aria-labelledby="projects" className="mb-16 sm:mb-24">
        <h2 id="projects" className="mb-2 font-serif font-medium">Projects</h2>
        <ul className="m-0 list-none divide-y divide-gray-300 p-0">
          <li>
            <a
              href={site.payleUrl}
              rel="noopener noreferrer"
              className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-4 py-3.5"
            >
              <span className="font-medium">Payle</span>
              <span className="text-gray-1000">The money layer for AI agents.</span>
              <ChevronRight className="h-4 w-4 self-center text-gray-1000 transition-transform group-hover:translate-x-1" />
            </a>
          </li>
          <li>
            <Link
              href="/thoughts/"
              className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-4 py-3.5"
            >
              <span className="font-medium">Thoughts</span>
              <span className="text-gray-1000">
                Notes on AI agents and building Payle.
              </span>
              <ChevronRight className="h-4 w-4 self-center text-gray-1000 transition-transform group-hover:translate-x-1" />
            </Link>
          </li>
        </ul>
      </section>

      <section aria-labelledby="thoughts" className="mb-16 sm:mb-24">
        <h2 id="thoughts" className="mb-2 font-serif font-medium">Thoughts</h2>
        <ul className="m-0 list-none divide-y divide-gray-300 p-0">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/thoughts/${p.slug}/`}
                className="group flex items-baseline justify-between gap-4 py-3.5"
              >
                <span className="font-serif font-[450]">{p.title}</span>
                <span className="flex items-center gap-2 whitespace-nowrap text-gray-1000">
                  {p.category}
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}