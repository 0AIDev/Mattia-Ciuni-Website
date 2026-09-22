"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { LOCALES, localeMeta, localizedPath, type Locale } from "@/lib/i18n";

const STORAGE_KEY = "mattia-ciuni-language-choice-v1";
const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  IT: "it", FR: "fr", ES: "es", DE: "de", AT: "de", CH: "de", BE: "fr", LU: "fr",
};
const LANGUAGE_TO_LOCALE: Record<string, Locale> = { en: "en", it: "it", fr: "fr", es: "es", de: "de" };

function localeFromPath(pathname: string): Locale {
  const candidate = pathname.split("/")[1];
  return LOCALES.includes(candidate as Locale) ? (candidate as Locale) : "en";
}

function pathForLocale(locale: Locale, pathname: string, search: string) {
  const current = localeFromPath(pathname);
  const bare = current === "en" ? pathname : pathname.replace(new RegExp(`^/${current}(?=/|$)`), "") || "/";
  const destination = locale === "en" ? bare || "/" : localizedPath(locale, bare || "/");
  return `${destination}${search}`;
}

export function LanguageSuggestion() {
  const [suggested, setSuggested] = useState<Locale | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const currentPath = typeof window === "undefined" ? "/" : window.location.pathname;
  const current = useMemo(() => localeFromPath(currentPath), [currentPath]);

  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;

    const savedChoice = window.localStorage.getItem(STORAGE_KEY);
    const savedLocale = savedChoice && LOCALES.includes(savedChoice as Locale) ? (savedChoice as Locale) : null;
    if (savedLocale && savedLocale !== "en" && localeFromPath(window.location.pathname) === "en") {
      window.location.replace(pathForLocale(savedLocale, window.location.pathname, window.location.search));
      return;
    }
    if (savedLocale) return;

    const browserLocale = LANGUAGE_TO_LOCALE[navigator.language.slice(0, 2).toLowerCase()];
    const fallback = browserLocale || "en";
    fetch("/api/locale", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { country?: string } | null) => {
        const countryLocale = data?.country ? COUNTRY_TO_LOCALE[data.country.toUpperCase()] : undefined;
        const detected = countryLocale || browserLocale || "en";
        // On the bare English site, an Italian/European visitor is redirected
        // immediately. Other language changes remain an explicit suggestion.
        if (detected !== "en" && localeFromPath(window.location.pathname) === "en") {
          const destination = pathForLocale(detected, window.location.pathname, window.location.search);
          window.location.replace(destination);
          return;
        }
        setSuggested(detected);
      })
      .catch(() => setSuggested(fallback));
  }, []);

  if (!suggested || suggested === current || dismissed || typeof window === "undefined") return null;

  const from = localeMeta[current];
  const to = localeMeta[suggested];
  const prompt = current === "it"
    ? { heading: "Seleziona la lingua preferita", body: `Abbiamo notato che stai navigando in ${from.label}. Preferiresti visualizzare il sito in`, action: `Passa a ${to.native}`, dismiss: "Chiudi suggerimento lingua" }
    : { heading: "Select your preferred language", body: `We noticed that you are browsing in ${from.label}. Prefer to view the site in`, action: `Switch to ${to.native}`, dismiss: "Dismiss language suggestion" };

  function remember() {
    window.localStorage.setItem(STORAGE_KEY, suggested as Locale);
  }

  return (
    <aside className="fixed bottom-4 left-2 right-2 z-[9999] mx-auto max-w-[500px] rounded-[24px] border border-gray-300 bg-white/90 shadow-[0_0_20px_rgba(0,0,0,0.08)] backdrop-blur-lg sm:left-auto sm:right-4 sm:mx-0" aria-label={prompt.heading}>
      <div className="p-5 pr-14">
        <p className="mb-5 font-serif text-xl leading-tight text-gray-1200">{prompt.heading}</p>
        <p className="m-0 text-sm leading-relaxed text-gray-1000">{prompt.body} <strong className="text-gray-1200">{to.native}</strong>?</p>
      </div>
      <button type="button" onClick={() => { setDismissed(true); remember(); }} aria-label={prompt.dismiss} className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-1200 shadow-sm transition-colors hover:bg-gray-100">
        <span aria-hidden="true" className="text-xl leading-none">×</span>
      </button>
      <div className="h-px bg-gray-200" />
      <div className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100" aria-label={from.label}>
            <Image src={`/flags/${from.country.toLowerCase()}.svg`} alt={from.label} className="language-flag" width={28} height={28} unoptimized />
          </span>
          <span className="text-gray-1000">›</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100" aria-label={to.label}>
            <Image src={`/flags/${to.country.toLowerCase()}.svg`} alt={to.label} className="language-flag" width={28} height={28} unoptimized />
          </span>
        </div>
        <a href={pathForLocale(suggested, window.location.pathname, window.location.search)} onClick={remember} className="rounded-full bg-gray-1200 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80">{prompt.action}</a>
      </div>
    </aside>
  );
}
