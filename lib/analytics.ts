/**
 * Un solo posto da cui partono gli eventi del sito.
 *
 * Prima ogni componente chiamava `window.gtag?.("event", ...)` per conto suo:
 * nomi scritti a mano in tre file diversi, nessun modo di sapere quali eventi
 * esistono senza cercarli, e nessuna garanzia che i parametri fossero gli
 * stessi. Qui stanno i nomi, il tipo di pagina e la guardia che rende tutto
 * innocuo quando Analytics non c'è: senza consenso non esiste nessun `gtag`,
 * quindi l'evento viene semplicemente scartato.
 *
 * Consapevolmente **non** c'è una coda pre-consenso: bufferizzare gli eventi e
 * rispedirli dopo il "Allow" significherebbe tracciare prima del permesso, che
 * è esattamente ciò che non si fa. Prima del consenso si perde l'evento, ed è
 * la scelta giusta.
 *
 * Gli strumenti sono due e ognuno si carica quando può caricarsi.
 *
 * **Google Analytics 4** esiste solo dopo il consenso, quindi la sua guardia è
 * l'esistenza stessa di `window.gtag`.
 *
 * **Umami** è un contatore senza cookie e senza identificatore: non c'è niente
 * da accettare, quindi è sempre presente e riceve gli stessi eventi, `page_view`
 * escluso. Non è una dimenticanza: in Umami la pagina la registra il suo tracker,
 * che segue anche le navigazioni client-side di Next, quindi replicarla da qui
 * conterebbe due volte la stessa visita. Quello che il tracker non può sapere
 * (quanto è durata la pagina, quanto in basso è arrivata, dove è andata dopo)
 * arriva con `page_leave`, che è un evento e passa di qui come gli altri.
 *
 * **La copia nel database del sito** è la terza destinazione, e l'unica che riceve
 * tutto, `page_view` compreso: è la ragione per cui esiste. Umami e Analytics sono
 * servizi che gestisce qualcun altro e possono tagliare lo storico; questa copia
 * vive in una tabella nostra (`functions/api/collect.ts` scrive in Supabase) e non
 * dipende da nessuno. Non chiede consenso per la stessa ragione di Umami: non
 * conserva niente sul dispositivo, e il server riduce l'indirizzo IP a un hash che
 * cambia ogni giorno e non viene mai salvato.
 */

import { currentAttribution } from "@/lib/attribution";

export type Gtag = (...args: unknown[]) => void;

/**
 * Il tracker di Umami, con le sue due firme: `track(nome, dati)` manda un evento,
 * `track(fn)` riscrive una pageview. Il tipo le copre entrambe.
 */
export type Umami = {
  track: (
    nameOrFn: string | ((props: Record<string, unknown>) => Record<string, unknown>),
    data?: Record<string, unknown>,
  ) => void;
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: Gtag;
    umami?: Umami;
  }
}

/**
 * La natura della pagina, ricavata dall'indirizzo. Serve a leggere i numeri per
 * tipo di contenuto ("quanto leggono i notes" vs "quanto converte la home")
 * senza dover elencare a mano tutte le URL nei report.
 */
export type ContentKind =
  | "home"
  | "link"
  | "about"
  | "work"
  | "thoughts"
  | "thought"
  | "notes"
  | "note"
  | "feedback"
  | "feedback_post"
  | "voice_notes"
  | "videos"
  | "newsletter"
  | "legal"
  | "other";

export function contentKindOf(pathname: string): ContentKind {
  const [first, second] = pathname.split("/").filter(Boolean);
  switch (first) {
    case undefined:
      return "home";
    case "thoughts":
      return second ? "thought" : "thoughts";
    case "notes":
      return second ? "note" : "notes";
    case "feedback":
      return second ? "feedback_post" : "feedback";
    case "voice-notes":
      return "voice_notes";
    case "videos":
      return "videos";
    case "link":
      return "link";
    case "about":
      return "about";
    case "work":
      return "work";
    case "newsletter":
      return "newsletter";
    case "privacy":
    case "terms":
    case "cookies":
    case "legal":
      return "legal";
    default:
      return "other";
  }
}

/** Le due chiavi che in Umami sono proprietà della pagina, non dell'evento. */
const UMAMI_PAGE_KEYS = ["page_location", "page_title"];

/**
 * Umami accetta stringhe e numeri: un booleano arriva come stringa vuota e sparirebbe
 * dal report, un oggetto lo rompe. Qui si converte, e si butta via solo il nulla.
 */
