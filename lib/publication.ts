/**
 * Quando un pezzo diventa pubblico.
 *
 * Il sito è statico, quindi una data nel futuro non si sblocca da sola: il
 * pezzo è scritto, revisionato e committato **oggi**, e resta invisibile
 * finché il giorno non arriva. La build che gira quel giorno lo esporta, e
 * nient'altro cambia. Così il piano editoriale vive nel repository invece che
 * in un calendario a parte, e la revisione ha tutto lo spazio che vuole: un
 * pezzo con data futura è una bozza che si vede, non una pagina pubblicata.
 *
 * Pubblicare in blocco sarebbe stato il contrario di quello che serve. Trenta
 * URL nuovi lo stesso giorno su un dominio di due settimane sono il segnale
 * con cui i motori riconoscono un sito che gonfia il proprio numero di
 * pagine, ed è esattamente la cosa che il dominio non si può permettere
 * mentre il cambio di indirizzo è ancora in corso.
 *
 * La regola è una sola, `date <= oggi`, e `date` è già il campo che il resto
 * del sito usa per ordinare, per il sitemap, per il feed e per le liste
 * correlate. Non esiste un secondo calendario da tenere allineato al primo.
 *
 * `scripts/verify.js` non può importare TypeScript: legge i registri come
 * testo e ricava da sé la stessa regola. Due copie della stessa verità sono un
 * rischio noto, ed è per questo che il controllo che confronta il numero di
 * pagine esportate con il numero di pezzi pubblicati resta al suo posto: se il
 * filtro e la sua copia si separano, quel controllo cade e lo dice.
 */

/** Il giorno di questa build, in UTC. Calcolato una volta, non a ogni pezzo:
 *  un pezzo che si pubblica mentre la build attraversa la mezzanotte deve
 *  avere una risposta sola. */
const BUILD_DAY = new Date().toISOString().slice(0, 10);

/** Un pezzo è pubblico quando la sua data è arrivata. */
export function isPublished(date: string): boolean {
  return date <= BUILD_DAY;
}

/** I pezzi che questa build pubblica, cioè quelli con la data di oggi. */
export function isNewToday(date: string): boolean {
  return date === BUILD_DAY;
}

export const buildDay = BUILD_DAY;
