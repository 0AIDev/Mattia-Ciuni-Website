import { SITE_ORIGIN } from "./site-origin";
import { withSiteSettings } from "./cms-settings";

const siteDefaults = {
  name: "Mattia Ciuni",
  role: "Founder & CEO at Know Computer",
  // Dominio di produzione. `lib/site-origin.ts` valida la configurazione
  // `NEXT_PUBLIC_SITE_URL` del progetto Pages e restituisce sempre l'unica
  // origine SEO autorizzata. Usato da metadataBase, canonical, sitemap,
  // robots, llms.txt, JSON-LD, RSS e OG.
  url: SITE_ORIGIN,
  description:
    "Founder & CEO of Know Computer, a personal context layer for the AI era.",
  email: "m@knowcomputer.com",
  companyUrl: "https://knowcomputer.com",
  locale: "en_US",
  language: "en",
  social: {
    linkedin: "https://www.linkedin.com/in/mattiaciuni",
    github: "https://github.com/0AIDev",
    x: "https://x.com/mattiaciuni",
    instagram: "https://www.instagram.com/mciunim",
    crunchbase: "https://www.crunchbase.com/person/mattia-ciuni",
    youtube: "https://www.youtube.com/@mattiaciuni",
    spotify: "https://open.spotify.com/show/7n9YvyiUCS1xX4tp6518JQ",
  },
} as const;

/**
 * `site` e' il default in codice con l'eventuale override del pannello applicato
 * sopra. Il tipo resta quello del default (`as const` del literal): un override
 * non puo' cambiare la forma dell'oggetto, solo i valori delle chiavi gia'
 * dichiarate, quindi `site.social.linkedin` resta una stringa per il compilatore.
 */
export const site = withSiteSettings(siteDefaults);
