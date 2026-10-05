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
 *
 * Dal 5 ottobre 2026 l'origine production è il dominio proprio
 * `mattiaciuni.com`, non piu' il sottodominio `mattiaciuni.pages.dev` che
 * Cloudflare assegna al progetto. Quel sottodominio adesso riceve un 301 e non
 * si indicizza piu': vive in `functions/_middleware.ts`, che conosce l'host
 * legacy senza importarlo da qui (una Function non puo' importare questo
 * modulo: la sua validazione gira anche dove `NEXT_PUBLIC_SITE_URL` non
 * coincide, e farebbe fallire l'intera Function invece di una riga). Il nome
 * dell'host legacy e' quindi scritto in due punti per forza; `scripts/verify.js`
 * controlla che i due dicano la stessa cosa, e che il redirect punti
 * all'origine dichiarata qui.
 */
const PRODUCTION_ORIGIN = "https://mattiaciuni.com";
const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");

if (configuredOrigin && configuredOrigin !== PRODUCTION_ORIGIN) {
  throw new Error(
    `NEXT_PUBLIC_SITE_URL deve essere ${PRODUCTION_ORIGIN} (trovato ${configuredOrigin})`,
  );
}

export const SITE_ORIGIN = configuredOrigin || PRODUCTION_ORIGIN;
