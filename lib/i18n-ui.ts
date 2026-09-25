import type { Locale } from "@/lib/i18n";
import { cmsUiOverrides } from "@/lib/generated/cms-copy";

type LegalCopy = {
  privacy: [string, string];
  terms: [string, string];
  cookies: [string, string];
  legal: [string, string];
  newsletter: [string, string];
};

export type UiCopy = {
  careers: string;
  home: string;
  back: string;
  allNotes: string;
  allFeedback: string;
  inProgress: string;
  published: string;
  whatPeopleSay: string;
  feedbackHero: string;
  workHero: string;
  celeste: string;
  celesteBody: string;
  aboutWhat: string;
  newsletterBody: string;
  searchRoles: string;
  filterRoles: string;
  allRoles: string;
  open: string;
  comingSoon: string;
  noRoles: string;
  closeSearch: string;
  navigate: string;
  select: string;
  legal: LegalCopy;
};

const baseUiCopy: Record<Locale, UiCopy> = {
  en: {
    careers: "Careers", home: "Home", back: "Go back", allNotes: "All notes", allFeedback: "All feedback", inProgress: "in progress", published: "published", whatPeopleSay: "What people are saying", feedbackHero: "You share what you see. It gets better. I publish it.", workHero: "I build the systems that let software act in the real world.", celeste: "Celeste", celesteBody: "Before Payle I built Celeste, an AI browser. The experience exposed the last-ten-percent problem: an agent can complete the work and still stop at the credit card form.", aboutWhat: "What Mattia Ciuni does", newsletterBody: "One email a week: what I shipped, what broke, what I decided and why.", searchRoles: "Search roles", filterRoles: "Filter by status", allRoles: "All roles", open: "Open", comingSoon: "Coming soon", noRoles: "No roles match your search.", closeSearch: "Close role search", navigate: "navigate", select: "select",
    legal: { privacy: ["This page describes how information is handled when you visit this site.", "Only information needed for feedback, the newsletter and aggregated product improvement is collected. Analytics are subject to consent where required."], terms: ["By using this site you agree to respect its public content and the rules described here.", "The public content describes Mattia Ciuni's work and Payle. It is not financial, legal or technical advice."], cookies: ["This site uses local storage to remember preferences such as language and to avoid showing the same suggestion twice.", "Analytics tools that require consent do not start before you choose."], legal: ["This page collects the legal documents, contacts and information for Mattia Ciuni's personal site.", "For questions, write to ceo@usepayle.com."], newsletter: ["Every Sunday I send one email: what I shipped, what broke, what I decided and why.", "No spam and no growth hacks. Just the log of building Payle."] },
  },
  it: {
    careers: "Lavora con me", home: "Home", back: "Torna indietro", allNotes: "Tutte le note", allFeedback: "Tutti i feedback", inProgress: "in corso", published: "pubblicati", whatPeopleSay: "Cosa dicono le persone", feedbackHero: "Condividi ciò che vedi. Il prodotto migliora. Io lo pubblico.", workHero: "Costruisco sistemi che permettono al software di agire nel mondo reale.", celeste: "Celeste", celesteBody: "Prima di Payle ho costruito Celeste, un browser AI. L'esperienza ha mostrato il problema dell'ultimo dieci per cento: l'agente può completare il lavoro ma fermarsi davanti alla carta di credito.", aboutWhat: "Cosa fa Mattia Ciuni", newsletterBody: "Una email a settimana: cosa ho spedito, cosa si è rotto, cosa ho deciso e perché.", searchRoles: "Cerca un ruolo", filterRoles: "Filtra per stato", allRoles: "Tutti i ruoli", open: "Aperti", comingSoon: "In arrivo", noRoles: "Nessun ruolo corrisponde alla ricerca.", closeSearch: "Chiudi la ricerca dei ruoli", navigate: "naviga", select: "seleziona",
    legal: { privacy: ["Questa pagina descrive come tratto i dati quando visiti il sito.", "Raccolgo solo ciò che serve per rispondere ai feedback, gestire la newsletter e capire in forma aggregata come migliorare il sito. Gli analytics sono soggetti al consenso quando richiesto."], terms: ["Usando questo sito accetti di rispettare i contenuti pubblicati e le regole descritte qui.", "I contenuti pubblici raccontano il lavoro di Mattia Ciuni e Payle. Non costituiscono consulenza finanziaria, legale o tecnica."], cookies: ["Il sito usa storage locale per ricordare preferenze come la lingua e per evitare di mostrare due volte lo stesso suggerimento.", "Gli strumenti analytics soggetti al consenso non partono prima della tua scelta."], legal: ["Qui trovi i documenti legali, i contatti e le informazioni sul sito personale di Mattia Ciuni.", "Per domande scrivi a ceo@usepayle.com."], newsletter: ["Ogni domenica invio una email: cosa ho spedito, cosa si è rotto, cosa ho deciso e perché.", "Niente spam e nessun growth hack. Solo il log della costruzione di Payle."] },
  },
  fr: {
    careers: "Carrières", home: "Accueil", back: "Retour", allNotes: "Toutes les notes", allFeedback: "Tous les retours", inProgress: "en cours", published: "publiés", whatPeopleSay: "Ce que disent les personnes", feedbackHero: "Vous partagez ce que vous voyez. Le produit s'améliore. Je le publie.", workHero: "Je construis les systèmes qui permettent aux logiciels d'agir dans le monde réel.", celeste: "Celeste", celesteBody: "Avant Payle, j'ai créé Celeste, un navigateur IA. L'expérience a révélé le problème des dix derniers pour cent : un agent peut finir le travail puis s'arrêter au formulaire de carte bancaire.", aboutWhat: "Ce que fait Mattia Ciuni", newsletterBody: "Un e-mail par semaine : ce que j'ai livré, cassé, décidé et pourquoi.", searchRoles: "Rechercher un rôle", filterRoles: "Filtrer par statut", allRoles: "Tous les rôles", open: "Ouverts", comingSoon: "Bientôt", noRoles: "Aucun rôle ne correspond à la recherche.", closeSearch: "Fermer la recherche de postes", navigate: "naviguer", select: "sélectionner",
    legal: { privacy: ["Cette page décrit le traitement des informations lorsque vous visitez ce site.", "Seules les informations nécessaires aux retours, à la newsletter et à l'amélioration agrégée du produit sont collectées. Les analytics sont soumis au consentement lorsque nécessaire."], terms: ["En utilisant ce site, vous acceptez de respecter son contenu public et les règles décrites ici.", "Le contenu public décrit le travail de Mattia Ciuni et de Payle. Il ne constitue pas un conseil financier, juridique ou technique."], cookies: ["Ce site utilise le stockage local pour mémoriser des préférences comme la langue et éviter d'afficher deux fois la même suggestion.", "Les outils d'analytics soumis au consentement ne démarrent pas avant votre choix."], legal: ["Cette page rassemble les documents juridiques, les contacts et les informations du site personnel de Mattia Ciuni.", "Pour toute question, écrivez à ceo@usepayle.com."], newsletter: ["Chaque dimanche, j'envoie un e-mail : ce que j'ai livré, cassé, décidé et pourquoi.", "Pas de spam ni de growth hacks. Seulement le journal de la construction de Payle."] },
  },
  es: {
    careers: "Trabaja conmigo", home: "Inicio", back: "Volver", allNotes: "Todas las notas", allFeedback: "Todos los comentarios", inProgress: "en curso", published: "publicados", whatPeopleSay: "Lo que dice la gente", feedbackHero: "Compartes lo que ves. El producto mejora. Yo lo publico.", workHero: "Construyo sistemas que permiten al software actuar en el mundo real.", celeste: "Celeste", celesteBody: "Antes de Payle construí Celeste, un navegador de IA. La experiencia mostró el problema del último diez por ciento: un agente puede completar el trabajo y detenerse en el formulario de tarjeta.", aboutWhat: "Qué hace Mattia Ciuni", newsletterBody: "Un email a la semana: lo que lancé, lo que falló, lo que decidí y por qué.", searchRoles: "Buscar roles", filterRoles: "Filtrar por estado", allRoles: "Todos los roles", open: "Abiertos", comingSoon: "Próximamente", noRoles: "Ningún rol coincide con la búsqueda.", closeSearch: "Cerrar la búsqueda de puestos", navigate: "navegar", select: "seleccionar",
    legal: { privacy: ["Esta página describe cómo se gestiona la información cuando visitas este sitio.", "Solo se recopila la información necesaria para comentarios, la newsletter y la mejora agregada del producto. Los analytics requieren consentimiento cuando corresponde."], terms: ["Al usar este sitio aceptas respetar su contenido público y las reglas descritas aquí.", "El contenido público describe el trabajo de Mattia Ciuni y Payle. No constituye asesoramiento financiero, legal ni técnico."], cookies: ["Este sitio usa el almacenamiento local para recordar preferencias como el idioma y no mostrar dos veces la misma sugerencia.", "Las herramientas de analytics que requieren consentimiento no se activan antes de tu elección."], legal: ["Esta página reúne los documentos legales, contactos e información del sitio personal de Mattia Ciuni.", "Para preguntas, escribe a ceo@usepayle.com."], newsletter: ["Cada domingo envío un email: lo que lancé, lo que falló, lo que decidí y por qué.", "Sin spam ni growth hacks. Solo el registro de construir Payle."] },
  },
  de: {
    careers: "Karriere", home: "Startseite", back: "Zurück", allNotes: "Alle Notizen", allFeedback: "Gesamtes Feedback", inProgress: "in Arbeit", published: "veröffentlicht", whatPeopleSay: "Was andere sagen", feedbackHero: "Du teilst, was du siehst. Es wird besser. Ich veröffentliche es.", workHero: "Ich entwickle Systeme, mit denen Software in der realen Welt handeln kann.", celeste: "Celeste", celesteBody: "Vor Payle entwickelte ich Celeste, einen KI-Browser. Die Erfahrung zeigte das Problem der letzten zehn Prozent: Ein Agent kann die Arbeit erledigen und trotzdem am Kartenformular stoppen.", aboutWhat: "Was Mattia Ciuni macht", newsletterBody: "Eine E-Mail pro Woche: was ich gebaut, kaputt gemacht und entschieden habe und warum.", searchRoles: "Rollen suchen", filterRoles: "Nach Status filtern", allRoles: "Alle Rollen", open: "Offen", comingSoon: "Bald verfügbar", noRoles: "Keine Rolle passt zur Suche.", closeSearch: "Rollensuche schließen", navigate: "navigieren", select: "auswählen",
    legal: { privacy: ["Diese Seite beschreibt, wie Informationen verarbeitet werden, wenn du diese Website besuchst.", "Wir erheben nur Informationen, die für Feedback, den Newsletter und die aggregierte Produktverbesserung nötig sind. Analytics unterliegen, wo erforderlich, deiner Zustimmung."], terms: ["Mit der Nutzung dieser Website stimmst du zu, ihre öffentlichen Inhalte und die hier beschriebenen Regeln zu respektieren.", "Die öffentlichen Inhalte beschreiben die Arbeit von Mattia Ciuni und Payle. Sie sind keine Finanz-, Rechts- oder technische Beratung."], cookies: ["Diese Website nutzt lokalen Speicher, um Präferenzen wie die Sprache zu merken und denselben Hinweis nicht zweimal zu zeigen.", "Analytics-Tools, die eine Zustimmung benötigen, starten nicht vor deiner Auswahl."], legal: ["Diese Seite sammelt die rechtlichen Dokumente, Kontakte und Informationen zur persönlichen Website von Mattia Ciuni.", "Bei Fragen schreibe an ceo@usepayle.com."], newsletter: ["Jeden Sonntag sende ich eine E-Mail: was ich gebaut, kaputt gemacht und entschieden habe und warum.", "Kein Spam und keine Growth Hacks. Nur das Protokoll vom Aufbau von Payle."] },
  },
};

export const uiCopy = Object.fromEntries(
  (Object.keys(baseUiCopy) as Locale[]).map((locale) => [locale, { ...baseUiCopy[locale], ...(cmsUiOverrides[locale] || {}) }]),
) as Record<Locale, UiCopy>;
