import { cmsSiteSettings as generatedSiteSettings } from "./generated/cms-copy";

/**
 * Impostazioni del sito pubblicate dal pannello.
 *
 * Vivono in `content/cms/settings/site.json` e arrivano qui gia' compilate in
 * `lib/generated/cms-copy.ts` dal prebuild. Non sono lette dal filesystem in
 * questo modulo per una ragione precisa: `lib/site.ts` e' importato da
 * componenti client (footer, contatti, sezioni della home) e `node:fs` in un
 * bundle browser fa fallire la build. Il pannello scrive il JSON, il prebuild lo
 * congela in TypeScript, e il client vede un oggetto.
 *
 * `lib/site.ts` resta il default in codice. Il motivo di tenere due fonti e' lo
 * stesso dei contenuti: il default deve continuare a funzionare senza nessun
 * deploy, e un override parziale non deve poter cancellare meta che servono
 * (per esempio `social` finisce dentro il `sameAs` del JSON-LD Person, e un
 * array vuoto farebbe sparire i profili dai motori).
 */
export type SiteSettings = {
  name?: string;
  role?: string;
  description?: string;
  email?: string;
  payleUrl?: string;
  locale?: string;
  language?: string;
  ogImage?: string;
  social?: Record<string, string>;
};

const siteSettings: SiteSettings = generatedSiteSettings as SiteSettings;

/** Le chiavi sociali dichiarate in codice, per non perdere un profilo esistente. */
const KNOWN_SOCIAL_KEYS = [
  "linkedin",
  "github",
  "x",
  "instagram",
  "crunchbase",
  "youtube",
  "spotify",
] as const;

export function cmsSiteSettings(): SiteSettings {
  return siteSettings;
}

/**
 * Applica l'override del pannello a un oggetto di base, campo per campo.
 *
 * Un campo stringa vuota **non** sovrascrive: cancellare la description dal
 * pannello deve poter significare "torna al default", non "pubblica una pagina
 * senza description", che e' il modo piu' rapido per perdere una SERP.
 */
export function withSiteSettings<T extends Record<string, unknown>>(base: T): T {
  const merged = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(siteSettings)) {
    if (key === "slug" || key === "social") continue;
    if (typeof value === "string" && value.trim()) merged[key] = value;
  }
  if (siteSettings.social && typeof siteSettings.social === "object") {
    const social = { ...(base.social as Record<string, string> | undefined) };
    for (const [network, url] of Object.entries(siteSettings.social)) {
      if (typeof url !== "string") continue;
      if (url.trim()) social[network] = url;
      else delete social[network];
    }
    // Una riga vuota cancella il profilo di proposito, ma non deve poter
    // cancellare l'ultimo canale: `sameAs` vuoto e' peggio di un canale in piu'.
    merged.social = Object.keys(social).length ? social : base.social;
  }
  return merged as T;
}

export { KNOWN_SOCIAL_KEYS };
