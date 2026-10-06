/**
 * L'unico codice del sito: una Pages Function (`functions/_middleware.ts`).
 *
 * Fa tre cose che gli asset statici da soli non sanno fare, e niente altro.
 *
 * 1 · **Negoziazione markdown.** `Accept: text/markdown` su una pagina riceve la
 *     card `.md` di quella pagina — la stessa che il sito pubblica, quella che la
 *     `<head>` annuncia con `rel="alternate"` e che il piè di pagina nomina — con
 *     il tipo giusto e il conteggio dei token. Non è una conversione fatta al
 *     momento: quella sarebbe un secondo modo di dire la stessa pagina, e prima o
 *     poi direbbe qualcosa di diverso (le card si generano dall'HTML appena
 *     esportato, non da un template a parte).
 *
 * 2 · **Gli host che non sono più un'origine rispondono 301.** Dal 5 ottobre 2026
 *     l'origine production è il dominio proprio, `mattiaciuni.com`. Il
 *     sottodominio `mattiaciuni.pages.dev` che Cloudflare assegna al progetto
 *     continua a rispondere, perché lo ha sempre fatto e cancellarlo d'un colpo
 *     avrebbe restituito 404 a chi aveva ancora quel link: ma risponde con un
 *     301 verso l'apex, che è l'unica forma di risposta che sposta il ranking
 *     invece di perderlo. Lo stesso vale per `www`, che non è un'altra copia del
 *     sito. Le anteprima (`<hash>.mattiaciuni.pages.dev`) non sono in elenco:
 *     quelle devono restare raggiungibili.
 *
 * 3 · **Il dominio SEO production è fisso e sicuro.** L'export nasce per
 *     `SITE_ORIGIN`; gli indirizzi assoluti che il file dichiara — `canonical`,
 *     `og:url`, `og:image`, JSON-LD, `<loc>` delle sitemap e il `Sitemap:` di
 *     robots.txt — restano esattamente sull'origine dichiarata dal build.
 *     Gli host di anteprima possono ricevere l'export, ma non possono cambiare
 *     il dominio SEO con una variabile d'ambiente. `SITE_URL` resta disponibile
 *     alle API che costruiscono link applicativi, separatamente dalla
 *     configurazione SEO.
 *
 * 4 · **Il pannello admin non esiste su questo host.** Il pannello e' uno
 *     strumento di sviluppo: si apre su `localhost` con `npm run dev:pages` e
 *     su `mattiaciuni.com` risponde 404, come qualunque indirizzo che non
 *     esiste. Fino a ieri l'export conteneva la sua pagina e la proteggeva solo
 *     il TOTP: la superficie era pubblica, enumerabile, e un errore nel percorso
 *     di autenticazione era un errore nel punto piu' costoso del sito. Ora la
 *     pagina non viene nemmeno esportata (`scripts/prune-local-only.mjs`) e
 *     questa funzione chiude il percorso prima di guardare gli asset, perche' un
 *     file gia' in cache all'edge continuerebbe a rispondere per tutta la sua
 *     scadenza anche dopo che il file non c'e' piu'.
 *
 * Tutto il resto passa agli asset, come se questa funzione non ci fosse: gli
 * header di `public/_headers`, il 404, le regole di `_redirects`. E grazie a
 * `public/_routes.json` la funzione **non viene nemmeno invocata** per immagini,
 * CSS, font e JS: il 301 del punto 2 copre quindi pagine, sitemap, feed e API,
 * non i file statici, che sono gli stessi byte sotto due host e non hanno un
 * rango da difendere.
 */

/**
 * L'origine production, qui ripetuta invece che importata.
 *
 * `lib/site-origin.ts` è la fonte unica, ma non si puo' importare qui: al
 * caricamento della Function la sua validazione gira anche, e su un
 * sottodominio di anteprima `NEXT_PUBLIC_SITE_URL` non e' l'origine
 * production — l'errore che lancia farebbe cadere tutta la Function invece di
 * una riga. Il vincolo tra le due copie e' un controllo di `scripts/verify.js`,
 * che legge questo file e lo confronta con la costante.
 */
