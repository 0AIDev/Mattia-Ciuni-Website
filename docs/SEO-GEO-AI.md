# SEO · GEO · AI — come funziona il sistema di questo sito, e come portarlo altrove

Questo file è la mappa **completa** di quello che il sito fa per farsi trovare da
tre lettori diversi — un motore di ricerca, un motore generativo, un agente — e di
cosa serve per rifarlo in un altro progetto.

Gli altri due documenti dicono cose diverse: [`SEO.md`](./SEO.md) è il contratto
*di questo* sito (chi scrive quale file, pagina per pagina) e
[`AUTHORING.md`](./AUTHORING.md) è come si scrive un articolo *di questo* sito.
Qui c'è l'impianto: le tre parti, le regole che le tengono in piedi, i comandi che
le provano, e la lista di cosa è generico e cosa è dato di questo sito.

Differenza importante rispetto all'impianto da cui questo documento deriva: là
c'era un'applicazione con **server** (middleware, API, MCP, database). Qui c'è un
**sito statico** (`output: "export"` → `out/`, servito da un Worker Cloudflare con static assets: `wrangler.jsonc`): non
esiste una richiesta da negoziare, quindi un pezzo di quel sistema qui *non può
esistere* — e la regola (§4.2) è dichiararlo invece di fingere.

---

## 0 · In una riga

> Una cosa si dichiara **una volta** (nel registro o nel codice che la
> implementa), tutto il resto si **genera** da lì, e ogni affermazione pubblica ha
> un **comando che la contraddice** se diventa falsa.

Le tre parti sono tre lettori della stessa verità:

| Livello | Chi legge | Cosa gli si dà, qui |
| --- | --- | --- |
| **SEO** | un motore di ricerca | una pagina per indirizzo (HTML statico, testata completa già dentro), sitemap indice + tre figlie, `robots.txt`, JSON-LD, `lastmod` che segue i contenuti |
| **GEO** | un motore generativo (ChatGPT, Perplexity, Gemini…) | la **card markdown** di ogni pagina, annunciata in `<head>` e nel piè di pagina, più `llms.txt` |
| **AI** | un agente (un client, non un crawler) | gli stessi file leggibili senza JavaScript, `robots.txt` con i 32 agenti AI dichiarati per nome e la riga `Content-Signal` |

E una regola che vale per tutti e tre, ed è la parte che di solito non si copia:

> **Si pubblica solo quello che esiste davvero.** In questo sito non esistono un
> server, un'API, un database, un agente A2A. Un `/.well-known/openapi.json` che
> descrive un'API inesistente non è un'omissione riparata: è un agente che prova,
> non trova, e conclude che il sito è rotto. L'elenco di quello che *non* si
> pubblica, con il motivo, sta in §4.2.

---

## 1 · Il modello: una sorgente, molti artefatti

Qui le sorgenti sono **tre file**, e sono gli unici che si toccano:

| Cosa | Dove si dichiara |
| --- | --- |
| un articolo (Thoughts) | `lib/posts.ts` |
| una nota (Notes) | `lib/notes.ts` |
| dominio, email, social, lingua | `lib/site.ts` (una sola costante per il dominio) |

Da una voce del registro, **senza scrivere nient'altro**, nascono:

```
voce in lib/posts.ts ──►  rotta /thoughts/<slug>/
                     ──►  <title>, description, keywords
                     ──►  canonical (che dice sé stessa)
                     ──►  og:*/twitter:* + immagine OG
                     ──►  il documento statico out/thoughts/<slug>.html
                     ──►  la card markdown out/thoughts/<slug>.md
                     ──►  l'annuncio della card: <link rel="alternate"> + "For AI:" nel piè di pagina
                     ──►  il JSON-LD (BlogPosting + BreadcrumbList)
                     ──►  la riga nella figlia giusta del sitemap (/sitemap-thoughts.xml)
                     ──►  la sua data in /feed.xml
                     ──►  l'ingresso in /llms.txt, e la sua comparsa nella home
                     ──►  la sezione nella pagina indice, e i correlati automatici degli altri articoli
```

