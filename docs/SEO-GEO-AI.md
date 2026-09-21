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
**sito statico** (`output: "export"` → `out/`, pubblicato da Cloudflare Pages: il progetto
legge `out/` e una sola Pages Function, `functions/_middleware.ts`): non
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
| il dominio | `lib/site-origin.ts` (una stringa sola, letta anche dalla Function) |
| email, social, lingua | `lib/site.ts` |

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
| `out/.well-known/api-catalog`, `out/.well-known/agent-skills/index.json` e la copia della `SKILL.md` | `scripts/gen-agent-files.mjs`, in `postbuild` (e in `predev`), **dopo** `gen-cards` perché quel passo cancella gli `.md` generati |
| `out/sitemap.xml` + `sitemap-home/thoughts/notes.xml` | `app/sitemap*.xml/route.ts` + `lib/sitemap.ts` |
| `out/robots.txt` | `app/robots.txt/route.ts` |
| `out/llms.txt` | `app/llms.txt/route.ts` |
| `out/feed.xml` | `app/feed.xml/route.ts` |
| `out/manifest.webmanifest` | `app/manifest.ts` |
| la `<head>` di ogni pagina | `generateMetadata` nella pagina, dai campi del registro |
| `public/_headers`, `public/_redirects` | **a mano**: li legge l'host (Pages), non la pagina |
| `public/_routes.json` | **a mano**: quali rotte invocano la Function (le sole in cui compaiono indirizzi assoluti) |
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
| **IndexNow** (Bing, Yandex, Seznam, Naver) | implementato, opzionale | `scripts/ping-indexnow.mjs` genera il file `<chiave>.txt` nel build e invia le URL principali quando `INDEXNOW_KEY` è configurata; senza chiave non fa chiamate |
| **Search Console** (registrazione + API) | registrazione umana necessaria | proprietà di dominio verificata via DNS e `sitemap.xml` inviato una volta; Google non espone più un ping pubblico affidabile |
| **Google News** | supporto tecnico, inclusione non garantita | JSON-LD `BlogPosting`, RSS e `/news-sitemap.xml`; l'idoneità tecnica non equivale all'accettazione editoriale |
| **analytics** | implementato con consenso | GA4 `G-YQS0R94ZQP` caricato solo dopo consenso, con attribuzione, page view, traffic source e click outbound |
| **newsletter** | Resend + Brevo | `/api/subscribe` valida, limita per IP, aggiorna Brevo e invia il template Welcome via Resend; le chiavi restano Secret su Pages |

`robots.txt` dichiara già `Sitemap:` ed è l'unico modo con cui Google scopre
l'indice senza registrazione. La registrazione serve a **vedere gli errori**, che
senza un account non si vedono.

### 2.6 Gli indirizzi del sito di prima

Non ci sono: il dominio è nuovo e non esiste un sito precedente da salvare, quindi
`public/_redirects` è vuoto (ci sta solo il commento che spiega perché).

L'unico redirect previsto, `www` → apex, su Pages **si può scrivere lì** (le regole
possono avere un dominio dentro). Il giorno in cui nacque questo file il sito era
però pubblicato da un Worker con static assets, che quelle regole le accetta solo
relative e **scarta in silenzio** le altre — provato, non dedotto:

```text
▶︎ Only relative URLs are allowed. Skipping absolute URL https://www.mattiaciuni.xyz/*.
```

È una trappola che vale la pena ricordare se un giorno si tornasse su un Worker:
l'avviso finisce nei log, la regola non viene applicata e niente fallisce.

**La trappola che resta valida:** Cloudflare applica **solo le prime 100 regole**
di `_redirects` e ignora le altre **in silenzio** (è così su Pages: ed è la ragione
per cui un sito di prima con mille indirizzi finisce in una tabella dentro una
Function, non in quel file). Se un giorno gli indirizzi da riscrivere saranno più
di cento, quelle regole vanno in `functions/_middleware.ts`.

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

