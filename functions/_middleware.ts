/**
 * L'unico codice del sito: una Pages Function (`functions/_middleware.ts`).
 *
 * Fa due cose che gli asset statici da soli non sanno fare, e niente altro.
 *
 * 1 · **Negoziazione markdown.** `Accept: text/markdown` su una pagina riceve la
 *     card `.md` di quella pagina — la stessa che il sito pubblica, quella che la
 *     `<head>` annuncia con `rel="alternate"` e che il piè di pagina nomina — con
 *     il tipo giusto e il conteggio dei token. Non è una conversione fatta al
 *     momento: quella sarebbe un secondo modo di dire la stessa pagina, e prima o
 *     poi direbbe qualcosa di diverso (le card si generano dall'HTML appena
 *     esportato, non da un template a parte).
 *
 * 2 · **Il dominio segue l'host che serve la pagina.** L'export nasce per un
 *     dominio (`SITE_ORIGIN`, via `NEXT_PUBLIC_SITE_URL`), ma chi risponde può
 *     essere un altro: il progetto Pages, un dominio custom, un deploy di
 *     anteprima. Qui gli indirizzi assoluti che il file dichiara — `canonical`,
 *     `og:url`, `og:image`, JSON-LD, `<loc>` delle sitemap, il `Sitemap:` di
 *     robots.txt, i link delle card — vengono riscritti con l'host che sta
 *     servendo davvero. È la cura del guasto del 2026-09-21: il sito dichiarava
 *     `https://mattiaciuni.xyz` (che non esiste in DNS) mentre rispondeva su un
 *     altro host, e Discord e X non mostravano nessuna anteprima perché chiedevano
 *     la card a un dominio inesistente. Con `SITE_URL` impostata nel progetto il
 *     dominio si **fissa** invece di seguire l'host: è quello che si vuole quando
 *     esiste un dominio custom e il `.pages.dev` deve rimandare a lui.
 *
 * Tutto il resto passa agli asset, come se questa funzione non ci fosse: gli
 * header di `public/_headers`, il 404, le regole di `_redirects`. E grazie a
 * `public/_routes.json` la funzione **non viene nemmeno invocata** per immagini,
 * CSS, font e JS.
 */
import { SITE_ORIGIN } from "../lib/site-origin";

/** Il minimo che serve: gli asset del progetto e le variabili d'ambiente. */
interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Se c'è, il dominio dichiarato non segue l'host: è questo. */
  SITE_URL?: string;
}

interface Context {
  request: Request;
  env: Env;
  next(): Promise<Response>;
}

/** Risposte in cui possono comparire indirizzi assoluti del sito. */
const TEXTUAL =
  /^(?:text\/|application\/(?:xml|rss\+xml|json|linkset\+json|xhtml\+xml))/i;

/** Quanto `text/markdown` batte `text/html`, tenendo conto dei `q=`. */
function prefersMarkdown(accept: string): boolean {
  const q = (type: string) => {
    const list = accept.split(",");
    const i = list.map((s) => s.trim().split(";")[0].toLowerCase()).indexOf(type);
    if (i === -1) return null;
    const m = (list[i] || "").match(/;\s*q=([0-9.]+)/i);
    return m ? Number(m[1]) : 1;
  };
  const md = q("text/markdown");
  if (md === null || md === 0) return false;
  const html = q("text/html");
  // Nessun HTML nella lista: l'agente ha chiesto markdown e basta.
  return html === null || md > html;
}

/** `/thoughts/<slug>/` → `/thoughts/<slug>.md`; `/` → `/index.md`. */
function cardOf(pathname: string): string {
  const clean = pathname.replace(/\/+$/, "");
  return clean === "" ? "/index.md" : clean + ".md";
}

/** L'host che deve comparire negli indirizzi dichiarati: quello che serve la pagina. */
function servingOrigin(url: URL, env: Env): string {
  return (env.SITE_URL || "").replace(/\/+$/, "") || url.origin;
}

/** Scambia il dominio per cui l'export è nato con quello che sta servendo. */
function followHost(body: string, origin: string): string {
  if (origin === SITE_ORIGIN) return body;
  return body.split(SITE_ORIGIN).join(origin);
}

export const onRequest = async (context: Context): Promise<Response> => {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const origin = servingOrigin(url, env);

  // Sotto un percorso privato non esiste nessuna card, e va detto **qui**, non
  // solo nel generatore: il file è sparito dall'export, ma la copia che l'edge
  // aveva già in cache continua a rispondere per il resto della sua scadenza
  // (`admin/feedback.md` ha servito il markdown della dashboard per mezz'ora dopo
  // il deploy), e `env.ASSETS.fetch()` la ritrovava anche dopo.
  //
  // Quindi due regole, non una. La prima: il file si nega, anche con la barra
  // finale, e la risposta arriva prima di guardare gli asset. La seconda, che
  // conta di più: su un percorso privato la **negoziazione markdown non si fa
  // proprio** — senza, `/admin/feedback/` con `Accept: text/markdown` serviva
  // ancora la card via `ASSETS`, cioè lo stesso contenuto da un altro indirizzo.
  // Vale per ogni card futura, non solo per quella cancellata oggi.
  const privatePath = url.pathname.replace(/\/+$/, "").toLowerCase();
  const isPrivate = privatePath === "/admin" || privatePath.startsWith("/admin/");
  const isNda = privatePath === "/nda";

  // `/nda` is not a public landing page. Only an invite URL generated from the
  // admin workspace may reach the client gate; a guessed or shared bare path
  // must fail before the static export is served.
  if (isNda && !url.searchParams.get("token")) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        "Referrer-Policy": "no-referrer",
      },
    });
  }

  if (isPrivate && privatePath.endsWith(".md")) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  if (!isPrivate && prefersMarkdown(request.headers.get("Accept") || "")) {
    const card = await env.ASSETS.fetch(
      new Request(new URL(cardOf(url.pathname), url), { headers: { Accept: "*/*" } }),
    );
    // `card.ok` falso significa "questa pagina non ha una card": si torna agli
    // asset (immagini, .xml, .txt) invece di inventare un markdown che non c'è.
    if (card.ok) {
      const body = followHost(await card.text(), origin);
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          Vary: "Accept",
          "x-markdown-tokens": String(Math.ceil(body.length / 4)),
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  }

  const res = await next();
  const type = res.headers.get("Content-Type") || "";
  if (!TEXTUAL.test(type)) return res;

  const headers = new Headers(res.headers);
  // Il corpo viene ricostruito, quindi la codifica e la lunghezza della risposta
  // originale non valgono più: una `Content-Encoding: br` con dentro testo già
  // decodificato è un file corrotto.
  headers.delete("Content-Encoding");
  headers.delete("Content-Length");
  // `Vary: Accept` anche sulla risposta HTML: senza, un deposito intermedio
  // servirebbe il markdown a un browser (o il contrario) alla prima richiesta.
  if (type.includes("text/html")) headers.set("Vary", "Accept");
  return new Response(followHost(await res.text(), origin), {
    status: res.status,
    headers,
  });
};