**Chi scrive i file pubblici** (nessuno di questi si tocca a mano):

| File pubblico | Chi lo scrive |
| --- | --- |
| `out/**/*.html` | `next build` (static export) |
| `out/**/*.md` (le card) | `scripts/gen-cards.mjs`, in `postbuild` (e in `predev`) |
| `out/sitemap.xml` + `sitemap-home/thoughts/notes.xml` | `app/sitemap*.xml/route.ts` + `lib/sitemap.ts` |
| `out/robots.txt` | `app/robots.txt/route.ts` |
| `out/llms.txt` | `app/llms.txt/route.ts` |
| `out/feed.xml` | `app/feed.xml/route.ts` |
| `out/manifest.webmanifest` | `app/manifest.ts` |
| la `<head>` di ogni pagina | `generateMetadata` nella pagina, dai campi del registro |
| `public/_headers`, `public/_redirects` | **a mano**: li legge l'host (Worker con static assets), non la pagina |
| `wrangler.jsonc` | **a mano**: cosa pubblicare (`out/`), quale forma hanno gli indirizzi e cosa risponde agli indirizzi che non esistono |
| `public/og.png`, `public/thoughts/og.png`, `public/notes/og.png` | `scripts/og.ps1` | i tre master disegnati a mano in root (`og.png`, `thoughts-og.png`, `notesog.png`), solo ridotti a 1200×630 |
| `public/thoughts/<slug>/og.png`, `public/notes/<slug>/og.png` | `scripts/og.ps1` | dal template: `og-sfondo.png` (da `sfondo.svg`) + Instrument Serif + Inter Light |
| `public/logo.svg` | `scripts/gen-logo.mjs` (dal `Vector.svg` in root) |
| `app/icon.png` | a mano (è il logo raster) |

Le card sono l'esempio che vale la pena copiare: si generano **dall'HTML già
esportato**, quindi non duplicano i contenuti e non possono divergere dalla
pagina. Aggiungi un articolo, non tocchi niente: al build la card si rigenera.

**Perché è questa la parte da copiare.** Un `sitemap.xml` scritto a mano perde le
pagine nuove alla prima rigenerazione, e la rigenerazione lo sovrascrive **in
silenzio**: sembra funzionare finché non si apre il file. Lo stesso vale per una
card `.md` scritta a mano, per un `llms.txt`, per un `robots.txt`.

---

## 2 · SEO — il motore di ricerca

### 2.1 Un documento per indirizzo

`npm run build` = `next build` (static export) → `node scripts/gen-cards.mjs`.
Il risultato sono file HTML completi in `out/`: **un crawler che non esegue
JavaScript legge comunque tutto**, perché la testata e il corpo sono già nel
file. Oggi: 8 pagine pubblicate (più il 404).

Quello che finisce in `<head>` su ogni pagina indicizzabile:

- `<title>` e `<meta name="description">` — dal registro, che è l'unico posto
  dove si scrivono;
- `<link rel="canonical">` che dice sé stessa;
- Open Graph + Twitter card (`og:url`, `og:title`, `og:description`, `og:image`,
  `article:published_time` e `article:modified_time` per gli articoli);
- il **grafo JSON-LD** (§2.4);
- l'**annuncio della card markdown**, con lo stesso `rel="alternate"` degli
  `hreflang` e il `type` a dire quale forma (§3.2).

**Niente `hreflang`, ed è una scelta, non una dimenticanza.** Il sito è scritto in
una lingua sola (`en`): dichiarare `hreflang` per sé stessi più `x-default` è
rumore che non aggiunge nulla e che nessuno può correggere in seguito senza
rifare tutto. Il giorno in cui esiste una seconda lingua, si aggiunge **in
`<head>`** (mai nel sitemap: un elemento XHTML dentro il file del sitemap fa
smettere Chrome di disegnarlo come albero dei tag).

**Tutto è indicizzabile, tranne il 404.** Non c'è un interruttore di bozza: un
articolo si scrive nel registro quando è pronto, e finché non c'è non esiste da
nessuna parte (né rotta, né riga di sitemap, né card).

