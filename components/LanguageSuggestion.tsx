"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";
import { LANGUAGE_STORAGE_KEY, LOCALES, localeMeta, localizedPath, type Locale } from "@/lib/i18n";

const STORAGE_KEY = LANGUAGE_STORAGE_KEY;
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;
const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  IT: "it", FR: "fr", ES: "es", DE: "de", AT: "de", CH: "de", BE: "fr", LU: "fr",
};
const LANGUAGE_TO_LOCALE: Record<string, Locale> = { en: "en", it: "it", fr: "fr", es: "es", de: "de" };

function localeFromPath(pathname: string): Locale {
  const candidate = pathname.split("/")[1];
  return LOCALES.includes(candidate as Locale) ? (candidate as Locale) : "en";
}

function hasLocalePrefix(pathname: string): boolean {
  return LOCALES.includes((pathname.split("/")[1] || "") as Locale);
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
  const [consent, setConsent] = useState<"unset" | "accepted" | "declined">("unset");
  const pathname = usePathname() || "/";
  const current = useMemo(() => localeFromPath(pathname), [pathname]);

  // The static export is corrected after build; keep the live document in sync
  // during development and client-side navigation as well.
  useEffect(() => {
    document.documentElement.lang = current;
  }, [current]);

  useEffect(() => {
    if (window.location.pathname.startsWith("/admin") || window.location.pathname.includes("/careers/") && window.location.pathname.endsWith("/apply/")) return;
    const readConsent = () => {
      const value = window.localStorage.getItem("mattia-ciuni-analytics-consent");
      setConsent(value === "accepted" || value === "declined" ? value : "unset");
    };
    readConsent();
    window.addEventListener("storage", readConsent);
    window.addEventListener("mattia-analytics-consent", readConsent);
    return () => {
      window.removeEventListener("storage", readConsent);
      window.removeEventListener("mattia-analytics-consent", readConsent);
    };
  }, []);

  useEffect(() => {
    if (consent === "unset" || window.location.pathname.startsWith("/admin") || (window.location.pathname.includes("/careers/") && window.location.pathname.endsWith("/apply/"))) return;

    // A locale in the URL is authoritative. Never let a stored country/browser
    // preference move an explicitly localized page back to another language.
    if (hasLocalePrefix(window.location.pathname)) return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const remembered = JSON.parse(saved) as { locale?: Locale; dismissedAt?: number };
        if (remembered.dismissedAt && Date.now() - remembered.dismissedAt < DISMISS_MS) return;
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    const browserLocale = LANGUAGE_TO_LOCALE[navigator.language.slice(0, 2).toLowerCase()];
    const fallback = browserLocale || "en";
    fetch("/api/locale", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { country?: string } | null) => {
        const countryLocale = data?.country ? COUNTRY_TO_LOCALE[data.country.toUpperCase()] : undefined;
        const detected = countryLocale || browserLocale || "en";
        // Detection is advisory only. Language changes happen after an
        // explicit click, never as a surprise redirect.
        setSuggested(detected);
      })
      .catch(() => setSuggested(fallback));
  }, [consent]);

  useEffect(() => {
    if (consent === "unset" || typeof window === "undefined") return;
    const browserLocale = LANGUAGE_TO_LOCALE[navigator.language.slice(0, 2).toLowerCase()] || "en";
    track("language_suggestion_ready", { consent_state: consent, browser_locale: browserLocale });
  }, [consent]);

  if (consent === "unset" || !suggested || suggested === current || dismissed || typeof window === "undefined") return null;

  const from = localeMeta[current];
  const to = localeMeta[suggested];
  const prompt = current === "it"
    ? { heading: "Seleziona la lingua preferita", body: `Abbiamo notato che stai navigando in ${from.label}. Preferiresti visualizzare il sito in`, action: `Passa a ${to.native}`, dismiss: "Chiudi suggerimento lingua" }
    : { heading: "Select your preferred language", body: `We noticed that you are browsing in ${from.label}. Prefer to view the site in`, action: `Switch to ${to.native}`, dismiss: "Dismiss language suggestion" };

  function remember(locale: Locale = current) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ locale, dismissedAt: Date.now() }));
  }

  function dismissSuggestion() {
    setDismissed(true);
    remember(current);
    track("language_suggestion_dismiss", { from_locale: current, suggested_locale: suggested });
  }

  return (
    <aside className="fixed bottom-4 left-2 right-2 z-[9999] mx-auto max-w-[500px] rounded-[24px] border border-gray-300 bg-preview-bg/90 shadow-[0_0_20px_rgba(0,0,0,0.08)] backdrop-blur-lg sm:left-auto sm:right-4 sm:mx-0" aria-label={prompt.heading}>
      <div className="p-5 pr-14">
        <p className="mb-5 font-serif text-xl leading-tight text-gray-1200">{prompt.heading}</p>
        <p className="m-0 text-sm leading-relaxed text-gray-1000">{prompt.body} <strong className="text-gray-1200">{to.native}</strong>?</p>
      </div>
      <button type="button" onClick={dismissSuggestion} aria-label={prompt.dismiss} className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-preview-bg text-gray-1200 shadow-sm transition-colors hover:bg-gray-100">
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
        <a href={pathForLocale(suggested, window.location.pathname, window.location.search)} onClick={() => { remember(suggested); track("language_suggestion_switch", { from_locale: current, to_locale: suggested }); }} className="rounded-full bg-gray-1200 px-4 py-2.5 text-sm font-semibold text-gray-background transition-opacity hover:opacity-80">{prompt.action}</a>
      </div>
    </aside>
  );
}
