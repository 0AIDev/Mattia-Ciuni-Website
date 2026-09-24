/**
 * L'unico valore ammesso per l'origine SEO production.
 *
 * Il valore configurato in Cloudflare Pages (`NEXT_PUBLIC_SITE_URL`) viene letto
 * al build e deve coincidere con questo invariant. Se qualcuno prova a usare
 * un altro dominio, il build fallisce invece di pubblicare un export SEO con
 * un'origine non autorizzata.
 *
 *   - il **build** (`lib/site.ts` → metadataBase, canonical, sitemap, feed,
 *     JSON-LD, OG)
 *   - i **controlli** (`scripts/verify.js`), che verificano l'export e la
 *     coerenza con la configurazione Pages
 *
 * La configurazione Cloudflare è la fonte del valore di deploy; questa
 * costante è il guardrail che impedisce a `.env.example`, a una variabile
 * sbagliata o a un fallback operativo di trasformare il dominio SEO. Le
 * variabili della Function non possono sostituirlo.
 */
const PRODUCTION_ORIGIN = "https://mattiaciuni.pages.dev";
const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");

if (configuredOrigin && configuredOrigin !== PRODUCTION_ORIGIN) {
  throw new Error(
    `NEXT_PUBLIC_SITE_URL deve essere ${PRODUCTION_ORIGIN} (trovato ${configuredOrigin})`,
  );
}

export const SITE_ORIGIN = configuredOrigin || PRODUCTION_ORIGIN;
