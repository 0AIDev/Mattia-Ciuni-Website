/**
 * Tipi e validazione della libreria media.
 *
 * I file vivono in un bucket R2 e sono serviti da `functions/media/[...path].ts`.
 * Questo modulo non fa I/O: contiene solo cio' che devono sapere sia il
 * pannello sia la Function pubblica, cosi' una regola di validazione non puo'
 * divergere fra le due.
 *
 * Il percorso pubblico di un file e' `/media/<key>`, non il nome grezzo: la
 * chiave R2 puo' contenere sottocartelle (`2026/09/raj.mp3`) mentre l'URL resta
 * stabile e prevedibile.
 */

export type MediaKind = "image" | "audio" | "video" | "pdf" | "other";

export type MediaItem = {
  /** Chiave R2, unica e stabile. Diventa il percorso pubblico. */
  key: string;
  /** Nome originale mostrato nel pannello. */
  name: string;
  kind: MediaKind;
  contentType: string;
  size: number;
  /** Testo alternativo. Obbligatorio per le immagini: un' immagine senza alt non e' accessibile. */
  alt?: string;
  caption?: string;
  uploadedAt?: string;
  url?: string;
};

export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;

/**
 * Estensioni accettate per tipo. La lista e' deliberatamente chiusa: un bucket
 * pubblico che accetta `.html` o `.svg` serve contenuto attivo dallo stesso
 * dominio del sito, e da li' un `<script>` diventa XSS con il tuo cookie di
 * sessione. Le immagini vettoriali si caricano come PNG.
 */
const EXTENSION_KINDS: Record<string, MediaKind> = {
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  avif: "image",
  gif: "image",
  mp3: "audio",
  m4a: "audio",
  wav: "audio",
  ogg: "audio",
  webm: "video",
  mp4: "video",
  pdf: "pdf",
};

const CONTENT_TYPES: Record<MediaKind, string[]> = {
  image: ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"],
  audio: ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg"],
  video: ["video/webm", "video/mp4"],
  pdf: ["application/pdf"],
  other: [],
};

export function extensionOf(name: string): string {
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index + 1).toLowerCase();
}

export function kindForName(name: string): MediaKind | null {
  return EXTENSION_KINDS[extensionOf(name)] ?? null;
}

export function isAllowedContentType(kind: MediaKind, declared: string): boolean {
  return CONTENT_TYPES[kind].includes(declared.split(";")[0]?.trim() || "");
}

/**
 * Il MIME con cui il file viene **servito**, non quello dichiarato dal browser.
 *
 * Un file rinominato passa insieme al suo `Content-Type` originale, quindi il
 * tipo dichiarato non e' fidato: si controlla che sia plausibile per
 * l'estensione, e da quel momento si serve il primo MIME della lista, che e'
 * quello che l'estensione promette. Un `.png` dichiarato come `text/html` non
 * viene servito come HTML.
 */
export function contentTypeFor(kind: MediaKind): string | null {
  return CONTENT_TYPES[kind][0] ?? null;
}

/**
 * Una chiave non puo' uscire dal suo prefisso. Senza questo controllo un
 * `../` nel nome trasformerebbe un upload in scrittura arbitraria nel bucket.
 */
export function safeMediaKey(name: string): string | null {
  const cleaned = name.trim().replace(/\\/g, "/").split("/").pop() || "";
  if (!cleaned || cleaned.length > 160) return null;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(cleaned)) return null;
  if (cleaned.includes("..")) return null;
  const kind = kindForName(cleaned);
  if (!kind) return null;
  return `content/${cleaned}`;
}

export function mediaUrl(key: string): string {
  return `/media/${key}`;
}

export function formatBytes(size: number): string {
  if (!Number.isFinite(size) || size < 0) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
