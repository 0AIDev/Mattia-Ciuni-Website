# Scrivere un articolo — il contratto editoriale

Un articolo, qui, non è un file markdown: è una **voce in un registro**. Questo
file dice cosa si scrive dentro, come si collega, e cosa il build pretende in
cambio. La parte SEO — chi genera cosa, file per file — sta in
[`SEO.md`](./SEO.md); l'impianto generale in [`SEO-GEO-AI.md`](./SEO-GEO-AI.md).

Il pensiero che tiene insieme tutto:

> Un articolo non è un'isola: è il posto in cui una idea tocca le altre. Le
> sezioni si possono copiare, i testi si possono seguire, e ogni articolo nomina
> almeno un altro articolo e almeno una nota — **scritto a mano nel testo**, non
> lasciato al caso.

---

## 1 · Dove si scrive

| Cosa | File | Campi |
| --- | --- | --- |
| un articolo (Thoughts) | `lib/posts.ts` | `slug`, `title`, `category`, `description`, `date`, `updated?`, `tags`, `keywords`, `content` |
| una nota (Notes) | `lib/notes.ts` | `slug`, `title`, `description`, `date`, `keywords`, `content` |

Da quella voce nascono da sole: la rotta, la testata completa (titolo,
description, canonical, OG, JSON-LD), il documento statico, la card markdown, la
riga nel sitemap e nell'RSS, l'ingresso in `llms.txt`, la tessera nella pagina
indice, e i **correlati** di tutti gli altri articoli.

| Campo | Regola |
| --- | --- |
| `slug` | minuscolo, trattini, niente date dentro: è l'indirizzo per sempre (`/thoughts/<slug>/`). Cambiarlo rompe i link che esistono |
| `title` | **Il titolo è la frase che l'articolo dimostra.** Non un'etichetta (`Money layer`) ma un'affermazione (`The money layer for AI agents`). Entro i 70 caratteri |
| `category` | `"Thoughts"` per un articolo, `"Notes"` per una nota: decide il breadcrumb e il tipo del dato strutturato |
| `description` | entro **170 caratteri**, una frase compiuta, non un elenco. È quello che si legge su Google e nella card markdown |
| `date` | `YYYY-MM-DD`, il giorno in cui esce. **Non si tocca più** |
| `updated` | solo quando si cambia la **sostanza** (una tesi, un numero, una sezione). È quello che il sitemap dichiara come `lastmod`: se lo metti ovunque, i motori smettono di crederti |
| `tags` | 2–4, le cose di cui l'articolo parla. **Pesano il triplo delle keyword** nel calcolo dei correlati |
| `keywords` | 4–6, come le cercherebbe una persona (`"AI agents payments"`, non `"AI-agent-payments"`) |

Il titolo di una **nota** è più corto e più netto di quello di un articolo: la
nota è un pensiero, l'articolo è un'argomentazione.

## 2 · Il corpo: blocchi

Il contenuto è una lista di blocchi tipizzati — nessun HTML, nessun markdown.

| Blocco | Quando |
| --- | --- |
| `{ type: "p", text }` | il testo. È il 90% |
| `{ type: "h2", text }` | una sezione. **Guarda §4**: fa nascere la voce della TOC e l'anchor |
| `{ type: "quote", text }` | quello che ha detto qualcun altro, o una definizione che vuoi isolare |
| `{ type: "list", items }` | tre o quattro cose che non sono una frase |
| `{ type: "code", lang, code }` | solo per gli articoli: un vero frammento da leggere |

Dentro `p`, `quote` e `items` c'è una **sintassi minima**:

- `**grassetto**` → grassetto per una conseguenza o un dato importante;
- `*corsivo*` → corsivo per un termine che stai definendo, o un'enfasi vera;
- `[etichetta](destinazione)` → un collegamento.

Tutto il resto è testo puro, senza titoli annidati oltre
`h2`, niente immagini dentro il corpo.