export function forUmami(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (UMAMI_PAGE_KEYS.includes(key) || value === undefined || value === null || value === "") continue;
    if (typeof value === "number" || typeof value === "string") out[key] = value;
    else if (typeof value === "boolean") out[key] = value ? 1 : 0;
  }
  return out;
}

/* ----------------------------------------------------------------
   La copia nel database del sito

   Un lotto, non una richiesta per evento: la stessa navigazione produce
   quattro o cinque eventi in pochi secondi, e quattro richieste separate
   sarebbero quattro risvegli della Function per dire la stessa cosa. La
   coda parte da sola dopo qualche secondo, o subito quando si riempie, e
   viene svuotata a mano quando la pagina sta per chiudersi, perché quello
   è l'ultimo momento utile per dire che è finita.
   ---------------------------------------------------------------- */

const COLLECT_ENDPOINT = "/api/collect";
const COLLECT_BATCH = 20;
const COLLECT_FLUSH_MS = 3000;
/** Quanto può crescere la coda se il database non risponde: oltre, gli eventi
 *  più vecchi si buttano, perché una coda senza tetto diventa un consumo di
 *  memoria su un telefono. */
const COLLECT_MAX_QUEUE = 80;

interface CollectedEvent {
  event: string;
  at: string;
  path: string;
  kind: ContentKind;
  data: Record<string, unknown>;
}

let collectQueue: CollectedEvent[] = [];
let collectTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleCollect(): void {
  if (collectTimer !== null) return;
  collectTimer = setTimeout(() => {
    collectTimer = null;
    flushCollect();
  }, COLLECT_FLUSH_MS);
}

function enqueueCollect(event: string, params: Record<string, unknown>): void {
  const here = currentPath();
  // Lo stesso filtro di Umami va bene anche qui: valori semplici, e le due chiavi
  // della pagina fuori dai dati, perché la pagina la manda l'involucro e il server
  // ricostruisce il percorso da sé.
  const collectData: Record<string, unknown> = { ...forUmami(params) };
  for (const key of ["attribution", "first_touch", "last_touch"]) {
    if (params[key] && typeof params[key] === "object" && !Array.isArray(params[key])) collectData[key] = params[key];
  }
  collectQueue.push({ event, at: new Date().toISOString(), path: here.pathname, kind: here.kind, data: collectData });
  if (collectQueue.length > COLLECT_MAX_QUEUE) {
    collectQueue = collectQueue.slice(-COLLECT_MAX_QUEUE);
  }
  if (collectQueue.length >= COLLECT_BATCH) flushCollect();
  else scheduleCollect();
}

/**
 * Manda al database quello che è in coda.
 *
 * `beacon` è per l'uscita: quando la pagina si chiude una `fetch` normale viene
 * interrotta, mentre `sendBeacon` sopravvive alla chiusura. Se il database non
 * risponde il lotto torna in testa alla coda e riparte al giro dopo: una perdita
 * silenziosa è esattamente quello che questa copia esiste per evitare.
 */
export function flushCollect(beacon = false): void {
  if (typeof window === "undefined") return;
  if (collectTimer !== null) {
    clearTimeout(collectTimer);
    collectTimer = null;
  }
  if (!collectQueue.length) return;

  const batch = collectQueue.splice(0, COLLECT_BATCH);
  const body = JSON.stringify({ events: batch });

  if (beacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(COLLECT_ENDPOINT, new Blob([body], { type: "application/json" }));
  } else {
    try {
      fetch(COLLECT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      })
        .then((response) => {
          // Si ritenta solo su un guasto temporaneo: rete assente, errore del
          // server, o rate limit. Un 4xx dice che la richiesta è sbagliata
          // (endpoint non ancora pubblicato, corpo rifiutato) e riprovarla ogni
          // tre secondi sarebbe solo rumore, non un dato salvato.
          if (!response.ok && (response.status >= 500 || response.status === 429)) {
            throw new Error(String(response.status));
          }
        })
        .catch(() => {
          collectQueue = [...batch, ...collectQueue].slice(-COLLECT_MAX_QUEUE);
        });
    } catch {
      collectQueue = [...batch, ...collectQueue].slice(-COLLECT_MAX_QUEUE);
    }
  }

  if (collectQueue.length) scheduleCollect();
}

/**
 * Manda un evento a tutti gli strumenti presenti in pagina.
 *
 * GA4 solo con il consenso (senza consenso `window.gtag` non esiste), Umami
 * sempre, e la copia nel database del sito sempre, perché è l'unica che riceve
 * anche la pageview. Un solo punto di uscita: nessun componente sa quale
 * strumento sta ricevendo cosa.
 */
