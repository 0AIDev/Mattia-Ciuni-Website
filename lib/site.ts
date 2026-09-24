import { SITE_ORIGIN } from "./site-origin";

export const site = {
  name: "Mattia Ciuni",
  role: "Founder & CEO at Payle",
  // Dominio di produzione. `lib/site-origin.ts` valida la configurazione
  // `NEXT_PUBLIC_SITE_URL` del progetto Pages e restituisce sempre l'unica
  // origine SEO autorizzata. Usato da metadataBase, canonical, sitemap,
  // robots, llms.txt, JSON-LD, RSS e OG.
  url: SITE_ORIGIN,
  description:
    "Founder & CEO of Payle, the money layer for AI agents. Building controlled spending infrastructure for the agentic economy. YC applicant, relocating to San Francisco.",
  email: "ceo@usepayle.com",
  payleUrl: "https://usepayle.com",
  locale: "en_US",
  language: "en",
  // TODO: inserisci i tuoi handle reali qui (un solo punto da aggiornare).
  social: {
    linkedin: "https://www.linkedin.com/in/mattiaciuni",
    github: "https://github.com/0AIDev",
    x: "https://x.com/mattiaciuni",
    instagram: "https://www.instagram.com/mciunim",
    crunchbase: "https://www.crunchbase.com/person/mattia-ciuni",
  },
} as const;
