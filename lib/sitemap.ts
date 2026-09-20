export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changeFrequency: string;
  priority: string;
}

// Fallback per un sito senza contenuti (in pratica mai):
// una data troppo vecchia fa riscansire la pagina, troppo nuova è una bugia.
const LAUNCH = "2026-09-20";

/**
 * Le pagine indice non hanno una data propria: cambiano quando cambiano i loro
 * contenuti, quindi la loro `lastmod` è la più recente fra quelle reali (date
 * degli articoli, `updated` quando c'è). Un sitemap che a ogni deploy dichiara
 * cambiate tutte le pagine è il caso in cui Google smette di credergli.
 */
export function latestOf(dates: Array<string | undefined>): string {
  const valid = dates
    .filter((date): date is string => !!date && /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  return valid.length ? valid[valid.length - 1] : LAUNCH;
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function urlsetXml(urls: SitemapUrl[]): string {
  const body = urls
    .map(
      (u) =>
        `  <url>\n` +
        `    <loc>${esc(u.loc)}</loc>\n` +
        `    <lastmod>${u.lastmod}</lastmod>\n` +
        `    <changefreq>${u.changeFrequency}</changefreq>\n` +
        `    <priority>${u.priority}</priority>\n` +
        `  </url>`,
    )
    .join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${body}\n` +
    `</urlset>\n`
  );
}

export function sitemapIndexXml(children: Array<{ loc: string; lastmod: string }>): string {
  const body = children
    .map(
      (c) =>
        `  <sitemap>\n` +
        `    <loc>${esc(c.loc)}</loc>\n` +
        `    <lastmod>${c.lastmod}</lastmod>\n` +
        `  </sitemap>`,
    )
    .join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${body}\n` +
    `</sitemapindex>\n`
  );
}