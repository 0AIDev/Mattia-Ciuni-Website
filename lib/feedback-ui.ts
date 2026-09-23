import type { Locale } from "@/lib/i18n";

export type FeedbackUi = {
  successTitle: string;
  success: string;
  genericError: string;
  rateLimited: string;
  tooShort: string;
  invalidEmail: string;
  title: string;
  description: string;
  close: string;
  name: string;
  email: string;
  message: string;
  reviewed: string;
  send: string;
  sending: string;
  done: string;
};

export const feedbackUi: Record<Locale, FeedbackUi> = {
  en: { successTitle: "Feedback received", success: "Thank you. Your feedback is now in review. If it is selected, I will publish it here with your name or just an initial, your choice.", genericError: "Something broke on my side. Try again in a minute.", rateLimited: "Too many submissions. Try again in a few minutes.", tooShort: "Tell me a little more about what you think.", invalidEmail: "That email doesn't look right.", title: "Give feedback", description: "Tell me what you think, what interests you, or what you'd like to see next.", close: "Close", name: "Name (optional)", email: "Email (optional)", message: "What would you like to see, try, or improve?", reviewed: "Reviewed by Mattia, published if it holds.", send: "Send feedback", sending: "Sending…", done: "Done" },
  it: { successTitle: "Feedback ricevuto", success: "Grazie. Il tuo feedback è ora in revisione. Se verrà scelto, lo pubblicherò qui con il tuo nome o solo un'iniziale, come preferisci.", genericError: "Qualcosa non ha funzionato. Riprova tra un minuto.", rateLimited: "Troppi invii. Riprova tra qualche minuto.", tooShort: "Raccontami qualcosa in più su ciò che pensi.", invalidEmail: "Questa email non sembra corretta.", title: "Lascia un feedback", description: "Dimmi cosa ne pensi, cosa ti interessa o cosa vorresti vedere dopo.", close: "Chiudi", name: "Nome (facoltativo)", email: "Email (facoltativa)", message: "Cosa vorresti vedere, provare o migliorare?", reviewed: "Revisionato da Mattia, pubblicato se supera la revisione.", send: "Invia feedback", sending: "Invio…", done: "Fatto" },
  fr: { successTitle: "Retour reçu", success: "Merci. Votre retour est maintenant en cours de lecture. S'il est retenu, je le publierai ici avec votre nom ou une initiale, selon votre choix.", genericError: "Un problème est survenu. Réessayez dans une minute.", rateLimited: "Trop d'envois. Réessayez dans quelques minutes.", tooShort: "Dites-m'en un peu plus sur votre avis.", invalidEmail: "Cette adresse e-mail ne semble pas correcte.", title: "Donner un retour", description: "Dites-moi ce que vous pensez, ce qui vous intéresse ou ce que vous aimeriez voir ensuite.", close: "Fermer", name: "Nom (facultatif)", email: "E-mail (facultatif)", message: "Que voudriez-vous voir, essayer ou améliorer ?", reviewed: "Relu par Mattia, publié après validation.", send: "Envoyer le retour", sending: "Envoi…", done: "Terminé" },
  es: { successTitle: "Comentario recibido", success: "Gracias. Tu comentario está en revisión. Si se selecciona, lo publicaré aquí con tu nombre o solo una inicial, como prefieras.", genericError: "Algo falló. Inténtalo de nuevo en un minuto.", rateLimited: "Demasiados envíos. Inténtalo de nuevo en unos minutos.", tooShort: "Cuéntame un poco más sobre lo que piensas.", invalidEmail: "Ese email no parece correcto.", title: "Enviar comentarios", description: "Cuéntame qué piensas, qué te interesa o qué te gustaría ver después.", close: "Cerrar", name: "Nombre (opcional)", email: "Email (opcional)", message: "¿Qué te gustaría ver, probar o mejorar?", reviewed: "Revisado por Mattia, se publica si supera la revisión.", send: "Enviar comentarios", sending: "Enviando…", done: "Listo" },
  de: { successTitle: "Feedback erhalten", success: "Danke. Dein Feedback wird jetzt geprüft. Wenn es ausgewählt wird, veröffentliche ich es hier mit deinem Namen oder nur einer Initiale, ganz wie du möchtest.", genericError: "Etwas ist schiefgelaufen. Versuch es in einer Minute erneut.", rateLimited: "Zu viele Einsendungen. Versuch es in ein paar Minuten erneut.", tooShort: "Erzähl mir etwas mehr darüber, was du denkst.", invalidEmail: "Diese E-Mail-Adresse scheint nicht korrekt zu sein.", title: "Feedback geben", description: "Sag mir, was du denkst, was dich interessiert oder was du als Nächstes sehen möchtest.", close: "Schließen", name: "Name (optional)", email: "E-Mail (optional)", message: "Was möchtest du sehen, ausprobieren oder verbessern?", reviewed: "Von Mattia geprüft und veröffentlicht, wenn es trägt.", send: "Feedback senden", sending: "Wird gesendet…", done: "Fertig" },
};
