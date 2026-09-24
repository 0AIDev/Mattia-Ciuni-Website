"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ForAICard } from "@/components/ForAICard";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";
import { SpotifyIcon, YoutubeIcon } from "@/components/ui/static-icons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { copy, isLocale, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  // /link è una pagina per i link in bio: vive fuori dal sito, si apre da un
  // profilo social e deve finire sopra la piega. Le navigazioni del footer
  // sarebbero una seconda lista di link sotto la lista di link.
  if (pathname?.startsWith("/link")) return null;
  const candidate = pathname?.split("/")[1] || "";
  const locale: Locale = isLocale(candidate) ? candidate : "en";
  const text = copy[locale];
  const prefix = locale === "en" ? "" : `/${locale}`;
  const href = (path: string) => `${prefix}${path}`;
  return (
    <footer className="mx-auto max-w-[692px] px-6 pb-10">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-gray-300 pt-8 text-gray-1000">
        <a href="/feed.xml" className="flex items-center gap-1.5">
          {text.feed} <ArrowUpRightIcon size={15} className="inline-flex shrink-0" />
        </a>
        <span>© 2026 Mattia Ciuni</span>
        <ForAICard />
      </div>
      {/*
        I due canali che non stavano in nessun'altra pagina: i video su YouTube
        e il podcast su Spotify. Stanno nel footer perché il piè di pagina è
        l'unico posto che ogni indirizzo del sito condivide, ed è quello che i
        crawler (e i controlli dei tool SEO) leggono per capire dove si trova
        questa persona.
      */}
      <nav aria-label="Channels" className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-1000">
        <a href={site.social.youtube} rel="me noopener noreferrer" className="inline-flex items-center gap-1.5">
          <YoutubeIcon size={15} className="shrink-0" aria-hidden="true" /> YouTube
        </a>
        <a href={site.social.spotify} rel="me noopener noreferrer" className="inline-flex items-center gap-1.5">
          <SpotifyIcon size={15} className="shrink-0" aria-hidden="true" /> Spotify
        </a>
      </nav>
      <nav aria-label="Site" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-1000">
        <Link href={href("/about/")}>{text.about}</Link>
        <Link href={href("/work/")}>{text.work}</Link>
        <Link href={href("/thoughts/")}>{text.thoughts}</Link>
        <Link href={href("/notes/")}>{text.notes}</Link>
        <Link href={href("/feedback/")}>{text.feedback}</Link>
        <Link href={href("/careers/")}>{text.careers}</Link>
      </nav>
      <nav aria-label="Legal" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-1000">
        <Link href={href("/privacy/")}>{text.privacy}</Link>
        <Link href={href("/terms/")}>{text.terms}</Link>
        <Link href={href("/cookies/")}>{text.cookies}</Link>
        <Link href={href("/legal/")}>{text.legal}</Link>
      </nav>
      <div className="mt-6 flex items-center gap-3 text-sm text-gray-1000">
        <span>{text.language}</span>
        <LanguageSwitcher currentLocale={locale} label={text.language} />
      </div>
      <div aria-hidden="true" className="site-signature mx-auto mt-16" />
    </footer>
  );
}
