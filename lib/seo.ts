import { LOCALES } from "./i18n";

/**
 * Gli `hreflang` di una pagina che esiste in tutte le lingue del sito.
 *
 * `path` è il percorso **canonico senza prefisso** della pagina, con lo slash
 * finale: `/`, `/about/`, `/thoughts/<slug>/`. La stessa mappa esce da tutte le
 * varianti linguistiche dello stesso contenuto, ed è deliberatamente una regola
 * sola:
 *
 * - `en` punta sempre alla variante prefissata (`/en/...`), anche quando la
 *   pagina non è prefissata. L'URL senza prefisso non è una sesta lingua: è la
 *   versione predefinita, e per questo sta in `x-default`. Se `en` puntasse a
 *   `/about/` su una pagina e a `/en/about/` su un'altra, la stessa lingua
 *   avrebbe due candidati e i motori tendono a scartare l'annotazione intera.
 * - `x-default` punta all'URL senza prefisso, che è la pagina che si apre a chi
 *   non ha ancora scelto una lingua.
 *
 * Un'annotazione hreflang non è una decorazione: si dichiara solo perché ogni
 * variante esiste davvero, e per questo la usa ogni pagina pubblica del sito.
 */
export function languageAlternates(path: string): Record<string, string> {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    languages[locale] = `/${locale}${clean}`;
  }
  languages["x-default"] = clean;
  return languages;
}