- URL: https://mattiaciuni.pages.dev/thoughts/money-layer-for-ai-agents
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
- **la card è un documento, la trascrizione è un file**: la card dice cosa è la
  pagina e dove stanno i vicini, in poche righe che stanno in un contesto; un
  `.txt` con dentro tutto il corpo è utile solo a chi ha già deciso di leggere
  quella pagina.

La **negoziazione** invece c'è, perché serve a chi non sa che la card esiste: un
agente che chiede una pagina all'indirizzo canonico con `Accept: text/markdown`
non scoprirà mai `…/slug.md` da solo. La Function la serve restituendo **la card**,
non una conversione (§4.4): è la stessa cosa che il sito pubblica, quindi non può
divergere.

Il giorno in cui servisse anche il **testo integrale** (un assistente che vuole il
corpo, non la scheda), si aggiunge così: una rotta che restituisce il testo
ricavato dal documento costruito, lo stesso annuncio nella `<head>` con il `type`
giusto, e un controllo che il file dica la stessa pagina della card.

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
| `/.well-known/openapi.json` | non c'è nessuna API: il sito serve file | un'API, e il suo contratto scritto dal codice che la implementa |
| `/.well-known/mcp/server-card.json` | non c'è un server MCP: una card che punta a un endpoint che non parla il protocollo è peggio di una card assente | un server MCP vero |
| `/.well-known/openid-configuration` e `/.well-known/oauth-authorization-server` (OAuth/OIDC discovery) | non c'è un issuer: `issuer`, `authorization_endpoint`, `token_endpoint` sono tre campi senza un oggetto, e riempirli con un `issuer` inventato dichiarerebbe endpoint che non rispondono | un vero issuer e un flusso da descrivere |
| **Web Bot Auth** (`/.well-known/http-message-signatures-directory`) | è la chiave con cui un sito **firma le proprie richieste in uscita**: qui non escono richieste a nome di nessuno | un client che firmi davvero, e una chiave con il suo ciclo di vita |
| **x402**, **MPP**, **UCP**, **ACP** (pagamenti/commercio fra macchine) | il sito non vende niente a un agente | un prodotto comprabile, un incasso, e la decisione di lasciarlo comprare a una macchina |
| **DNS-AID** (`_index._agents.<dominio>`) | non è una cosa da repository: vive nel DNS, che non sta qui. Ed è pubblicabile **solo** puntandolo a questo sito con un `alpn` **verificato** (h2/h3) — non a un server che non c'è — e con la zona firmata, altrimenti un resolver validante non lo autentica | la zona su Cloudflare (DNSSEC + il record `SVCB`), e la certezza di quale `alpn` risponde davvero |
| **ARD** (`/.well-known/ai-catalog.json`) | è un catalogo di **capacità** (server MCP, agenti A2A, contratti OpenAPI) e qui non ce n'è nessuna: al massimo conterrebbe tre documenti, che il linkset di `api-catalog` già nomina | una capacità vera da annunciare |

Il documento assente costa una riga di rapporto; il documento falso costa una
chiamata **e la fiducia**.

### 4.3 Cosa si è pubblicato, e cosa dichiara

Sei cose sono state aggiunte perché **descrivono solo roba che esiste**, e
ognuna è verificata da `verify.js` (non «il file c'è» ma «ciò che dichiara c'è»):

