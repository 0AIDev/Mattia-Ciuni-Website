export const LOCALES = ["en", "it", "fr", "es", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export const localeMeta: Record<Locale, { label: string; native: string; country: string }> = {
  en: { label: "English", native: "English", country: "US" },
  it: { label: "Italian", native: "Italiano", country: "IT" },
  fr: { label: "French", native: "Français", country: "FR" },
  es: { label: "Spanish", native: "Español", country: "ES" },
  de: { label: "German", native: "Deutsch", country: "DE" },
};

export const copy = {
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
    founder: "Founder & CEO at Payle, the money layer for AI agents.",
    homeLead: "I am building the money layer for AI agents at Payle.",
    homeBody: "AI agents can already research, compare and execute entire tasks. Then they stop and ask for a credit card. Payle gives each agent scoped permissions, deterministic authorization and a verifiable receipt for every transaction.",
    aboutLead: "Mattia Ciuni is building the money layer for AI agents.",
    aboutBody: "An Italian founder working on the rules, authorization and receipts that let software act and spend on behalf of people.",
    workLead: "I build the systems that let software act in the real world.",
    workBody: "The common thread is controlled delegation: software can act, but its permissions remain explicit, bounded and accountable.",
    shortThoughts: "Thoughts on AI agents, payments and building Payle.",
    longNotes: "Longer, slower pieces on AI agents, payments and how to build things that last.",
    feedbackLead: "You share what you see. It gets better. I publish it.",
    feedbackBody: "A public record of the people paying attention to Payle and the corrections that survive review.",
    subscribe: "Subscribe",
    email: "Email address",
    sendFeedback: "Send feedback",
    language: "Language",
  },
  it: {
    home: "Home", about: "Chi sono", work: "Lavoro", thoughts: "Pensieri", notes: "Note", feedback: "Feedback", newsletter: "Newsletter", link: "Link", privacy: "Privacy", terms: "Termini di servizio", cookies: "Cookie", legal: "Centro legale", back: "Torna alla home", choose: "Seleziona la lingua preferita", detected: (language: string) => `Abbiamo notato che stai navigando in ${language}. Preferiresti visualizzare il sito in`, switchTo: (language: string) => `Passa a ${language}`, dismiss: "Chiudi suggerimento lingua", close: "Chiudi", founder: "Founder & CEO at Payle, il money layer per gli agenti AI.", homeLead: "Sto costruendo il money layer per gli agenti AI in Payle.", homeBody: "Gli agenti AI possono già cercare, confrontare ed eseguire intere attività. Poi si fermano e chiedono una carta di credito. Payle assegna permessi limitati, autorizzazione deterministica e una ricevuta verificabile per ogni transazione.", aboutLead: "Mattia Ciuni sta costruendo il money layer per gli agenti AI.", aboutBody: "Un founder italiano che lavora su regole, autorizzazione e ricevute per permettere al software di agire e spendere per conto delle persone.", workLead: "Costruisco sistemi che permettono al software di agire nel mondo reale.", workBody: "Il filo comune è la delega controllata: il software può agire, ma i suoi permessi restano espliciti, limitati e verificabili.", shortThoughts: "Pensieri su agenti AI, pagamenti e costruire Payle.", longNotes: "Note più lunghe e lente su agenti AI, pagamenti e come costruire cose che durano.", feedbackLead: "Condividi ciò che vedi. Il prodotto migliora. Io lo pubblico.", feedbackBody: "Un registro pubblico delle persone che osservano Payle e delle correzioni che superano la revisione.", subscribe: "Iscriviti", email: "Indirizzo email", sendFeedback: "Invia feedback", language: "Lingua",
  },
  fr: {
    home: "Accueil", about: "À propos", work: "Travail", thoughts: "Réflexions", notes: "Notes", feedback: "Retours", newsletter: "Newsletter", link: "Liens", privacy: "Politique de confidentialité", terms: "Conditions", cookies: "Cookies", legal: "Centre juridique", back: "Retour à l'accueil", choose: "Choisissez votre langue préférée", detected: (language: string) => `Nous avons remarqué que vous naviguez en ${language}. Préférez-vous voir le site en`, switchTo: (language: string) => `Passer en ${language}`, dismiss: "Fermer la suggestion de langue", close: "Fermer", founder: "Founder & CEO at Payle, la couche financière des agents IA.", homeLead: "Je construis la couche financière des agents IA chez Payle.", homeBody: "Les agents IA peuvent déjà rechercher, comparer et exécuter des tâches. Puis ils s'arrêtent et demandent une carte bancaire. Payle fournit des permissions limitées, une autorisation déterministe et un reçu vérifiable pour chaque transaction.", aboutLead: "Mattia Ciuni construit la couche financière des agents IA.", aboutBody: "Un fondateur italien qui travaille sur les règles, l'autorisation et les reçus permettant aux logiciels d'agir et de dépenser pour les personnes.", workLead: "Je construis les systèmes qui permettent aux logiciels d'agir dans le monde réel.", workBody: "Le fil conducteur est la délégation contrôlée : le logiciel peut agir, mais ses permissions restent explicites, limitées et vérifiables.", shortThoughts: "Réflexions sur les agents IA, les paiements et la construction de Payle.", longNotes: "Des textes plus longs sur les agents IA, les paiements et la construction de systèmes durables.", feedbackLead: "Vous partagez ce que vous voyez. Le produit s'améliore. Je le publie.", feedbackBody: "Un registre public des personnes qui observent Payle et des corrections retenues après examen.", subscribe: "S'inscrire", email: "Adresse e-mail", sendFeedback: "Envoyer un retour", language: "Langue",
  },
  es: {
    home: "Inicio", about: "Sobre mí", work: "Trabajo", thoughts: "Ideas", notes: "Notas", feedback: "Comentarios", newsletter: "Newsletter", link: "Enlaces", privacy: "Privacidad", terms: "Términos del servicio", cookies: "Cookies", legal: "Centro legal", back: "Volver al inicio", choose: "Selecciona tu idioma preferido", detected: (language: string) => `Hemos detectado que navegas en ${language}. ¿Prefieres ver el sitio en`, switchTo: (language: string) => `Cambiar a ${language}`, dismiss: "Cerrar sugerencia de idioma", close: "Cerrar", founder: "Founder & CEO at Payle, la capa de dinero para agentes de IA.", homeLead: "Estoy construyendo la capa de dinero para agentes de IA en Payle.", homeBody: "Los agentes de IA ya pueden investigar, comparar y ejecutar tareas completas. Después se detienen y piden una tarjeta. Payle ofrece permisos limitados, autorización determinista y un recibo verificable para cada transacción.", aboutLead: "Mattia Ciuni está construyendo la capa de dinero para agentes de IA.", aboutBody: "Un fundador italiano que trabaja en reglas, autorización y recibos para que el software actúe y gaste en nombre de las personas.", workLead: "Construyo sistemas que permiten al software actuar en el mundo real.", workBody: "El hilo conductor es la delegación controlada: el software puede actuar, pero sus permisos siguen siendo explícitos, limitados y verificables.", shortThoughts: "Ideas sobre agentes de IA, pagos y la construcción de Payle.", longNotes: "Textos más largos sobre agentes de IA, pagos y cómo construir cosas duraderas.", feedbackLead: "Compartes lo que ves. El producto mejora. Yo lo publico.", feedbackBody: "Un registro público de las personas que observan Payle y de las correcciones que superan la revisión.", subscribe: "Suscribirse", email: "Correo electrónico", sendFeedback: "Enviar comentarios", language: "Idioma",
  },
  de: {
    home: "Startseite", about: "Über mich", work: "Arbeit", thoughts: "Gedanken", notes: "Notizen", feedback: "Feedback", newsletter: "Newsletter", link: "Links", privacy: "Datenschutz", terms: "Nutzungsbedingungen", cookies: "Cookies", legal: "Rechtliches", back: "Zur Startseite", choose: "Bevorzugte Sprache auswählen", detected: (language: string) => `Wir haben erkannt, dass du auf ${language} surfst. Möchtest du die Website auf`, switchTo: (language: string) => `Zu ${language} wechseln`, dismiss: "Sprachvorschlag schließen", close: "Schließen", founder: "Founder & CEO at Payle, die Geldschicht für KI-Agenten.", homeLead: "Ich entwickle bei Payle die Geldschicht für KI-Agenten.", homeBody: "KI-Agenten können bereits recherchieren, vergleichen und ganze Aufgaben ausführen. Dann stoppen sie und verlangen eine Kreditkarte. Payle bietet begrenzte Berechtigungen, deterministische Autorisierung und einen überprüfbaren Beleg für jede Transaktion.", aboutLead: "Mattia Ciuni entwickelt die Geldschicht für KI-Agenten.", aboutBody: "Ein italienischer Gründer, der an Regeln, Autorisierung und Belegen arbeitet, damit Software im Namen von Menschen handeln und ausgeben kann.", workLead: "Ich entwickle Systeme, mit denen Software in der realen Welt handeln kann.", workBody: "Der rote Faden ist kontrollierte Delegation: Software kann handeln, aber ihre Berechtigungen bleiben explizit, begrenzt und nachvollziehbar.", shortThoughts: "Gedanken über KI-Agenten, Zahlungen und den Aufbau von Payle.", longNotes: "Längere, langsamere Texte über KI-Agenten, Zahlungen und dauerhafte Systeme.", feedbackLead: "Du teilst, was du siehst. Es wird besser. Ich veröffentliche es.", feedbackBody: "Ein öffentliches Protokoll der Menschen, die Payle beobachten, und der Korrekturen, die die Prüfung überstehen.", subscribe: "Abonnieren", email: "E-Mail-Adresse", sendFeedback: "Feedback senden", language: "Sprache",
  },
} as const;

export type Copy = (typeof copy)[Locale];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function localizedPath(locale: Locale, pathname: string): string {
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `/${locale}${clean === "/" ? "" : clean}`;
}
