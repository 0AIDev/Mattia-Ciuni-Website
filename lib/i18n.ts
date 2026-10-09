import { cmsCopyOverrides } from "./generated/cms-copy";

export const LOCALES = ["en", "it", "fr", "es", "de"] as const;
export const LANGUAGE_STORAGE_KEY = "mattia-ciuni-language-choice-v1";
export type Locale = (typeof LOCALES)[number];

export const localeMeta: Record<Locale, { label: string; native: string; country: string }> = {
  en: { label: "English", native: "English", country: "US" },
  it: { label: "Italian", native: "Italiano", country: "IT" },
  fr: { label: "French", native: "Français", country: "FR" },
  es: { label: "Spanish", native: "Español", country: "ES" },
  de: { label: "German", native: "Deutsch", country: "DE" },
};

const baseCopy = {
  en: {
    home: "Home",
    about: "About",
    work: "Work",
    thoughts: "Thoughts",
    notes: "Notes",
    feedback: "Feedback",
    newsletter: "Newsletter",
    link: "Links",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    cookies: "Cookies",
    legal: "Legal Center",
    back: "Go back home",
    choose: "Select your preferred language",
    detected: (language: string) => `We noticed that you are browsing in ${language}. Would you prefer to view the site in`,
    switchTo: (language: string) => `Switch to ${language}`,
    dismiss: "Dismiss language suggestion",
    close: "Close",
    founder: "Founder & CEO at Know Computer, a personal context layer for the AI era.",
    // Il titolo SERP della home localizzata. `founder` è una riga di copy, non un
    // titolo: sotto i 70 caratteri ci sta solo senza "Founder & CEO at ", e
    // senza questo il template del layout aggiungeva la seconda volta
    // "| Mattia Ciuni".
    homeTitle: "Know Computer, a personal context layer for the AI era",
    homeLead: "I am building",
    homeBody: "Your computer and AI should understand what you are working on, remember what matters, and help you pick up where you left off. Before Know, I built Celeste and worked on financial infrastructure for AI agents through Payle, Ceilya and Noesia; that work continues through Know Layer.",
    aboutLead: "Mattia Ciuni is building Know Computer, a personal context layer for the AI era.",
    aboutBody: "An Italian founder working on the context, memory and permissions that let a computer understand what you are working on and help you continue.",
    workLead: "I build the systems that let software act in the real world.",
    workBody: "The common thread is context and continuity: helping computers and AI understand what matters so people can pick up where they left off.",
    shortThoughts: "Thoughts on context, AI and building Know Computer.",
    longNotes: "Longer, slower pieces on context, AI and how to build things that last.",
    feedbackLead: "You share what you see. It gets better. I publish it.",
    feedbackBody: "A public record of the people paying attention to the work and the corrections that survive review.",
    subscribe: "Subscribe",
    email: "Email address",
    sendFeedback: "Send feedback",
    language: "Language",
    feed: "Feed",
    careers: "Careers",
  },
  it: {
    home: "Home", about: "Chi sono", work: "Lavoro", thoughts: "Pensieri", notes: "Note", feedback: "Feedback", newsletter: "Newsletter", link: "Link", privacy: "Privacy", terms: "Termini di servizio", cookies: "Cookie", legal: "Centro legale", back: "Torna alla home", choose: "Seleziona la lingua preferita", detected: (language: string) => `Abbiamo notato che stai navigando in ${language}. Preferiresti visualizzare il sito in`, switchTo: (language: string) => `Passa a ${language}`, dismiss: "Chiudi suggerimento lingua", close: "Chiudi",    founder: "Founder & CEO at Know Computer, un context layer personale per l'era AI.", homeTitle: "Know Computer, un context layer personale per l'era AI", homeLead: "Sto costruendo", homeBody: "Il computer e l'AI dovrebbero capire su cosa stai lavorando, ricordare ciò che conta e aiutarti a riprendere dove avevi lasciato. Prima di Know ho costruito Celeste e ho lavorato sull'infrastruttura finanziaria per gli agenti AI con Payle, Ceilya e Noesia; quel lavoro continua con Know Layer.", aboutLead: "Mattia Ciuni sta costruendo Know Computer, un context layer personale per l'era AI.", aboutBody: "Un founder italiano che lavora su contesto, memoria e permessi per permettere al computer di capire su cosa stai lavorando e aiutarti a continuare.", workLead: "Costruisco sistemi che permettono al software di agire nel mondo reale.", workBody: "Il filo comune è contesto e continuità: aiutare computer e AI a capire ciò che conta perché le persone possano riprendere dove avevano lasciato.", shortThoughts: "Pensieri su contesto, AI e costruire Know Computer.", longNotes: "Note più lunghe e lente su contesto, AI e come costruire cose che durano.", feedbackLead: "Condividi ciò che vedi. Il prodotto migliora. Io lo pubblico.", feedbackBody: "Un registro pubblico delle persone che osservano il lavoro e delle correzioni che superano la revisione.", subscribe: "Iscriviti", email: "Indirizzo email", sendFeedback: "Invia feedback", language: "Lingua", feed: "Feed", careers: "Lavora con me",
  },
  fr: {
    home: "Accueil", about: "À propos", work: "Travail", thoughts: "Réflexions", notes: "Notes", feedback: "Retours", newsletter: "Newsletter", link: "Liens", privacy: "Politique de confidentialité", terms: "Conditions", cookies: "Cookies", legal: "Centre juridique", back: "Retour à l'accueil", choose: "Choisissez votre langue préférée", detected: (language: string) => `Nous avons remarqué que vous naviguez en ${language}. Préférez-vous voir le site en`, switchTo: (language: string) => `Passer en ${language}`, dismiss: "Fermer la suggestion de langue", close: "Fermer",    founder: "Founder & CEO at Know Computer, une couche de contexte personnelle pour l'ère de l'IA.", homeTitle: "Know Computer, une couche de contexte personnelle pour l'ère de l'IA", homeLead: "Je construis", homeBody: "Votre ordinateur et votre IA devraient comprendre ce sur quoi vous travaillez, retenir ce qui compte et vous aider à reprendre là où vous vous êtes arrêté. Avant Know, j'ai créé Celeste et travaillé sur l'infrastructure financière pour les agents IA avec Payle, Ceilya et Noesia ; ce travail continue avec Know Layer.", aboutLead: "Mattia Ciuni construit Know Computer, une couche de contexte personnelle pour l'ère de l'IA.", aboutBody: "Un fondateur italien qui travaille sur le contexte, la mémoire et les autorisations pour aider les ordinateurs à comprendre votre travail.", workLead: "Je construis les systèmes qui permettent aux logiciels d'agir dans le monde réel.", workBody: "Le fil conducteur est le contexte et la continuité : aider les ordinateurs et l'IA à comprendre ce qui compte pour que les personnes avancent.", shortThoughts: "Réflexions sur le contexte, l'IA et la construction de Know Computer.", longNotes: "Des textes plus longs sur le contexte, l'IA et la construction de systèmes durables.", feedbackLead: "Vous partagez ce que vous voyez. Le produit s'améliore. Je le publie.", feedbackBody: "Un registre public des personnes qui observent le travail et des corrections retenues après examen.", subscribe: "S'inscrire", email: "Adresse e-mail", sendFeedback: "Envoyer un retour", language: "Langue", feed: "Flux", careers: "Carrières",
  },
  es: {
    home: "Inicio", about: "Sobre mí", work: "Trabajo", thoughts: "Ideas", notes: "Notas", feedback: "Comentarios", newsletter: "Newsletter", link: "Enlaces", privacy: "Privacidad", terms: "Términos del servicio", cookies: "Cookies", legal: "Centro legal", back: "Volver al inicio", choose: "Selecciona tu idioma preferido", detected: (language: string) => `Hemos detectado que navegas en ${language}. ¿Prefieres ver el sitio en`, switchTo: (language: string) => `Cambiar a ${language}`, dismiss: "Cerrar sugerencia de idioma", close: "Cerrar",    founder: "Founder & CEO at Know Computer, una capa de contexto personal para la era de la IA.", homeTitle: "Know Computer, una capa de contexto personal para la era de la IA", homeLead: "Estoy construyendo", homeBody: "Tu ordenador y tu IA deberían entender en qué trabajas, recordar lo que importa y ayudarte a retomar donde lo dejaste. Antes de Know construí Celeste y trabajé en infraestructura financiera para agentes de IA con Payle, Ceilya y Noesia; ese trabajo continúa con Know Layer.", aboutLead: "Mattia Ciuni está construyendo Know Computer, una capa de contexto personal para la era de la IA.", aboutBody: "Un fundador italiano que trabaja en el contexto, la memoria y los permisos que permiten a un ordenador entender en qué trabajas y ayudarte a continuar.", workLead: "Construyo sistemas que permiten al software actuar en el mundo real.", workBody: "El hilo conductor es el contexto y la continuidad: ayudar a los ordenadores y la IA a entender lo que importa para que las personas retomen donde lo dejaron.", shortThoughts: "Ideas sobre contexto, IA y la construcción de Know Computer.", longNotes: "Textos más largos sobre contexto, IA y cómo construir cosas duraderas.", feedbackLead: "Compartes lo que ves. El producto mejora. Yo lo publico.", feedbackBody: "Un registro público de las personas que observan el trabajo y de las correcciones que superan la revisión.", subscribe: "Suscribirse", email: "Correo electrónico", sendFeedback: "Enviar comentarios", language: "Idioma", feed: "Feed", careers: "Trabaja conmigo",
  },
  de: {
    home: "Startseite", about: "Über mich", work: "Arbeit", thoughts: "Gedanken", notes: "Notizen", feedback: "Feedback", newsletter: "Newsletter", link: "Links", privacy: "Datenschutz", terms: "Nutzungsbedingungen", cookies: "Cookies", legal: "Rechtliches", back: "Zur Startseite", choose: "Bevorzugte Sprache auswählen", detected: (language: string) => `Wir haben erkannt, dass du auf ${language} surfst. Möchtest du die Website auf`, switchTo: (language: string) => `Zu ${language} wechseln`, dismiss: "Sprachvorschlag schließen", close: "Schließen",    founder: "Founder & CEO at Know Computer, eine persönliche Kontextschicht für das KI-Zeitalter.", homeTitle: "Know Computer, eine persönliche Kontextschicht für das KI-Zeitalter", homeLead: "Ich entwickle", homeBody: "Dein Computer und deine KI sollten verstehen, woran du arbeitest, sich merken, was wichtig ist, und dir helfen, dort weiterzumachen, wo du aufgehört hast. Vor Know habe ich Celeste gebaut und an Finanzinfrastruktur für KI-Agenten mit Payle, Ceilya und Noesia gearbeitet; diese Arbeit geht mit Know Layer weiter.", aboutLead: "Mattia Ciuni baut Know Computer, eine persönliche Kontextschicht für das KI-Zeitalter.", aboutBody: "Ein italienischer Gründer, der an Kontext, Gedächtnis und Berechtigungen arbeitet, damit dein Computer versteht, woran du arbeitest.", workLead: "Ich entwickle Systeme, mit denen Software in der realen Welt handeln kann.", workBody: "Der rote Faden ist Kontext und Kontinuität: Computern und KI helfen zu verstehen, was wichtig ist, damit Menschen weitermachen können.", shortThoughts: "Gedanken über Kontext, KI und den Aufbau von Know Computer.", longNotes: "Längere, langsamere Texte über Kontext, KI und dauerhafte Systeme.", feedbackLead: "Du teilst, was du siehst. Es wird besser. Ich veröffentliche es.", feedbackBody: "Ein öffentliches Protokoll der Menschen, die die Arbeit beobachten, und der Korrekturen, die die Prüfung überstehen.", subscribe: "Abonnieren", email: "E-Mail-Adresse", sendFeedback: "Feedback senden", language: "Sprache", feed: "Feed", careers: "Karriere",
  },
} as const;

export const copy = Object.fromEntries(
  LOCALES.map((locale) => [locale, { ...baseCopy[locale], ...(cmsCopyOverrides[locale] || {}) }]),
) as typeof baseCopy;

export type Copy = (typeof copy)[Locale];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function localizedPath(locale: Locale, pathname: string): string {
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `/${locale}${clean === "/" ? "" : clean}`;
}

/**
 * Registra la lingua scelta, così il suggerimento non riappare a ogni pagina.
 * Sta in un modulo separato perché tocca `Date.now()`: una chiamata impura nel
 * corpo di un componente (o in una funzione referenziata dal render) è quello
 * che la regola di purità del compiler segnala. Il confine del modulo è anche
 * il confine dell'impurità.
 */
export function saveLanguageChoice(locale: Locale): void {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify({ locale, dismissedAt: Date.now() }));
  } catch {
    // Storage pieno o non disponibile: la scelta vale per questa pagina e basta.
  }
}
