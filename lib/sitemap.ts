export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changeFrequency: string;
  priority: string;
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