| Cosa | Cosa dichiara | Come si verifica |
| --- | --- | --- |
| `Link` di risposta su ogni pagina (RFC 8288) | `describedby` → `/llms.txt`, `service-doc` → `/index.md`, `alternate` → feed e sitemap | ogni `<…>` della riga deve esistere nell'export |
| `/.well-known/api-catalog` (RFC 9727) | l'ancora è il sito; `service-desc` e `service-doc` sono i due documenti che lo descrivono per una macchina. Nessun `status`, nessun `openapi.json` | ogni `href` del linkset risolve a un file dell'export |
| `/.well-known/agent-skills/index.json` | una skill, `read-and-cite-mattia-ciuni`, il cui `SKILL.md` è pubblicato accanto | **il digest si ricalcola** sul file pubblicato: se non combacia, il controllo cade |
| `/.well-known/oauth-protected-resource` (RFC 9728) | il sito è una risorsa **pubblica**: la lista degli authorization server (e degli scope, e dei metodi bearer) è vuota, e quel vuoto è la risposta. Un `404` lascerebbe un agente a chiedersi se ha guardato nel posto giusto | il documento è JSON, `resource` è l'origine, e i due path che pubblicherebbe un authorization server devono restare **assenti** (`verify.js` cade se qualcuno ci mette un issuer inventato) |
| `/auth.md` | cosa serve a un agente per autenticarsi: niente, con l'istruzione esplicita a non mandare token | l'H1 nomina il file (è ciò che i lettori di agenti controllano) e il testo dichiara che non c'è credenziale da ottenere |
| negoziazione `Accept: text/markdown` | serve la card `.md` della pagina richiesta | provata su workerd, non dedotta (§5.3) |

La skill è l'unico contenuto **scritto a mano** per gli agenti, e sta in
`agent-skills/<nome>/SKILL.md` (come gli altri master in root): dice dove stanno
le cose leggibili, come si cita, e cosa **non** c'è — perché una skill che promette
una ricerca o un'API inesistente è la stessa bugia di un endpoint inventato, con
un giro di ritardo.

### 4.4 Una funzione sola, due cose, e si vede

Il sito è **statico** (`out/`): non c'è un'applicazione da far girare. C'è però
una Pages Function che fa due cose che gli asset da soli non sanno fare.

**La prima** è la negoziazione:

> `Accept: text/markdown` su una pagina restituisce la **card `.md` di quella
> pagina**, con `Content-Type: text/markdown` e `x-markdown-tokens`.

Perché serve, dopo che la card ha già il suo indirizzo: perché un agente che
chiede una pagina non sa che esiste `…/slug.md`, e perché la richiesta arriverà
all'indirizzo canonico, non a quello della card (§3.4). Perché **non** è una
conversione fatta al momento: convertire sarebbe un secondo modo di dire la stessa
pagina, e prima o poi direbbe qualcosa di diverso — la card invece nasce
dall'HTML appena esportato.

**La seconda** è il dominio, ed è la cura del guasto del 21/09 (il sito dichiarava
`https://mattiaciuni.xyz`, che non esiste in DNS, mentre rispondeva altrove: la
sitemap elencava otto indirizzi irraggiungibili e Discord e X non mostravano
nessuna anteprima). Gli indirizzi assoluti che l'export dichiara — `canonical`,
`og:url`, `og:image`, JSON-LD, `<loc>` delle sitemap, il `Sitemap:` di
`robots.txt` — vengono riscritti con **l'host che sta servendo la pagina**
(`new URL(request.url).origin`). Così il dominio segue il deploy invece di essere
una cosa che qualcuno deve ricordarsi di aggiornare: oggi il `.pages.dev`, domani
il dominio custom, senza un rebuild. Se nel progetto è impostata `SITE_URL` il
dominio invece si **fissa** su quello, ed è quello che serve quando esistono due
host e uno solo deve essere quello dichiarato.