export function track(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const attribution = currentAttribution();
  const enrichedParams = {
    ...params,
    attribution: attribution.last,
    first_touch: attribution.first,
    last_touch: attribution.last,
  };
  const cleanParams = forUmami(enrichedParams);
  // Contratto per GTM futuro: evento e proprietà piatte, senza email, messaggi,
  // token o valori annidati. Il dataLayer non carica alcun vendor da solo.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...cleanParams, content_kind: cleanParams.content_kind || currentPath().kind });
  window.gtag?.("event", event, forUmami(enrichedParams));
  enqueueCollect(event, enrichedParams);
  if (event === "page_view") return;
  window.umami?.track(event, cleanParams);
}

/** La pagina corrente, per marcare gli eventi con la loro origine. */
export function currentPath(): { pathname: string; kind: ContentKind } {
  if (typeof window === "undefined") return { pathname: "/", kind: "other" };
  const pathname = window.location.pathname;
  return { pathname, kind: contentKindOf(pathname) };
}

/* ----------------------------------------------------------------
   Quanto dura una pagina e dove finisce

   Tre numeri che GA4 da solo non racconta bene: quanto tempo una
   persona ha tenuto aperta una pagina, quanto in basso è arrivata, e
   dove è andata dopo. Il tempo e il conteggio delle pagine vivono in
   `sessionStorage` perché sopravvivono a un ricaricamento ma non a
   una nuova visita; la profondità di lettura e la prossima tappa
   vivono in memoria, perché valgono solo per la pagina aperta ora.
   ---------------------------------------------------------------- */

const SESSION_PAGES_KEY = "mattia-ciuni-session-pages";
const SESSION_START_KEY = "mattia-ciuni-session-start";
const PAGE_ENTER_KEY = "mattia-ciuni-page-enter";

let maxScrollPercent = 0;
let pendingNextPage: string | null = null;

/** Da chiamare a ogni pagina mostrata: azzera i contatori e conta la tappa. */
export function markPageEnter(): void {
  if (typeof window === "undefined") return;
  maxScrollPercent = 0;
  pendingNextPage = null;
  window.sessionStorage.setItem(PAGE_ENTER_KEY, String(Date.now()));
  // L'inizio della visita si scrive una volta sola: serve a dire quanto è
  // durata la sessione intera, non solo l'ultima pagina.
  if (!window.sessionStorage.getItem(SESSION_START_KEY)) {
    window.sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
  }
  const pages = Number(window.sessionStorage.getItem(SESSION_PAGES_KEY) || "0") + 1;
  window.sessionStorage.setItem(SESSION_PAGES_KEY, String(pages));
}

/** Il punto più in basso toccato su questa pagina. */
export function markScroll(percent: number): void {
  if (percent > maxScrollPercent) maxScrollPercent = percent;
}

/**
 * Dove sta andando la persona: lo dice il click, non la pagina. Su un click
 * esterno è l'ultima cosa che registriamo prima che esca; su uno interno è la
 * pagina di arrivo, che nel page_view diventa il `from_path`.
 */
export function noteNextPage(href: string): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(href, window.location.origin);
    // Interno: la pagina di arrivo, senza parametri di campagna (che sono già
    // nell'attribuzione). Esterno: il dominio, perché l'indirizzo completo lo
    // porta già `outbound_click`.
    pendingNextPage = url.origin === window.location.origin
      ? `${url.pathname}${url.search}`.slice(0, 200)
      : url.hostname.replace(/^www\./, "");
  } catch {
    pendingNextPage = null;
  }
}

/** Il pacchetto dell'evento `page_leave`: tempo, profondità, destinazione. */
export function pageLeavePayload(at: { pathname: string; kind: ContentKind } = currentPath()): Record<string, unknown> {
  const enteredAt = Number(window.sessionStorage.getItem(PAGE_ENTER_KEY) || "0");
  const sessionStart = Number(window.sessionStorage.getItem(SESSION_START_KEY) || "0");
  const dwellSeconds = enteredAt ? Math.max(0, Math.round((Date.now() - enteredAt) / 1000)) : 0;
  return {
    content_kind: at.kind,
    page_path: at.pathname,
    dwell_seconds: dwellSeconds,
    max_scroll_percent: maxScrollPercent,
    next_page: pendingNextPage ?? "(none)",
    session_pages: Number(window.sessionStorage.getItem(SESSION_PAGES_KEY) || "0"),
    session_seconds: sessionStart ? Math.max(0, Math.round((Date.now() - sessionStart) / 1000)) : 0,
  };
}
