import { SITE_ORIGIN } from "./site-origin";

export const site = {
  name: "Mattia Ciuni",
  role: "Founder & CEO at Payle",
  // Dominio di produzione. `lib/site-origin.ts` valida la configurazione
  // `NEXT_PUBLIC_SITE_URL` del progetto Pages e restituisce sempre l'unica
  // origine SEO autorizzata. Usato da metadataBase, canonical, sitemap,
  // robots, llms.txt, JSON-LD, RSS e OG.
  url: SITE_ORIGIN,
  // La description è una riga di SERP, non una bio: oltre i ~155 caratteri
  // Google la taglia, e quella vecchia ne faceva 166. Il dettaglio concreto
  // ("una ricevuta verificabile per ogni pagamento") resta; la coda su YC e San
  // Francisco no, perché il testo della home la dice già per esteso.
  description:
    "Founder & CEO of Payle, the money layer for AI agents. Scoped permissions, deterministic authorization and a verifiable receipt for every payment.",
  email: "ceo@usepayle.com",
  payleUrl: "https://usepayle.com",
  locale: "en_US",
  language: "en",
  // I profili sono un solo elenco, e `Object.values(site.social)` è il `sameAs`
  // del Person JSON-LD: un canale aggiunto qui è un canale che i motori e gli
  // agenti riconoscono come la stessa persona. Facebook non c'è perché non
  // esiste; YouTube e Spotify sì, e sono i due canali dove il lavoro si vede.
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
