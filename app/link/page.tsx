import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { socialImages } from "@/lib/social";
import { languageAlternates } from "@/lib/seo";
import { ChevronRight } from "@/components/icons";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";
import { CrunchbaseIcon } from "@/components/ui/crunchbase";
import { GithubIcon } from "@/components/ui/github";
import { GlobeIcon } from "@/components/ui/globe";
import { InstagramIcon } from "@/components/ui/instagram";
import { LinkIcon } from "@/components/ui/link";
import { NewsletterSection } from "@/components/NewsletterSection";
import { SpotifyIcon, YoutubeIcon } from "@/components/ui/static-icons";
import { LinkedinIcon } from "@/components/ui/linkedin";
import { MailCheckIcon } from "@/components/ui/mail-check";
import { TwitterIcon } from "@/components/ui/twitter";

// Una pagina per i link in bio: la si apre da un telefono, dopo un profilo
// social, quindi sta da sola, non ha breadcrumb e non ha un indice da leggere.
// Il contenuto è corto e lo è apposta: profilo, icone dei profili, e i pochi
// posti che valgono un tocco.
const description =
  "Everywhere Mattia Ciuni is: Payle, LinkedIn, X, GitHub, Instagram, YouTube, the Spotify podcast, Crunchbase, and the writing published on this site.";
const card = socialImages("/og.png", "Mattia Ciuni | Founder & CEO at Payle");

export const metadata: Metadata = {
  title: "Links",
  description,
  alternates: { canonical: "/link/", languages: languageAlternates("/link/") },
  openGraph: {
    type: "profile",
    url: "/link/",
    siteName: "Mattia Ciuni",
    title: "Links | Mattia Ciuni",
    description,
    images: card.og,
  },
  twitter: {
    card: "summary_large_image",
    title: "Links | Mattia Ciuni",
    description,
    images: card.twitter,
  },
};

const personId = `${site.url.replace(/\/$/, "")}/#mattia-ciuni`;
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": personId,
  name: "Mattia Ciuni",
  jobTitle: "Founder & CEO of Payle",
  url: site.url,
  sameAs: Object.values(site.social),
  email: `mailto:${site.email}`,
};

// I profili esterni, con l'icona del sito e il colore del marchio: qui, diverso
// dal resto del sito, l'icona deve essere riconoscibile a colpo d'occhio, perché
// è l'unica cosa su cui si punta il pollice. `rel="me"` dice agli agenti e ai
// motori che quel profilo è la stessa persona, non un link qualsiasi.
const profiles = [
  { label: "LinkedIn", note: "in/mattiaciuni", href: site.social.linkedin, Icon: LinkedinIcon, color: "#0A66C2" },
  { label: "X", note: "@mattiaciuni", href: site.social.x, Icon: TwitterIcon, color: "#000000" },
  { label: "GitHub", note: "@0AIDev", href: site.social.github, Icon: GithubIcon, color: "#181717" },
  { label: "Instagram", note: "@mciunim", href: site.social.instagram, Icon: InstagramIcon, color: "#E1306C" },
  { label: "YouTube", note: "@mattiaciuni", href: site.social.youtube, Icon: YoutubeIcon, color: "#FF0000" },
  { label: "Spotify", note: "Podcast", href: site.social.spotify, Icon: SpotifyIcon, color: "#1DB954" },
  { label: "Crunchbase", note: "person/mattia-ciuni", href: site.social.crunchbase, Icon: CrunchbaseIcon, color: "#1460FF" },
];

// Le pagine di questo sito che valgono un tocco: articoli, log, feedback.
const sections = [
  { label: "Thoughts", note: "Long-form writing", href: "/thoughts/" },
  { label: "Notes", note: "Short logs, built in public", href: "/notes/" },
  { label: "Feedback", note: "Send a correction, reviewed in public", href: "/feedback/" },
];

/**
 * Una riga-clic: stessa altezza per tutti i link, bordo che si scurisce
 * all'hover invece di uno sfondo colorato, freccia che indica la direzione.
 * Il testo interno è un `<span>`, così ogni riga resta un solo `<a>`.
 */