### 2.2 Il sitemap: un indice e tre figlie

```
out/sitemap.xml               <sitemapindex> che nomina le tre figlie
out/sitemap-home.xml          la home (1 URL)
out/sitemap-thoughts.xml      l'indice Thoughts + i post (3 URL)
out/sitemap-notes.xml         l'indice Notes + le note (4 URL)
```

L'indice e le figlie si ricavano **dagli stessi registri** che generano le
pagine: «un indirizzo nel sitemap» e «una pagina che esiste» sono la stessa
affermazione, e `verify.js` cade sulle pagine che stanno in `out/` e non in una
figlia, o su una figlia che annuncia un indirizzo non costruito.

Ogni file si **apre nel browser**: un elemento per riga, rientrato, con
`lastmod`, `changefreq` e `priority` espliciti (§5.1, il controllo lo pretende).

### 2.3 Le date: `lastmod` che dice la verità

Google scrive, a proposito di `lastmod`, che è utile *a patto che dica la
verità*: un sitemap che a ogni deploy dichiara cambiate tutte le pagine statiche
è esattamente il caso in cui smette di crederci.

**Qui le date seguono i contenuti** (`latestOf` in `lib/sitemap.ts`):

| Pagina | `lastmod` |
| --- | --- |
| un articolo | `post.updated ?? post.date` — una data scritta a mano, mai «oggi» |
| una nota | `note.date` |
| l'indice `/thoughts/` | la più recente fra i post (cambia quando cambia il post più recente) |
| l'indice `/notes/` | la più recente fra le note |
| la home | la più recente fra post e note (cambia quando cambia quello che elenca) |
| l'indice del sitemap | la data della figlia corrispondente |

Il controllo è una riga: `sitemap: lastmod follows content` confronta la data di
una collezione con il massimo delle date che contiene, quindi una data scritta a
mano o ferma nel tempo fa cadere la verifica. (Prima di questo, gli indici
avevano una data fissa: era il caso peggiore, una data che non cambia mai più.)

### 2.4 Il JSON-LD è un grafo

| Pagina | Nodi |
| --- | --- |
| home | `Person` (con `worksFor` → Payle, `sameAs` social, indirizzo Milano) + `WebSite` |
| articolo | `BlogPosting` + `BreadcrumbList` |
| nota | `Article` + `BreadcrumbList` |
| indice Thoughts | `Blog` |

Regola: **il dato strutturato dichiara quello che la pagina mostra**, nello stesso
ordine. Il `BreadcrumbList` di un articolo ha esattamente i tre passi del
breadcrumb visibile (Home · Thoughts · titolo); per questo anche le note ce l'hanno,
pur essendo un contenuto più semplice.

### 2.5 Notifica e misura — cosa **non** c'è, e cosa servirebbe

| Strumento | Stato | Cosa servirebbe |
| --- | --- | --- |
| **IndexNow** (Bing, Yandex, Seznam, Naver) | assente | una chiave nel `.env`, un file `<chiave>.txt` generato nel build, uno script `scripts/indexnow.mjs` che confronta il live con il nuovo `out/` e manda **solo** le URL cambiate, e un workflow che lo lancia **dopo** il deploy (prima, il live non è ancora il nuovo build) |
| **Search Console** (registrazione + API) | assente, ed è l'unico passo **umano** | proprietà di **dominio** verificata via DNS, `sitemap.xml` registrato a mano una volta; con un service account l'API può anche riportare cosa Google ha **scartato** |
| **Ping a Google** | **non esiste più** | l'endpoint HTTP è deprecato (2023): una richiesta lì è un 404, cioè un verde sopra una richiesta rifiutata. Le due strade vere sono la riga `Sitemap:` in `robots.txt` (c'è) e l'API di Search Console |
| **analytics** | assente di proposito | nessuno script di terze parti nel bundle; se si aggiunge, il consenso è il cancello (senza consenso non parte nessuno script) |

