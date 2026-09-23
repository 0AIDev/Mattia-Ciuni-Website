import type { Locale } from "@/lib/i18n";

export type ArticleUi = {
  home: string;
  thoughts: string;
  notes: string;
  feedback: string;
  back: string;
  copyLink: string;
  copied: string;
  more: string;
  moreNotes: string;
  next: string;
  allPosts: string;
  allNotes: string;
  allFeedback: string;
  onThisPage: string;
  sendFeedback: string;
  feedbackTitle: string;
  feedbackDescription: string;
  feedbackDone: string;
  feedbackName: string;
  feedbackEmail: string;
  feedbackPlaceholder: string;
  feedbackSend: string;
  feedbackSending: string;
  feedbackReview: string;
  audio: string;
  updated: string;
  minRead: string;
  continueReading: string;
  published: string;
  feedbackReviewed: string;
  feedbackPrompt: string;
  feedbackPublished: string;
  exchange: string;
};

export const articleUi: Record<Locale, ArticleUi> = {
  en: { home: "Home", thoughts: "Thoughts", notes: "Notes", feedback: "Feedback", back: "Go back", copyLink: "Copy link", copied: "Copied", more: "More", moreNotes: "More notes", next: "Next", allPosts: "All posts", allNotes: "All notes", allFeedback: "All feedback", onThisPage: "On this page", sendFeedback: "Send your feedback", feedbackTitle: "Give feedback", feedbackDescription: "Tell me what you think, what interests you, or what you'd like to see next.", feedbackDone: "Done", feedbackName: "Name (optional)", feedbackEmail: "Email (optional)", feedbackPlaceholder: "What would you like to see, try, or improve?", feedbackSend: "Send feedback", feedbackSending: "Sending…", feedbackReview: "Reviewed by Mattia, published if it holds.", audio: "Audio player", updated: "updated", minRead: "min read", continueReading: "Continue reading", published: "published", feedbackReviewed: "Reviewed by Mattia before publication; credited your way or not at all.", feedbackPrompt: "Every submission is read and reviewed. If it holds up, it gets published here, with your name or just an initial, your choice. The next Feedback post might be about your comment.", feedbackPublished: "Published feedback exchanges", exchange: "Exchange" },
  it: { home: "Home", thoughts: "Pensieri", notes: "Note", feedback: "Feedback", back: "Torna indietro", copyLink: "Copia link", copied: "Copiato", more: "Altro", moreNotes: "Altre note", next: "Successivo", allPosts: "Tutti i post", allNotes: "Tutte le note", allFeedback: "Tutti i feedback", onThisPage: "In questa pagina", sendFeedback: "Invia il tuo feedback", feedbackTitle: "Lascia un feedback", feedbackDescription: "Dimmi cosa ne pensi, cosa ti interessa o cosa vorresti vedere dopo.", feedbackDone: "Fatto", feedbackName: "Nome (facoltativo)", feedbackEmail: "Email (facoltativa)", feedbackPlaceholder: "Cosa vorresti vedere, provare o migliorare?", feedbackSend: "Invia feedback", feedbackSending: "Invio…", feedbackReview: "Revisionato da Mattia, pubblicato se supera la revisione.", audio: "Lettore audio", updated: "aggiornato", minRead: "min di lettura", continueReading: "Continua a leggere", published: "pubblicati", feedbackReviewed: "Revisionato da Mattia prima della pubblicazione; con il credito che preferisci o senza credito.", feedbackPrompt: "Ogni invio viene letto e revisionato. Se supera la revisione, viene pubblicato qui, con il tuo nome o solo un'iniziale, come preferisci. Il prossimo post di Feedback potrebbe parlare del tuo commento.", feedbackPublished: "Feedback pubblicati", exchange: "Scambio" },
  fr: { home: "Accueil", thoughts: "Réflexions", notes: "Notes", feedback: "Retours", back: "Retour", copyLink: "Copier le lien", copied: "Copié", more: "Plus", moreNotes: "Plus de notes", next: "Suivant", allPosts: "Tous les articles", allNotes: "Toutes les notes", allFeedback: "Tous les retours", onThisPage: "Sur cette page", sendFeedback: "Envoyer votre retour", feedbackTitle: "Donner un retour", feedbackDescription: "Dites-moi ce que vous pensez, ce qui vous intéresse ou ce que vous aimeriez voir ensuite.", feedbackDone: "Terminé", feedbackName: "Nom (facultatif)", feedbackEmail: "E-mail (facultatif)", feedbackPlaceholder: "Que voudriez-vous voir, essayer ou améliorer ?", feedbackSend: "Envoyer le retour", feedbackSending: "Envoi…", feedbackReview: "Relu par Mattia, publié après validation.", audio: "Lecteur audio", updated: "mis à jour", minRead: "min de lecture", continueReading: "Poursuivre la lecture", published: "publiés", feedbackReviewed: "Relu par Mattia avant publication ; crédité comme vous le souhaitez ou sans crédit.", feedbackPrompt: "Chaque contribution est lue et relue. Si elle tient, elle est publiée ici, avec votre nom ou une simple initiale, selon votre choix. Le prochain article Feedback pourrait parler de votre commentaire.", feedbackPublished: "Retours publiés", exchange: "Échange" },
  es: { home: "Inicio", thoughts: "Ideas", notes: "Notas", feedback: "Comentarios", back: "Volver", copyLink: "Copiar enlace", copied: "Copiado", more: "Más", moreNotes: "Más notas", next: "Siguiente", allPosts: "Todas las publicaciones", allNotes: "Todas las notas", allFeedback: "Todos los comentarios", onThisPage: "En esta página", sendFeedback: "Enviar tus comentarios", feedbackTitle: "Enviar comentarios", feedbackDescription: "Cuéntame qué piensas, qué te interesa o qué te gustaría ver después.", feedbackDone: "Listo", feedbackName: "Nombre (opcional)", feedbackEmail: "Email (opcional)", feedbackPlaceholder: "¿Qué te gustaría ver, probar o mejorar?", feedbackSend: "Enviar comentarios", feedbackSending: "Enviando…", feedbackReview: "Revisado por Mattia, se publica si supera la revisión.", audio: "Reproductor de audio", updated: "actualizado", minRead: "min de lectura", continueReading: "Seguir leyendo", published: "publicados", feedbackReviewed: "Revisado por Mattia antes de publicarlo; con el crédito que prefieras o sin crédito.", feedbackPrompt: "Leo y reviso cada envío. Si resiste, se publica aquí, con tu nombre o solo una inicial, como prefieras. El próximo post de Feedback podría tratar sobre tu comentario.", feedbackPublished: "Comentarios publicados", exchange: "Intercambio" },
  de: { home: "Startseite", thoughts: "Gedanken", notes: "Notizen", feedback: "Feedback", back: "Zurück", copyLink: "Link kopieren", copied: "Kopiert", more: "Mehr", moreNotes: "Weitere Notizen", next: "Nächster", allPosts: "Alle Beiträge", allNotes: "Alle Notizen", allFeedback: "Gesamtes Feedback", onThisPage: "Auf dieser Seite", sendFeedback: "Feedback senden", feedbackTitle: "Feedback geben", feedbackDescription: "Sag mir, was du denkst, was dich interessiert oder was du als Nächstes sehen möchtest.", feedbackDone: "Fertig", feedbackName: "Name (optional)", feedbackEmail: "E-Mail (optional)", feedbackPlaceholder: "Was möchtest du sehen, ausprobieren oder verbessern?", feedbackSend: "Feedback senden", feedbackSending: "Wird gesendet…", feedbackReview: "Von Mattia geprüft und veröffentlicht, wenn es trägt.", audio: "Audioplayer", updated: "aktualisiert", minRead: "Min. Lesezeit", continueReading: "Weiterlesen", published: "veröffentlicht", feedbackReviewed: "Von Mattia vor der Veröffentlichung geprüft; mit dem gewünschten Namen oder ohne Namensnennung.", feedbackPrompt: "Jeder Beitrag wird gelesen und geprüft. Wenn er standhält, wird er hier mit deinem Namen oder nur einer Initiale veröffentlicht, ganz wie du möchtest. Im nächsten Feedback-Beitrag könnte es um deinen Kommentar gehen.", feedbackPublished: "Veröffentlichtes Feedback", exchange: "Austausch" },
};
