"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { LOCALES, isLocale, localeMeta, localizedPath, saveLanguageChoice, type Locale } from "@/lib/i18n";

type LanguageSwitcherProps = {
  currentLocale: Locale;
  label: string;
};

function pathWithoutLocale(pathname: string) {
  const firstSegment = pathname.split("/")[1] || "";
  if (!isLocale(firstSegment)) return pathname || "/";
  return pathname.slice(firstSegment.length + 1) || "/";
}

function flag(locale: Locale) {
  return (
    <Image
      src={`/flags/${localeMeta[locale].country.toLowerCase()}.svg`}
      alt=""
      width={20}
      height={20}
      unoptimized
      className="language-switcher-flag"
    />
  );
}

/**
 * Il selettore di lingua nel footer era un dropdown client-only: opzioni
 * disegnate da `button` in un elenco che il browser vedeva solo dopo un click.
 * I crawler non cliccano, quindi le 75 pagine localizzate non avevano un solo
 * link interno reale: le scoprivano solo dal sitemap (è la voce "orphaned
 * sitemap pages" dell'audit Semrush).
 *
 * Ora le opzioni sono **anchor veri** (`<a href>`) sempre nel DOM: il crawler
 * vede i cinque indirizzi da ogni pagina, la navigazione resta client-side per
 * chi clicca, e il pannello resta un controllo reale (non `aria-hidden`).
 */
export function LanguageSwitcher({ currentLocale, label }: LanguageSwitcherProps) {
  const pathname = usePathname() || "/";

  // La querystring non entra in `href`: un `useSearchParams()` qui manderebbe
  // l'intero export in bailout client-side (`missing-suspense-with-csr-bailout`)
  // e i link che il crawler deve vedere perderebbero il prerender. La query è
  // navigazione, non identificazione: la canonical di ogni pagina non ne conta.
  // La si riaggancia al momento del click, dove gira già nel browser.
  function withQuery(href: string) {
    if (typeof window === "undefined") return href;
    const query = window.location.search;
    return query ? `${href}${query}` : href;
  }
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function hrefFor(locale: Locale) {
    const barePath = pathWithoutLocale(pathname);
    // Il default inglese vive sugli URL senza prefisso: puntare a `/en/...`
    // (che è un redirect verso sé stessa) perderebbe la posizione corrente.
    return withQuery(locale === "en" ? barePath : localizedPath(locale, barePath));
  }

  // Corpo dell'onClick, non del render: effetti (storage, evento) non
  // appartengono alla fase di render. La registrazione della scelta sta in
  // `saveLanguageChoice` (lib/i18n.ts), il suo modulo la tiene fuori dal render.
  const onChoose = (locale: Locale) => {
    saveLanguageChoice(locale);
    track("language_switch", { from_locale: currentLocale, to_locale: locale, source: "footer" });
    setOpen(false);
  };

  const current = localeMeta[currentLocale];

  return (
    <div ref={rootRef} className="relative w-[158px]">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-9 w-full items-center justify-between gap-2 rounded-full border border-gray-300 bg-transparent px-3 text-left text-sm text-gray-1200 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-1200"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {flag(currentLocale)}
          <span className="min-w-0 flex-1 truncate">{current.native}</span>
          <span className="shrink-0 text-xs text-gray-1000">{currentLocale.toUpperCase()}</span>
        </span>
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      </button>
      {open ? (
        <div className="absolute bottom-[calc(100%+0.5rem)] left-1/2 z-30 w-[220px] -translate-x-1/2 overflow-hidden rounded-[18px] border border-gray-300 bg-preview-bg p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          {LOCALES.map((locale) => (
            <Link
              key={locale}
              href={hrefFor(locale)}
              onClick={() => onChoose(locale)}
              title={localeMeta[locale].native}
              aria-current={locale === currentLocale ? "true" : undefined}
              className={`flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-1.5 text-left text-sm text-gray-1200 transition-colors hover:bg-gray-100 ${locale === currentLocale ? "bg-gray-100" : ""}`}
            >
              <span className="flex min-w-0 items-center gap-2">
                {flag(locale)}
                <span className="min-w-0 flex-1 whitespace-nowrap">{localeMeta[locale].native}</span>
              </span>
              <span className="ml-auto shrink-0 text-xs text-gray-1000">{locale.toUpperCase()}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