`robots.txt` dichiara già `Sitemap:` ed è l'unico modo con cui Google scopre
l'indice senza registrazione. La registrazione serve a **vedere gli errori**, che
senza un account non si vedono.

### 2.6 Gli indirizzi del sito di prima

Non ci sono: il dominio è nuovo e non esiste un sito precedente da salvare, quindi
`public/_redirects` è vuoto (ci sta solo il commento che spiega perché).

L'unico redirect che serviva, `www` → apex, **non si può scrivere lì**, ed è una
differenza che è costata una build: i Worker con static assets accettano solo
percorsi relativi e **scartano in silenzio** le regole con un dominio dentro.
Provato, non dedotto:

```text
▶︎ Only relative URLs are allowed. Skipping absolute URL https://www.mattiaciuni.xyz/*.
```

Sta quindi a livello di zona (Cloudflare → **Rules → Redirect Rules**), che è
anche il posto in cui Cloudflare lo documenta.

**La trappola, già nota per quando servirà:** Cloudflare applica **solo le prime
100 regole** di `_redirects` e ignora le altre **in silenzio** (è così su Pages, ed
è la ragione per cui un sito di prima con mille indirizzi finisce in un Worker con
la tabella nel codice, non in quel file). Se un giorno gli indirizzi da riscrivere
saranno più di cento, quelle regole vanno in uno script (`main` in
`wrangler.jsonc`), non nel file.

---

## 3 · GEO — il motore generativo

Un motore generativo non guarda la pagina come un browser: la legge come **testo**,
la cita, e ha bisogno di sapere **chi** è un'entità e **cosa può farne**.

### 3.1 La card markdown di ogni pagina

