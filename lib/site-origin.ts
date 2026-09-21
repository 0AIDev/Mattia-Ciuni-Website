/**
 * L'unico posto in cui è **scritto** il dominio di produzione.
 *
 * Perché un file a parte, con dentro solo una stringa: perché lo leggono tre
 * cose diverse, e se ognuna avesse la sua copia tornerebbe il guasto del
 * 2026-09-21 — il sito dichiarava `https://mattiaciuni.xyz`, che non esiste in
 * DNS, mentre rispondeva su un altro host. Discord e X non mostravano l'anteprima
 * (chiedevano la card a un dominio inesistente), la sitemap elencava otto
 * indirizzi irraggiungibili, e nel build era tutto verde.
 *
 *   - il **build** (`lib/site.ts` → canonical, sitemap, feed, JSON-LD, OG)
 *   - l'**edge** (`functions/_middleware.ts`), che sa qual è il dominio scritto
 *     nell'export per poterlo sostituire con quello che serve davvero la pagina
 *   - i **controlli** (`scripts/verify.js`), che pretendono coerenza fra i due
 *
 * Non è un file di configurazione: è la domanda "per quale host è stato
 * costruito questo export?". La risposta giusta è `https://<progetto>.pages.dev`
 * del progetto Pages (`README.md` → Deploy). Se il progetto si chiama
 * diversamente, si cambia qui **e** la variabile `NEXT_PUBLIC_SITE_URL` nel
 * progetto: il middleware sostituisce comunque l'host a chi serve la pagina, ma
 * l'export deve essere vero da solo.
 */
export const SITE_ORIGIN = "https://mattiaciuni.pages.dev";