function Row({
  href,
  label,
  note,
  icon,
  external,
}: {
  href: string;
  label: string;
  note: string;
  icon: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "me noopener noreferrer" } : {})}
      className="group flex items-center gap-3 rounded-2xl border border-gray-300 px-4 py-3.5 text-left transition-colors hover:border-gray-1200 sm:gap-4 sm:px-5"
    >
      <span className="shrink-0 text-gray-1200">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium leading-5 text-gray-1200">{label}</span>
        <span className="mt-0.5 block break-words text-xs leading-5 text-gray-1000">{note}</span>
      </span>
      {external ? (
        <ArrowUpRightIcon size={16} className="inline-flex shrink-0 text-gray-1000" />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-1000 transition-transform group-hover:translate-x-1" />
      )}
    </a>
  );
}

export default function Page() {
  return (
    <main
      id="content"
      className="mx-auto w-full min-w-0 max-w-[520px] px-5 pt-4 pb-4 sm:px-6 sm:pt-8"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      {/*
        L'header è un blocco di luce, non una fascia con un bordo: un alone
        bianco che parte pieno in alto e si scioglie nel fondo della pagina.
        Sopra ci stanno la figura, il nome e i profili, tutti in nero, perché su
        bianco il nero si legge e il grigio chiaro no.

        Il gradiente è decorativo, quindi è `aria-hidden` e non prende il mouse:
        la figura resta cliccabile perché sta sopra, nel contesto impilato.
      */}
      <header className="relative -mx-5 overflow-hidden px-5 pt-6 pb-8 sm:-mx-6 sm:px-6 sm:pb-10">
        <div
          aria-hidden="true"
          className="link-hero-glow pointer-events-none absolute inset-x-0 -top-4 h-[520px]"
        />
        <div className="relative flex flex-col items-center text-center">
          {/* Il nome sta **dentro** la figura, appoggiato al bordo basso: cade
              sul maglione scuro e resta bianco. Il ritaglio elimina la vecchia
              scritta incorporata nel master, così il titolo esiste una sola volta
              come testo HTML accessibile. */}
          <div className="relative">
            <Image
              src="/mattia-cutout.webp"
              alt=""
              width={560}
              height={558}
              priority
              sizes="560px"
              className="link-hero-cutout h-[240px] w-auto select-none sm:h-[280px]"
            />
            <h1 className="absolute inset-x-0 bottom-0 font-serif text-[30px] font-semibold leading-none text-gray-background sm:text-4xl">
              Mattia Ciuni
            </h1>
          </div>
          <p className="mt-1 text-[15px] leading-relaxed text-gray-1200">
            Founder &amp; CEO at{" "}
            <a
              href={site.payleUrl}
              rel="noopener noreferrer"
              className="font-semibold underline decoration-transparent underline-offset-4 transition-colors hover:decoration-gray-1200"
            >
              Payle
            </a>
            , the money layer for AI agents.
          </p>
        </div>

        <nav aria-label="Profiles" className="relative mt-6 flex flex-wrap items-center justify-center gap-3">
          {profiles.map(({ label, href, Icon, color }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="me noopener noreferrer"
              aria-label={`Mattia Ciuni on ${label}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-preview-bg transition-colors hover:border-gray-1200"
            >
              <Icon size={19} color={color} />
            </a>
          ))}
        </nav>
      </header>

      <div className="mt-8 flex flex-col gap-2">
        <Row
          href={site.payleUrl}
          label="Payle"
          note="usepayle.com"
          icon={<GlobeIcon size={19} />}
          external
        />
        <Row
          href={`mailto:${site.email}`}
          label="Email"
          note={site.email}
          icon={<MailCheckIcon size={19} />}
        />
        {/* La newsletter è la terza cosa che si può fare da qui, quindi sta
            nella stessa lista e con lo stesso bordo dei link: la sua scheda. */}
        <NewsletterSection variant="card" />
      </div>

      <h2 className="mt-10 text-center font-serif text-base font-medium text-gray-1200">
        On this site
      </h2>
      <div className="mt-4 flex flex-col gap-2">
        {sections.map(({ label, note, href }) => (
          <Row
            key={href}
            href={href}
            label={label}
            note={note}
            icon={<LinkIcon size={19} />}
          />
        ))}
      </div>

      <p className="mt-10 text-center text-xs leading-relaxed text-gray-1000">
        Milan, Italy. <Link href="/" className="article-underline">Full site</Link>.
      </p>
    </main>
  );
}