## 3 · I collegamenti — la parte che rende il blog un blog

Un articolo senza link è una pagina che nessuno attraversa. Le regole, in ordine
di forza:

1. **Ogni articolo collega almeno una nota e almeno un altro articolo, dentro il
   testo.** Non in fondo, non in una riga apposta: **nella frase in cui servono**.
   Il collegamento è un'idea che continua altrove.
2. **Le sezioni si citano.** Vuoi rimandare al punto di un altro articolo?
   `[la memoria delle intenzioni](/thoughts/money-layer-for-ai-agents/#what-agents-actually-need)`
   — e dentro il proprio articolo basta `[qui](#approval-queue-cleanup)`. Un
   indirizzo con `#` è un link **copiabile**: chi legge può mandarlo a qualcuno e
   quello arriva esattamente al paragrafo giusto.
3. **Le destinazioni interne finiscono con `/`** (`/notes/<slug>/`,
   `/thoughts/<slug>/`, `/thoughts/`). Senza, Next normalizza e il link è un
   salto in più.
4. **Un collegamento dice dove porta.** `[questa nota](/notes/<slug>/)`, non
   `[clicca qui]`. La parola linkata è il titolo o il concetto, mai un gesto.
5. **Al massimo un link per idea.** Una frase con quattro collegamenti non si
   legge: è un indice travestito.

E poi ci sono due liste che si aggiungono da sole, in fondo:

| Sezione | Cosa contiene | Da dove |
| --- | --- | --- |
| **More thoughts** (`id="more"`) | altri due articoli, affini per tag e keyword | `lib/related.ts`, dedotti |
| **Notes** (`id="notes"`) | due note | `lib/related.ts`, dedotti |

Il calcolo è volutamente semplice e leggibile: i **tag in comune valgono 3**, le
keyword in comune **1**, e a pari punteggio vince il più recente — quindi la lista
non è mai vuota. È il **ripiego**, non il lavoro: i collegamenti che contano sono
quelli che hai scritto tu nel testo, e se i correlati automatici pescano l'ovvio,
il problema è che il testo non nomina abbastanza.

## 4 · Le sezioni, la TOC e gli anchor

Ogni `h2` produce tre cose, automaticamente e senza elenchi da mantenere:

1. l'`id` dell'heading, nella forma `what-agents-actually-need` (`lib/slug.ts`);
2. una voce della **TOC** a sinistra dell'articolo (`components/TableOfContents.tsx`),
   che si compatta in trattini e si apre al passaggio del mouse, e che evidenzia
   la sezione dove ti trovi;
3. il link **copiabile** della sezione: dal titolo e dalla voce della TOC.

Due conseguenze pratiche:

- **il testo degli `h2` è un'interfaccia**, non una decorazione: finisce nella
  TOC, nell'indirizzo copiato, e in un eventuale `#anchor` scritto da un altro
  articolo. Scrivilo come una frase breve e specifica (`What agents actually
  need`), non come un'etichetta vuota (`Introduction`, `More`). E **cambiarne il
  testo cambia l'anchor**, quindi un link `#…` che puntava lì smette di
  funzionare: quando rinomini una sezione, cerca chi la cita;
