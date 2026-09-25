// GET /media/<key> — serve un file del bucket R2.
//
// Il bucket non e' pubblico: i file passano da qui. Il motivo e' che
// `_headers` di Cloudflare Pages vale solo per l'asset statico, e senza questo
// passaggio ogni media caricata dal pannello arriverebbe al browser senza
// `Content-Type` affidabile ne' cache policy, e un upload finito in `public/`
// finirebbe dentro `out/` dove verrebbe servito con le regole sbagliate.
//
// Il percorso arriva gia' decodificato da `params.path` come segmenti uniti da
// `/`, quindi qui non si ricostruisce nulla: si prende il segmentato dal binding
// e si rifiuta qualsiasi percorso che perda il prefisso `content/`.

// @ts-expect-error Pages bundles extensionless function imports; Node's native loader needs `.ts`.
import { contentTypeFor, isAllowedContentType, kindForName, extensionOf } from "../../lib/media.ts";

interface R2ObjectBody {
  key?: string;
  size?: number;
  body?: ReadableStream | null;
  httpMetadata?: { contentType?: string };
  uploaded?: Date;
}

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
}

interface PagesContext {
  request: Request;
  env: { MEDIA?: R2Bucket };
}

function notFound(): Response {
  return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}

export const onRequestGet = async ({ request, env }: PagesContext): Promise<Response> => {
  const bucket = env.MEDIA;
  if (!bucket) return new Response("Media storage is not configured.", { status: 503, headers: { "cache-control": "no-store" } });

  const url = new URL(request.url);
  const raw = url.pathname.replace(/^\/media\//, "");
  // Decodifica una volta sola e normalizza: `%2e%2e` deve diventare `..` **prima**
  // del controllo, altrimenti un doppio encoding passerebbe la validazione.
  let key: string;
  try {
    key = decodeURIComponent(raw);
  } catch {
    return notFound();
  }
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("\0")) return notFound();
  if (!key.startsWith("content/")) return notFound();

  const object = await bucket.get(key);
  if (!object || !object.body) return notFound();

  // Il MIME serve calcolato dall'estensione, non preso da `httpMetadata`: quel
  // campo lo scrive chi ha caricato il file, e un bucket con un solo tipo
  // sbagliato in metadati trasformerebbe ogni immagine in un download.
  const name = key.split("/").pop() || "";
  const kind = kindForName(name);
  if (!kind) return notFound();
  const declared = object.httpMetadata?.contentType || "";
  if (declared && !isAllowedContentType(kind, declared)) return notFound();
  const contentType = contentTypeFor(kind);
  if (!contentType) return notFound();

  const headers = new Headers({
    "content-type": contentType,
    // Il nome puo' contenere solo [a-zA-Z0-9._-] (validato al caricamento), ma
    // si mette in ascii perche' un header non puo' portare caratteri non latin1
    // e il download deve avere il nome giusto.
    "content-disposition": `inline; filename="${extensionOf(name) ? name : "file"}"`,
    // Le chiavi R2 contengono gia' una versione univoca del nome, quindi un
    // cambio di contenuto cambia la chiave e il file puo' durare un anno.
    "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    "cross-origin-resource-policy": "same-origin",
  });

  return new Response(object.body, { status: 200, headers });
};

export const onRequestHead = async (context: PagesContext): Promise<Response> => {
  const response = await onRequestGet(context);
  return new Response(null, { status: response.status, headers: response.headers });
};
