import { loadCmsCollection } from "./cms-content";

/**
 * Redirect pubblicati dal pannello.
 *
 * Ogni voce e' un JSON in `content/cms/redirect/<slug>.json`:
 *
 *     { "slug": "old-slug", "from": "/old-path/", "to": "/new-path/", "status": 301 }
 *
 * Il formato e' quello di `public/_redirects`, non un formato proprietario: se
 * una regola va storta si puo' copiare la riga a mano e capire subito. La
 * generazione del file sta in `scripts/gen-redirects.mjs`, che unisce le regole
 * in codice con queste e scrive `out/_redirects` dopo la build.
 */
export type CmsRedirect = {
  slug?: string;
  from?: string;
  to?: string;
  /** 301 definitivo, 302 temporaneo. Cloudflare accetta entrambi. */
  status?: number;
  enabled?: boolean;
};

const ALLOWED_STATUS = new Set([301, 302, 307, 308]);

function isSafePath(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes(" ");
}

/**
 * Il percorso di destinazione puo' essere anche esterno: un redirect verso
 * `https://usepayle.com/` e' il caso piu' comune quando una sezione del sito
 * personale diventa una pagina del prodotto.
 */
function isValidTarget(value: unknown): value is string {
  return typeof value === "string" && (isSafePath(value) || /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}/i.test(value));
}

export const cmsRedirects: CmsRedirect[] = loadCmsCollection<CmsRedirect>("redirect")
  .filter((rule) => rule && rule.enabled !== false && isSafePath(rule.from) && isValidTarget(rule.to))
  .map((rule) => ({
    slug: String(rule.slug || rule.from),
    from: String(rule.from),
    to: String(rule.to),
    status: ALLOWED_STATUS.has(Number(rule.status)) ? Number(rule.status) : 301,
  }));

/** Le righe `_redirects`, nell'ordine in cui vanno scritte. */
export function cmsRedirectLines(): string[] {
  return cmsRedirects.map((rule) => `${rule.from}  ${rule.to}  ${rule.status}`);
}
