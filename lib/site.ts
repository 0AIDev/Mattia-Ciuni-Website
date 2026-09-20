export const site = {
  name: "Mattia Ciuni",
  role: "Founder & CEO @ Payle",
  // Dominio di produzione.
  // - Preferito: variabile d'ambiente NEXT_PUBLIC_SITE_URL su Cloudflare Pages
  //   (se il deploy la imposta, qui non si tocca nulla).
  // - Altrimenti: cambia il fallback qui sotto (unico punto).
  // Usato da metadataBase, canonical, sitemap, robots, llms.txt, JSON-LD, RSS e OG.
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://mattiaciuni.xyz",
  description:
    "Founder & CEO of Payle, the money layer for AI agents. Building controlled spending infrastructure for the agentic economy. YC applicant, relocating to San Francisco.",
  email: "ceo@usepayle.com",
  payleUrl: "https://usepayle.com",
  locale: "en_US",
  language: "en",
  // TODO: inserisci i tuoi handle reali qui (un solo punto da aggiornare).
  social: {
    linkedin: "https://www.linkedin.com/in/mattiaciuni",
    github: "https://github.com/mattiaciuni",
    x: "https://x.com/mattiaciuni",
    instagram: "https://www.instagram.com/mciunim",
    crunchbase: "https://www.crunchbase.com/person/mattia-ciuni",
  },
} as const;