const PRODUCTION_ORIGIN = "https://mattiaciuni.com";

/**
 * Gli host che rispondono 301 verso l'origine production.
 *
 * `mattiaciuni.pages.dev` e' il sottodominio che Cloudflare ha assegnato al
 * progetto: continuera' a risolvere per sempre, e finche' risolve serve a
 * qualcosa. `www.mattiaciuni.com` e' l'alias commerciale del dominio: due nomi
 * per lo stesso sito non aiutano nessuno, quindi uno dei due deve dire
 * all'altro "e' qui".
 */
const RETIRED_HOSTS = new Set(["mattiaciuni.pages.dev", "www.mattiaciuni.com"]);

/**
 * Gli host su cui il pannello admin puo' esistere.
 *
 * Qui e' scritta una copia della regola che sta in
 * `functions/lib/admin-session.ts` (`isLoopbackRequest`), e non un import della
 * stessa: questa funzione sta davanti a ogni richiesta del sito, e un import in
 * piu' e' un modo in piu' di far cadere tutto invece di una riga. Il vincolo tra
 * le due copie e' un controllo di `scripts/verify.js`, che legge entrambi i file
 * e confronta le liste, come gia' fa per l'origine production.
 *
 * Le parentesi di IPv6 si tolgono: `new URL("http://[::1]:8788/").hostname`
 * restituisce `[::1]`, e un confronto con `::1` senza normalizzare non
 * combacerebbe mai.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isLocalRequest(url: URL): boolean {
  return LOCAL_HOSTS.has(url.hostname.toLowerCase().replace(/^\[|\]$/g, ""));
}

/**
 * Il 301, con percorso e query intatti.
 *
 * La query non si perde: `/careers/xxx/apply?ref=...` e il link del pannello
 * admin passano dei parametri che il destinatario usa, e una migrazione che
 * li taglia sembrerebbe una migrazione e sarebbe un'altra cosa.
 *
 * `max-age` breve e non `no-store`: il 301 e' permanente per il visitatore, ma
 * un giorno il ritorno a un dominio diverso non deve costare un anno di cache
 * nel suo browser.
 */
function retiredHostRedirect(url: URL): Response {
  const target = new URL(PRODUCTION_ORIGIN);
  target.pathname = url.pathname;
  target.search = url.search;
  return new Response(null, {
    status: 301,
    headers: {
      Location: target.toString(),
      "Cache-Control": "public, max-age=86400",
    },
  });
}

/** Il minimo che serve: gli asset del progetto e le variabili d'ambiente. */
interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Riservato alle API; non modifica mai il dominio SEO production. */
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

/** Il dominio dichiarato resta quello del build production. */
function preserveSeoOrigin(body: string): string {
  return body;
}

export const onRequest = async (context: Context): Promise<Response> => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Prima di tutto, e prima di ogni altra risposta: un host che non e' piu'
  // l'origine non deve ricevere contenuto. Se rispondesse 200 con le pagine
  // giuste, l'indirizzo vecchio continuerebbe a essere una copia indicizzabile
  // del sito, e il segnale che sposta il ranking — il 301 — non arriverebbe
  // mai. Il confronto e' sui nomi host, non sull'origine completa, cosi' una
  // richiesta `http://` sullo stesso host viene comunque raddrizzata dal piano
  // HTTPS di Cloudflare e non qui.
  if (RETIRED_HOSTS.has(url.hostname.toLowerCase())) {
    return retiredHostRedirect(url);
  }

  // Il ramo privato non esiste fuori da questa macchina. Prima di ogni altra
  // cosa, perche' l'ordine qui e' la garanzia: se questa riga scendesse sotto,
  // una risposta servita prima non verrebbe piu' corretta dopo.
  if (!isLocalRequest(url) && (url.pathname === "/admin" || url.pathname.startsWith("/admin/"))) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

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
      const body = preserveSeoOrigin(await card.text());
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
  return new Response(preserveSeoOrigin(await res.text()), {
    status: res.status,
    headers,
  });
};