- **la numerazione, se c'è, sta dentro il testo** (`Cosa fa un agente, in tre
  passi`), perché un `3.` scritto a mano nel titolo invecchia alla prima
  riorganizzazione.

`verify.js` controlla che gli anchor della TOC esistano davvero
(`post: toc anchors`): una TOC che punta a un `id` inesistente è un click che non
fa niente, ed è il tipo di guasto che si nota solo su un lettore.

## 5 · La voce, e come si riconosce un articolo di questo sito

Le regole sono poche perché il registro parla da sé:

- **una tesi per articolo**, dichiarata presto e non ripetuta. Se il titolo ne
  annuncia due, sono due articoli;
- **prima persona dove serve** (`I learned this building Celeste`): il valore di
  questo blog è che dietro c'è qualcuno che ha provato le cose;
- **un esempio concreto per sezione**, non uno per articolo: l'astratto si legge
  una volta, il caso si ricorda;
- **si finisce su una conseguenza** (cosa cambia, cosa non si può più ignorare),
  **non su un riassunto**. Il riassunto lo fa già la description;
- **niente frasi di transizione vuote** (`In questo articolo vedremo…`): si
  comincia dal punto.

## 6 · Il giorno che pubblichi

```bash
npm run build            # next build + le card markdown
node scripts/verify.js   # 56 controlli sul costruito
npm run lint
```

Poi guarda **nel costruito**, non nel sorgente:

| Cosa guardare | Dove |
| --- | --- |
| la pagina esiste, con il suo titolo | `out/thoughts/<slug>/index.html` |
| la card markdown è la pagina, riassunta | `out/thoughts/<slug>.md` |
| la riga nel sitemap, con la data giusta | `out/sitemap-thoughts.xml` |
| l'annuncio, in entrambi i posti | piè di pagina **e** `<link rel="alternate" type="text/markdown">` in `<head>` |
| i collegamenti portano dove dicono | `post: cross-links in content` e `post: related lists` in `verify.js` |
| la TOC elenca le sezioni, e i link funzionano | apritelo nel browser: `npm run dev` |

Se una pagina ha un peso che sale o un controllo che cade, la risposta non è
allentare il controllo: è capire cosa è cambiato. `verify.js` cresce di una riga
solo per una regola che **ha già morso** almeno una volta.

**E la card social.** Ogni articolo e ogni nota ha **due** immagini 1200×630, e le
compone `scripts/og.ps1` dalla voce che hai appena scritto: sfondo, titolo in
Instrument Serif, riga di contesto (`Thoughts · 20 September 2026`) in Inter
Light, letti da `lib/posts.ts` / `lib/notes.ts`. Sono lo stesso disegno in due
varianti, e la differenza è dove finiscono:

| File | Dove si vede |
| --- | --- |
| `og.png` | **fuori dal sito**: la card che un motore di ricerca, un social o un agente usano quando citano la pagina. Logo in alto, testo centrato nella fascia sotto. |
| `cover.png` | **dentro il sito**: l'immagine che la pagina mostra sopra il `h1` (`components/CoverImage.tsx`, dentro la colonna da 692px, riquadro con bordo e ombra leggera). Senza logo — lì sarebbe di troppo due centimetri sopra il titolo scritto — e col testo centrato nel riquadro intero. |

Per rilanciarle solo su questo articolo, e vedere il risultato prima di scriverlo
in `public/`:

```bash
node scripts/gen-og-bg.mjs                                        # solo se cambia sfondo.svg
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/og.ps1 -Only <slug> -Preview
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/og.ps1 -Only <slug>
```

E non si può dimenticare: `verify.js` ricava dai registri l'elenco delle card
attese, lo confronta con le pagine che il build ha prodotto e cade se una manca —
articolo pubblicato senza immagine = controllo rosso, non una condivisione muta.
Lo stesso controllo vale al contrario, sulla pagina: qualunque `og:image`
dichiarata in `<head>` deve puntare a un file che nell'export c'è davvero
(`og: every page's declared og:image exists`, e quando cade **stampa il nome del
file mancante**).

## 7 · La lista, in breve

1. Voce in `lib/posts.ts` (o `lib/notes.ts`): slug, titolo-affermazione,
   description sotto i 170, data, tag, keyword.
2. Il corpo a sezioni da `h2`, con `*corsivo*` e `[etichette](…)` dove servono.
3. **Almeno un link a un altro articolo e uno a una nota**, nel testo, sulla
   parola giusta.
4. Almeno un link a una **sezione** (`#anchor`) da dentro o da fuori.
5. `npm run build && node scripts/verify.js && npm run lint`.
6. Aprire la pagina in `npm run dev`: copiare il link di una sezione e verificare
   che porti lì.
