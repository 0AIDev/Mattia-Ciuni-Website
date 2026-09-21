/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export -> Cloudflare Pages (nessun runtime Node, nessun server).
  output: "export",
  reactStrictMode: true,
  poweredByHeader: false,
  // Le pagine finiscono in `out/<path>/index.html`, e non in `<path>.html`.
  //
  // Non è un dettaglio di gusto: è quello che rende `https://<sito>/thoughts/<slug>/`
  // l'indirizzo che Pages serve da sé. Con i file `.html`, Pages risponde 200 su
  // `/thoughts/<slug>` e fa **308 verso la forma senza barra** su quella con la
  // barra — mentre canonical, sitemap, feed, JSON-LD, link interni e indirizzi
  // delle card dichiarano tutti la forma **con** la barra. Il risultato sarebbe
  // ogni canonical reindirizzata altrove, cioè due indirizzi per la stessa
  // pagina e un canonical che mente: misurato in locale con `wrangler pages dev`,
  // non dedotto.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