La parte che conta è cosa **non** riscrivere: si riscrivono solo risposte
testuali (`TEXTUAL`, l'elenco dei tipi), e il corpo ricostruito perde
`Content-Encoding` e `Content-Length` della risposta originale (una `br` con
dentro testo già decodificato è un file corrotto). Le immagini passano intatte:
provato confrontando i byte di `og.png` servito con il file su disco, non
"sembra uguale".

Tre dettagli che tengono il resto in piedi:

- `public/_routes.json` elenca **solo** le rotte in cui compaiono indirizzi
  assoluti (pagine, sitemap, robots, feed, `llms.txt`, card `.md`, `/.well-known/`):
  immagini, CSS, font e JS non invocano la Function;
- se la card non c'è (`/og.png`, `/.well-known/api-catalog`), si torna agli asset:
  niente markdown inventato per un file che non è una pagina;
- la risposta HTML dichiara `Vary: Accept`: senza, un deposito intermedio
  servirebbe il markdown a un browser (o il contrario) alla prima richiesta.

Gli `Link` di risposta (RFC 8288) invece **non** richiedono codice: sono righe di
`public/_headers`, e riguardano tutti gli indirizzi della stessa pagina.

Il giorno in cui servisse altro di dinamico (indexnow server-side, un `/mcp`), il
posto è ancora questo file, e il comando per provarlo è `npx wrangler pages dev out`,
perché né `next dev` né un server statico fanno girare quel pezzo.

---

## 5 · Le reti: chi controlla cosa

### 5.1 In locale, dentro il build (nessuna rete)

| Comando | Cosa morde |
| --- | --- |
| `npm run lint` | ESLint flat config (fra cui: link interni con `next/link`) |
| `npx tsc --noEmit` | i tipi |
| `npm run build` | `next build` + `scripts/gen-cards.mjs` (8 pagine, 8 card) |
| `node scripts/verify.js` | **94 controlli** sul costruito: un solo `h1` per pagina, canonical, OG, JSON-LD parseabile (Person, WebSite, BlogPosting, Article, `BreadcrumbList` **anche per le note**), breadcrumb visibile, `robots.txt` (agenti AI per nome + `Content-Signal`), sitemap (indice + figlie, **date che seguono i contenuti**, indice datato come le figlie), `lastmod`, l'**OG card di ogni articolo e nota** (ricavata dai registri, con il conteggio confrontato con le pagine costruite, e nessuna card orfana) e l'**`og:image` che ogni pagina dichiara** (letto dall'`<head>` di tutte le pagine costruite, e deve esistere: quando cade stampa il file mancante), annuncio della card markdown nella `<head>` **e** nel piè di pagina, link interni fra articoli e sezioni, TOC con gli anchor giusti, card `.md` (struttura e copia in `public/`), i **documenti di scoperta** (il `Link` di ogni pagina che punta a file che esistono, il linkset dell'`api-catalog`, il **digest ricalcolato** della skill, il documento RFC 9728 che deve restare **senza issuer**), le pagine legali che devono descrivere quello che il sito fa davvero (newsletter, form di feedback, chat AI, analytics), **nessun `<a>` dentro un `<a>`** e **nessun link interno rotto** su tutte le pagine esportate (la card del feedback conteneva il link al GitHub dell'autore dentro il link della card: HTML non valido, idratazione buttata via e pagina ricostruita sul client), 404 `noindex`, **nessuna traccia della dashboard privata** negli indici macchina (`sitemap*.xml`, `llms.txt`, `feed.xml`, `rag/index.json`) né un file scritto **intorno** alla pagina (la card `admin/feedback.md` era servita come asset statico — quel percorso non passa dalla Function — e raccontava la pagina privata a chi la chiedeva; `gen-cards.mjs` e `gen-rag.mjs` ora la saltano, `ForAICard` non annuncia una card che non esiste, e il controllo cade se torna), il **link della notifica** che segue l'host invece di una costante, gli **id di moderazione** confinati ai record `fb:`, il **focus ring** che non cambia la forma del controllo (una `border-radius` dentro una regola `:focus*` raddrizzava ogni pillola al focus), **la chat pubblica che non si disegna sulla dashboard** privata, **nessuna card sotto un percorso privato** (il 404 il middleware lo dà prima degli asset: la copia in cache di `admin/feedback.md` è sopravvissuta al deploy), il pannello Feedback della home senza il filetto nero doppio, peso dell'homepage (html+css < 118KB raw — alzato il 21/09 quando le `@font-face` del serif sono entrate nel CSS al posto del foglio di Google, che il conto non faceva) |

`verify.js` è deliberatamente **una cosa sola**: non è una suite, è un file che si
legge in un minuto e che aggiunge una riga per ogni regola che ci è già costata
qualcosa. Un controllo nuovo, qui, entra solo se prima ha **morso** una volta.

### 5.2 Dal vivo: `scripts/check-live.mjs`

`verify.js` è **offline**, e per questo non ha visto il guasto del 21/09: dentro il
build era tutto verde, mentre il sito dichiarava un dominio che non esiste. La
lezione non è "aggiungere un controllo", è **da dove si legge**: il controllo dal
vivo parte dalla **sitemap pubblicata** (che dice qual è il dominio che il deploy
dichiara davvero) e dalla **pagina pubblicata** (che dice quale `og:image`
dichiara). Confrontarlo con l'export locale direbbe solo che il computer è
d'accordo con sé stesso.

```bash
node scripts/check-live.mjs --site=https://mattiaciuni.pages.dev
```

Cosa morde, in ordine: il dominio **risolve in DNS** (il controllo che mancava),
`/sitemap.xml` risponde e non nomina un dominio diverso da quello che risponde,
ogni pagina elencata risponde 200 e dichiara **canonical di sé stessa** e una card
completa (`width`, `height`, `type`) **sullo stesso dominio**, e ogni card
dichiarata è raggiungibile ed è un'immagine. È il controllo che chiede la stessa
cosa che chiede Discord quando qualcuno incolla il link, cioè quando è tardi.

### 5.3 Provare il pezzo che esiste solo su Cloudflare

`public/_headers`, `public/_redirects`, `public/_routes.json` e il comportamento
degli indirizzi (la barra finale, la 404) **non girano** né in `next dev` né su un
server statico: li applica Pages.

```bash
npm run build && npx wrangler pages dev out    # workerd vero: Functions, _headers, _redirects, la barra finale, 404
```

È la prova che vale, perché è la stessa strada della produzione: `/` 200,
`/thoughts/<slug>/` **200 senza redirect** (è la forma canonica),
`/thoughts/<slug>` **308** verso quella con la barra, un indirizzo inventato 404 con
il corpo di `out/404.html`, su `/og.png` il `Content-Type` e il `Cache-Control` di
`_headers`, `Accept: text/markdown` che restituisce la card, e la canonical che
dichiara `http://127.0.0.1:8788` — cioè l'host che serve la pagina, che in locale è
proprio quello.

Qui è anche il posto in cui è stata **misurata** la scelta di `trailingSlash`:
con le pagine come file (`out/thoughts/<slug>.html`) Pages risponde 200 su
`/thoughts/<slug>` e fa 308 su `/thoughts/<slug>/`, cioè l'esatto contrario di ogni
canonical del sito. Con `trailingSlash: true` (pagine come `index.html`) la forma
canonica è quella che Pages serve da sé, senza reindirizzare.

---

## 6 · Portarlo in un altro progetto

### 6.1 Cosa è generico e cosa è dato di questo sito

**Generico (l'impianto, si copia):**

- registro → tutto il resto derivato; nessun artefatto generato scritto a mano;
- il dominio come **una sola stringa** (`lib/site-origin.ts`), letta da canonical,
  sitemap, `robots.txt`, `llms.txt`, JSON-LD, RSS e card;
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

**Dato di questo sito (si sostituisce, non si copia):** il dominio in
`lib/site-origin.ts` e in `NEXT_PUBLIC_SITE_URL`; email e social in `lib/site.ts`; la riga `en`; i 32 nomi dei bot (si aggiornano, l'elenco non è
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

- **Il dominio scritto in due posti.** Qui la stringa sta in un file solo
  (`lib/site-origin.ts`), le card (`scripts/gen-cards.mjs`) leggono solo `out/`,
  che è già canonico, e nessuno script Node ricopia il dominio. Il middleware ha
  bisogno di sapere quale dominio sta **dentro** l'export per poterlo sostituire:
  se quel file e l'export divergono, la sostituzione non trova niente — e`
  `verify.js` lo pretende uguale, con un controllo che spiega cosa aggiornare.
- **Un file generato che nessuno rigenera** dice una verità vecchia. Qui le card
  girano in `postbuild` **e** in `predev`, e `verify.js` controlla sia la copia
  di produzione sia quella di sviluppo: non esiste il caso «l'ho aggiornata a
  mano solo questa volta».
- **Il dominio che nessuno raggiunge.** È la trappola di questa giornata, e non
  la si vede da dentro: il build era verde, `verify.js` era verde, e il sito
dichiarava un dominio inesistente (`mattiaciuni.xyz`, NXDOMAIN dal registro
  `.xyz`) mentre rispondeva su un altro host. Le anteprime social erano l'unico
  sintomo visibile, e sono arrivate dagli utenti. La cura è doppia: il dominio
  segue l'host (§4.4) **e** `check-live.mjs` lo chiede al DNS (§5.2).
- **`_redirects` di Cloudflare ignora in silenzio oltre la centesima regola** (e
  su un Worker con static assets ignora anche le regole con un dominio dentro).
  Qui il file è vuoto; se un giorno serviranno, vanno in `functions/_middleware.ts`.

---

## 7 · Stato di oggi (21 settembre 2026)

Misurato adesso, non ricordato:

```text
14 pagine pubblicate (3 articoli · 3 note · home · 4 legali · 2 indici) + 404 + news sitemap
13 card markdown in out/ (e copia in public/ per lo sviluppo)
sitemap: un indice + tre figlie + news sitemap · URL e lastmod generati dai contenuti
robots.txt: 33 blocchi · 32 agenti AI per nome · Content-Signal dichiarato
JSON-LD: Person + WebSite · BlogPosting + BreadcrumbList · Article + BreadcrumbList · Blog
scoperta: Link su ogni pagina · api-catalog (1 linkset, 2 documenti) · 1 skill con digest
verify.js: controlli SEO/OG/discovery/news tutti verdi · homepage html+css 68.3KB raw · newsletter globale prima del footer · GA4 opzionale con consenso
font: self-hosted (Inter + Instrument Serif) · zero richieste a domini terzi · avatar 0,8KB WebP
pubblicazione: Cloudflare Pages · dominio dichiarato: https://mattiaciuni.pages.dev
```

**Fuori dal repository, e quindi da verificare sul live:**

- **Search Console**: registrazione del sitemap (proprietà di dominio via DNS) —
  è un gesto umano, una volta;
- **IndexNow**: nessuna chiave, nessun workflow (§2.5);
- **DNSSEC**: va acceso sulla zona e confermato dal registrar (il record DS). Non
  è una cosa da repository e nemmeno da questo lato: è l'unico pezzo della
  scoperta che vive nel DNS.

Correttamente **assenti**, per la regola del §4.2: OAuth/OIDC discovery, Web Bot
Auth, x402/MPP/UCP/ACP, DNS-AID, server card MCP, catalogo ARD, `openapi.json`.

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
scripts/verify.js              i 58 controlli locali (offline)
scripts/check-live.mjs         i controlli sul sito pubblicato (DNS, sitemap, canonical, card)
lib/site-origin.ts             l'unica stringa del dominio, letta da build, Function e controlli
functions/_middleware.ts       l'unico codice: markdown a richiesta + il dominio che segue l'host
public/_routes.json            quali rotte invocano la Function
agent-skills/<nome>/SKILL.md   la fonte a mano delle skill per gli agenti (una sola)
scripts/gen-agent-files.mjs    i documenti di scoperta, dai dati veri
public/_headers                tipo e cache dei file noti, header di sicurezza, Link di scoperta
docs/SEO.md                    il contratto di questo sito, file per file
docs/AUTHORING.md              come si scrive un articolo, con le regole editoriali
```