Ogni pagina ha una card concisa **allo stesso indirizzo con l'estensione
cambiata**: `/thoughts/money-layer-for-ai-agents` → `/thoughts/money-layer-for-ai-agents.md`
(la radice, che un nome non ce l'ha, è `/index.md`).

```markdown
# Il titolo che la pagina scrive

> La description della pagina

- URL: https://mattiaciuni.xyz/thoughts/money-layer-for-ai-agents
- Type: Blog post
- Published: 2026-09-20

- [Thoughts index](thoughts.md)
- [Home](../index.md)
```

**Da dove viene**: non da un registro separato, ma dall'HTML **già esportato**
(`scripts/gen-cards.mjs` legge `out/`). È l'unico modo per cui la card non può
dire una cosa che la pagina non dice: cambiare un articolo cambia la pagina, e la
card segue senza che nessuno si ricordi di niente. I link dentro la card sono
**relativi**, perché un file che esce dal sito deve poter essere letto da solo.

**Dove vive.** In produzione dentro `out/` (quindi sul dominio); in sviluppo le
stesse card finiscono anche in `public/`, così `npm run dev` le serve e il
collegamento in pagina non è un 404 mentre si scrive. `verify.js` controlla
entrambe le copie (`cards: public copy for dev`).

**Una convenzione che vale la pena copiare**: la card è **curata e corta** (un
titolo, la description, tre metadati, i link ai vicini), non è il testo della
pagina travestito. Un agente che legge cento pagine di sito legge cento card;
leggere cento trascrizioni è un'altra cosa (§3.4).

### 3.2 I due annunci, e sono la stessa riga scritta per due lettori

1. **il piè di pagina**: «For AI: `/thoughts/money-layer-for-ai-agents.md`», con
   il link alla card — ed è l'unico elemento presente su **tutte** le pagine;
2. **la `<head>`**: `<link rel="alternate" type="text/markdown" href="/…md">`,
   accanto alla `canonical`.

Stesso `rel="alternate"` perché è la stessa domanda («di questo indirizzo esiste
un'altra forma?»), con il `type` a dire **quale** forma. Il secondo serve perché
un crawler **non esegue la pagina**: se la card la nominasse solo il piè di
pagina, la nominerebbe il posto che una macchina non guarda.

L'indirizzo della card si compone dal **canonico** della pagina, non dalla barra
degli indirizzi: in un sito statico le due cose oggi coincidono, ma scriverlo dal
canonico è la regola che tiene il giorno in cui una variante esiste.

`verify.js` li controlla entrambi, separatamente: `page: For AI link on post` legge
il piè di pagina, `head: markdown card alternate` legge la testata — così uno dei
due può cadere per conto suo (chiedendolo «da qualche parte nella pagina», il
controllo passerebbe anche con metà annuncio sparito).

### 3.3 `llms.txt`

`/llms.txt` (generato, come tutto il resto) contiene: chi è la persona in una riga
(il blockquote), le sezioni Home / Thoughts / Notes con **tutti** i titoli e i
loro indirizzi, la riga che dice dove stanno le card, e i contatti (email, Payle).
È il file che un motore generativo legge per primo: deve dire **cosa c'è** e
**come raggiungerlo**, non ripetere il contenuto.

### 3.4 Perché non una versione testo integrale di ogni pagina

L'impianto da cui questo documento deriva pubblica, per ogni pagina, il **testo
completo** (`/it/privacy.txt`) e negozia il markdown sulle richieste
(`Accept: text/markdown`). Qui non c'è, per due ragioni che valgono la pena di
scrivere invece di lasciarle sembrare una dimenticanza:

- **la card è un documento, la trascrizione è un file**: la card dice cosa è la
  pagina e dove stanno i vicini, in poche righe che stanno in un contesto; un
  `.txt` con dentro tutto il corpo è utile solo a chi ha già deciso di leggere
  quella pagina;
- **la negoziazione ha bisogno di un server.** Qui non c'è: `output: "export"`
  produce file, e un file non legge `Accept:`. Farla richiederebbe Cloudflare
  Pages Functions (§4.3) — cioè un pezzo di infrastruttura che oggi non serve a
  niente, perché la card **è già** il testo leggibile allo stesso indirizzo.

Il giorno in cui serve (per esempio perché un assistente vuole il testo integrale
e non la scheda), si aggiunge così: un `route.ts` per pagina che restituisce il
testo ricavato dal documento costruito, lo stesso annuncio nella `<head>` con il
`type` giusto, e un controllo che il file dica la stessa pagina della card.

---

## 4 · AI — l'agente che non guarda una pagina

Un agente non naviga: cerca **file**, in posti prevedibili, e legge le
**testate**. Qui ci sono tre cose e nessuna infrastruttura.

### 4.1 `robots.txt`: i permessi dichiarati per nome

`robots.txt` non si limita a `User-agent: *`: sono **33 blocchi**, **32 dei quali
nominano un agente AI** (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
Claude-User, Claude-SearchBot, anthropic-ai, PerplexityBot, Perplexity-User,
Google-Extended, Applebot, Applebot-Extended, CCBot, Bytespider, Amazonbot,
meta-externalagent, Meta-ExternalFetcher, FacebookBot, YouBot, cohere-ai,
Diffbot, DuckAssistBot, MistralAI-User, ImagesiftBot, omgili, Webzio-Extended,
PanguBot, iaskspider, AI2Bot, AI2Bot-Dolma, Timpibot, Kangaroo Bot).

Il motivo: **un agente AI non è un motore di ricerca**, molti non seguono il `*`,
e chi non trova il proprio nome decide da sé. Dirlo per nome toglie la decisione a
lui.

Sopra i robot, una riga che parla agli agenti e non ai motori:

```text
User-Agent: *
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /
```

La riga serve perché `robots.txt` è l'unico posto in cui può **contraddire sé
stesso**: un `ai-train=no` sopra trentadue `Allow: /` è una politica che nessuno
rispetta, non perché sia sbagliata, ma perché non si sa quale delle due valga.
`verify.js` pretende che i tre valori ci siano e dicano di sì, così una politica
che cambia cambia in due posti.

**Niente `Agentmap`**: punterebbe a un catalogo ARD (`/.well-known/ai-catalog.json`)
che qui non esiste, e un `robots.txt` che nomina un file inesistente è peggio di
un `robots.txt` scarno (§4.2).

### 4.2 Cosa **non** si pubblica, e perché è la regola più importante

Nessuna di queste voci è un «non ancora»: ognuna descrive una **capacità che il
sito non ha**. Se un giorno si accende, si pubblica **lo stesso giorno** — non
prima.

| Cosa | Perché no | Cosa servirebbe |
| --- | --- | --- |
| `/.well-known/openapi.json`, `/.well-known/api-catalog` | non c'è nessuna API: il sito serve file | un'API, e il suo contratto scritto dal codice che la implementa |
| `/.well-known/mcp/server-card.json`, `/.well-known/oauth-protected-resource`, `/auth.md` | non c'è un server MCP né un'autorità di autenticazione | un server MCP vero, o una chiave API con il suo ciclo di vita |
| `/.well-known/openid-configuration` (OAuth/OIDC discovery) | non c'è un issuer: `issuer`, `authorization_endpoint`, `token_endpoint` sono tre campi senza un oggetto | un vero issuer e un flusso da descrivere |
| **Web Bot Auth** (`/.well-known/http-message-signatures-directory`) | è la chiave con cui un sito **firma le proprie richieste in uscita**: qui non escono richieste a nome di nessuno | un client che firmi davvero, e una chiave con il suo ciclo di vita |
| **x402**, **MPP**, **UCP**, **ACP** (pagamenti/commercio fra macchine) | il sito non vende niente a un agente | un prodotto comprabile, un incasso, e la decisione di lasciarlo comprare a una macchina |
| **DNS-AID** (`_index._agents.<dominio>`) | annuncerebbe un endpoint agente (HTTPS/h3/h2) che qui non esiste: è un sito di file | un endpoint vero, con `alpn` **verificato** e non dedotto |
| **Agent Skills** (`/.well-known/agent-skills/index.json` + `SKILL.md`) | sono skill di un server; qui non c'è niente da chiamare | un server con strumenti veri |
| **negoziazione `Accept: text/markdown`** | richiede un server | Pages Functions (§4.3), e serve solo se la card non basta (§3.4) |

Il documento assente costa una riga di rapporto; il documento falso costa una
chiamata **e la fiducia**.

### 4.3 Perché questo sito non ha un middleware

Il sistema da cui questo documento deriva mette in `functions/_middleware.js` i
`Link` di risposta (RFC 8288) e la negoziazione del markdown. Qui il sito è
**statico** (`out/`), quindi:

- i `Link` di risposta non esistono — e non servono: gli stessi indirizzi sono
  già nominati in `<head>` (`alternate text/markdown`) e in `llms.txt`, cioè dove
  un agente li cerca comunque;
- non c'è niente da negoziare: la card ha il suo indirizzo, non serve chiederla
  con una testata `Accept:`;
- gli unici file che Cloudflare legge **per noi** sono `public/_headers` (tipo e
  cache dei file noti e header di sicurezza) e `wrangler.jsonc` (gli indirizzi:
  barra finale, pagina 404).

Il giorno in cui servisse qualcosa di dinamico (indexnow server-side, un
`/mcp`, la negoziazione), il posto è uno script nel Worker (`main` in
`wrangler.jsonc`, con `assets`) e il comando per provarlo è `npx wrangler dev` —
perch\u00e9 n\u00e9 `next dev` n\u00e9 un server statico fanno girare quel pezzo.

---

## 5 · Le reti: chi controlla cosa

### 5.1 In locale, dentro il build (nessuna rete)

| Comando | Cosa morde |
| --- | --- |
| `npm run lint` | ESLint flat config (fra cui: link interni con `next/link`) |
| `npx tsc --noEmit` | i tipi |
| `npm run build` | `next build` + `scripts/gen-cards.mjs` (8 pagine, 8 card) |
| `node scripts/verify.js` | **52 controlli** sul costruito: un solo `h1` per pagina, canonical, OG, JSON-LD parseabile (Person, WebSite, BlogPosting, Article, `BreadcrumbList` **anche per le note**), breadcrumb visibile, `robots.txt` (agenti AI per nome + `Content-Signal`), sitemap (indice + figlie, **date che seguono i contenuti**, indice datato come le figlie), `lastmod`, l'**OG card di ogni articolo e nota** (ricavata dai registri, con il conteggio confrontato con le pagine costruite, e nessuna card orfana) e l'**`og:image` che ogni pagina dichiara** (letto dall'`<head>` di tutte le pagine costruite, e deve esistere: quando cade stampa il file mancante), annuncio della card markdown nella `<head>` **e** nel piè di pagina, link interni fra articoli e sezioni, TOC con gli anchor giusti, card `.md` (struttura e copia in `public/`), 404 `noindex`, peso dell'homepage (html+css < 56KB raw) |

`verify.js` è deliberatamente **una cosa sola**: non è una suite, è un file che si
legge in un minuto e che aggiunge una riga per ogni regola che ci è già costata
qualcosa. Un controllo nuovo, qui, entra solo se prima ha **morso** una volta.

### 5.2 Dal vivo: cosa non c'è ancora

Oggi nessun controllo parla al sito pubblicato. È la lacuna più onesta da
scrivere: il `dist` può essere perfetto e il file arrivare sul dominio tagliato,
o servito con la pagina di ripiego. Il minimo, quando servirà:

```bash
curl -sI https://<dominio>/robots.txt | head -1          # 200, e text/plain
curl -s  https://<dominio>/sitemap.xml | head -3         # <sitemapindex, non la shell SPA
curl -s  https://<dominio>/index.md   | head -1          # "# Mattia …", non "<!doctype"
```

Tre righe, tre modi diversi di rompersi (un file mancante, un file sostituito
dalla shell, un sitemap che elenca un altro deploy). Con un `--site=` diventano
uno script, e con un `--wait` diventano il passo che aspetta il deploy.

### 5.3 Provare il pezzo che esiste solo su Cloudflare

`public/_headers`, `public/_redirects` e il comportamento degli indirizzi (la
barra finale, la 404) **non girano** né in `next dev` né su un server statico: li
applica l'host, secondo ciò che dice `wrangler.jsonc`.

```bash
npm run build && npx wrangler dev    # workerd vero: _headers, _redirects, trailing slash, 404
```

\u00c8 la prova che vale, perché è la stessa strada della produzione: `/` 200,
`/thoughts/<slug>/` **200 senza redirect** (\u00e8 la forma canonica),
`/thoughts/<slug>` 307 verso quella con la barra, un indirizzo inventato 404 con il
corpo di `out/404.html`, e su `/og.png` il `Content-Type` e il `Cache-Control` di
`_headers`.

---

## 6 · Portarlo in un altro progetto

### 6.1 Cosa è generico e cosa è dato di questo sito

**Generico (l'impianto, si copia):**

- registro → tutto il resto derivato; nessun artefatto generato scritto a mano;
- il dominio come unica costante (`lib/site.ts`), letta da canonical, sitemap,
  `robots.txt`, `llms.txt`, JSON-LD, RSS e card;
- un documento per indirizzo, con la testata completa già dentro (un crawler non
  esegue JavaScript);
- sitemap come **indice + figlie**, ricavato dalle pagine costruite;
- `lastmod` che segue i **contenuti**, e una verifica che lo pretende;
- la card markdown ricavata dal **documento costruito**, con i due annunci (piè
  di pagina + `<head>`);
- `robots.txt` con gli agenti AI **per nome** e la riga `Content-Signal`;
- la lista di **ciò che non si pubblica**, con la ragione e cosa servirebbe;
- controlli locali senza rete, in un file solo, che crescono di una riga per ogni
  regola che ha già morso.

**Dato di questo sito (si sostituisce, non si copia):** dominio, email e social in
`lib/site.ts`; la riga `en`; i 32 nomi dei bot (si aggiornano, l'elenco non è
sacro); i contenuti e i loro keyword; le immagini OG; il testo di `llms.txt`.

### 6.2 L'ordine minimo (quello che serve davvero, in sette passi)

1. **Una costante per il dominio** e un registro di pagine che genera le rotte.
2. **Un prerender**, cioè pagine statiche con `<title>`, description, canonical e
   OG già dentro (in Next: `generateMetadata` + `output: "export"`).
3. **Il sitemap come indice + figlie, ricavato dalle pagine costruite**, con
   `lastmod` che segue i contenuti.
4. **La card markdown di ogni pagina**, ricavata dal costruito, più i suoi **due**
   annunci (piè di pagina e `<head>`).
5. **`robots.txt`**: `Allow`, agenti AI per nome, `Content-Signal`, riga `Sitemap:`.
6. **`llms.txt`** con le sezioni e i titoli reali.
7. **I controlli**: un file locale senza rete che verifica le sei cose sopra, e —
   quando servirà — tre `curl` sul sito pubblicato.

### 6.3 Le tre trappole, già pagate

- **Il dominio scritto in due posti.** Qui non succede per costruzione: le card
  (`scripts/gen-cards.mjs`) leggono solo `out/`, che è già canonico, e nessuno
  script Node ricopia il dominio. Se un giorno uno script dovesse farlo, va
  controllato che coincida con `lib/site.ts`.
- **Un file generato che nessuno rigenera** dice una verità vecchia. Qui le card
  girano in `postbuild` **e** in `predev`, e `verify.js` controlla sia la copia
  di produzione sia quella di sviluppo: non esiste il caso «l'ho aggiornata a
  mano solo questa volta».
- **`_redirects` di Cloudflare ignora in silenzio oltre la centesima regola**, e
  sui Worker ignora anche le regole con un dominio dentro. Qui il file è vuoto; se
  un giorno serviranno, vanno in uno script del Worker.

---

## 7 · Stato di oggi (21 settembre 2026)

Misurato adesso, non ricordato:

```text
8 pagine pubblicate (2 articoli · 3 note · home · 2 indici) + 404
8 card markdown in out/ (e copia in public/ per lo sviluppo)
sitemap: un indice + tre figlie · 8 URL in totale · lastmod che segue i contenuti
robots.txt: 33 blocchi · 32 agenti AI per nome · Content-Signal dichiarato
JSON-LD: Person + WebSite · BlogPosting + BreadcrumbList · Article + BreadcrumbList · Blog
verify.js: 52 controlli, tutti verdi · homepage html+css 54.6KB raw · JS 749.6KB raw
```

**Fuori dal repository, e quindi non finito:**

- **Search Console**: registrazione del sitemap (proprietà di dominio via DNS) —
  è un gesto umano, una volta;
- **IndexNow**: nessuna chiave, nessun workflow (§2.5);
- **controlli dal vivo**: nessuno (§5.2).

Correttamente **assenti**, per la regola del §4.2: OAuth/OIDC discovery, Web Bot
Auth, x402/MPP/UCP/ACP, DNS-AID, server card MCP, agent skills, catalogo ARD.

---

## 8 · I file da guardare, in ordine

```
lib/site.ts                    dominio, email, social (una sola costante)
lib/posts.ts                   il registro degli articoli
lib/notes.ts                   il registro delle note
lib/sitemap.ts                 urlset · indice · latestOf (le date che seguono i contenuti)
lib/related.ts                 i correlati dedotti da tag e keyword
app/page.tsx                   home: metadata + JSON-LD Person/WebSite
app/thoughts/[slug]/page.tsx   articolo: metadata + BlogPosting + BreadcrumbList + TOC + correlati
app/notes/[slug]/page.tsx      nota: idem, con Article
app/sitemap*.xml/route.ts      l'indice e le tre figlie
app/robots.txt/route.ts        permessi dichiarati: agenti AI per nome + Content-Signal
app/llms.txt/route.ts          il file che un motore generativo legge per primo
app/feed.xml/route.ts          RSS
scripts/gen-cards.mjs          le card markdown, dal costruito
scripts/verify.js              i 52 controlli locali
public/_headers                tipo e cache dei file noti, header di sicurezza
wrangler.jsonc                 cosa pubblicare e come rispondere: out/, barra finale, 404
docs/SEO.md                    il contratto di questo sito, file per file
docs/AUTHORING.md              come si scrive un articolo, con le regole editoriali
```
