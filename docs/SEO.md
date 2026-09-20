# Il contratto SEO del sito

Questo file dice **come la SEO di questo sito è fatta e chi la scrive**, perché le
due cose che la rompono non si vedono da fuori: un file scritto a mano che il
build non rigenera più, e una pagina nuova che esiste per l'utente e non per un
motore di ricerca. Non è una lista di buone intenzioni: ogni riga qui sotto nomina
il file che la fa, e c'è un comando che la controlla.

Le **regole editoriali degli articoli** stanno altrove, e sono un'altra cosa:
[`AUTHORING.md`](./AUTHORING.md). Qui c'è l'impianto, là cosa si scrive dentro.

---

## 1 · Una sola sorgente, e le pagine parlano da sole

Aggiungere una pagina significa **aggiungere una voce a un registro**, non toccare
la SEO:

| Cosa si aggiunge | Dove |
| --- | --- |
| un articolo (Thoughts) | `lib/posts.ts` |
| una nota (Notes) | `lib/notes.ts` |
| dominio, email, social | `lib/site.ts` |

Da quella voce, **senza scrivere nient'altro**, nascono: la rotta, il documento
statico esportato, il `<title>`, la `description`, la `canonical` con il
riferimento a sé stessa, l'Open Graph e la card, l'HTML, il JSON-LD, la riga nella
**figlia giusta** del sitemap, la **card markdown** (`/thoughts/<slug>` →
`/thoughts/<slug>.md`), l'ingresso in `llms.txt`, la riga nell'RSS, e i correlati
di tutti gli altri articoli. Una pagina dimenticata dalla SEO è quindi una pagina
che nessuno ha registrato — e `scripts/verify.js` cade sulle pagine che stanno nel
costruito e non in una figlia del sitemap, e su quelle che il sitemap annuncia e
non esistono.

Due dettagli che valgono come regole:

- **non c'è un interruttore di bozza.** Un articolo si scrive nel registro quando
  è pronto: finché non c'è, non esiste da nessuna parte (niente rotta, niente
  card, niente riga nel sitemap, niente JSON-LD, niente ingresso in `llms.txt`);
- **l'indirizzo canonico è una costante** (`site.url` in `lib/site.ts`), non una
  variabile: sitemap, `canonical`, `og:url`, `llms.txt`, RSS, JSON-LD e card la
  leggono tutti dallo stesso posto. Cambiare dominio è un numero solo.

**Niente `hreflang`**, perché il sito è in una lingua sola: dichiararlo per sé
stessi più `x-default` è rumore. Il giorno in cui esistono due lingue, il gruppo
va **nella `<head>`** e non nel sitemap (un elemento XHTML dentro il file del
sitemap è la riga che fa smettere Chrome di disegnarlo come albero dei tag).

## 2 · Chi scrive i file, e quali non si toccano a mano

| File pubblico | Chi lo scrive | Nota |
| --- | --- | --- |
| `out/**/*.html` | `next build` | una pagina per indirizzo, testata completa già dentro |
| `out/**/*.md` | `scripts/gen-cards.mjs` (`postbuild`, e `predev`) | la card di ogni pagina, ricavata **dall'HTML esportato** |
| `out/sitemap.xml` | `app/sitemap.xml/route.ts` + `lib/sitemap.ts` | **l'indice** (`<sitemapindex>`): nomina le tre figlie |
| `out/sitemap-home.xml` | idem | la home (1 URL) |
| `out/sitemap-thoughts.xml` | idem | l'indice Thoughts e i post (3 URL) |
| `out/sitemap-notes.xml` | idem | l'indice Notes e le note (4 URL) |
| `out/robots.txt` | `app/robots.txt/route.ts` | trentatré blocchi, di cui trentadue agenti AI per nome |
| `out/llms.txt` | `app/llms.txt/route.ts` | vedi §4 |
| `out/feed.xml` | `app/feed.xml/route.ts` | RSS |
| `out/manifest.webmanifest` | `app/manifest.ts` | |
| la `<head>` di ogni pagina | `generateMetadata` nella pagina, dai campi del registro | titolo, description, canonical, OG, JSON-LD, annuncio della card |
| `public/_headers`, `public/_redirects` | **a mano** | le regole di Cloudflare Pages (header di sicurezza, riscritture): riguardano il dominio, non la pagina, e sono l'unica cosa qui che nessuno rigenera |
| `public/og.png`, `public/thoughts/<slug>/og.png` | `scripts/og.ps1` | una volta, e quando cambia il dominio |
| `public/logo.svg` | `scripts/gen-logo.mjs` | dal `Vector.svg` in root |
| le card in `public/` (sviluppo) | `scripts/gen-cards.mjs` (`predev`) | la stessa card che finisce in `out/`, servita da `next dev` |

**Nessuno di questi si scrive a mano.** Un `sitemap.xml` scritto a mano è un
sitemap che alla prima rigenerazione perde le pagine nuove — e la rigenerazione lo
sovrascrive in silenzio, che è il modo peggiore: sembra funzionare finché non si
guarda il file.

**Le card sono un caso esemplare.** Non c'è un registro delle card: c'è
`scripts/gen-cards.mjs`, che legge l'HTML già esportato e ne ricava titolo,
description, data e vicini. Aggiungere un articolo non chiede di toccare niente,
e la card non può divergere dalla pagina perché **è** la pagina, riassunta. Gira
due volte — in `postbuild` per `out/`, in `predev` per lo sviluppo — e
`verify.js` controlla che la copia di sviluppo esista: un articolo senza card in
`npm run dev` è un 404 che il controllo prende prima del deploy.

**Il JSON-LD è un grafo**, non una raccolta di frammenti: `Person` + `WebSite`
sulla home, `BlogPosting` + `BreadcrumbList` su un articolo, `Article` +
`BreadcrumbList` su una nota, `Blog` sull'indice. Il `BreadcrumbList` dichiara i
passi che la pagina **mostra** (Home · Thoughts · titolo), e c'è anche per le
note, che pure sono contenuto semplice: un dato strutturato che parla di una
pagina che non conosce è peggio di nessun dato.

## 3 · Le reti

Tutto quello che si può controllare senza rete, in un comando:

```bash
npm run lint          # ESLint
npx tsc --noEmit      # i tipi
npm run build         # next build + le card
node scripts/verify.js   # 46 controlli sul costruito
```

`verify.js` è deliberatamente **una cosa sola**: un file che si legge in un
minuto, con una riga per ogni regola che ci è già costata qualcosa. Un controllo
nuovo entra solo se prima ha **morso** almeno una volta. Cosa morde, in breve: un
solo `h1` per pagina, canonical, OG, JSON-LD parseabile e completo (`Person`,
`WebSite`, `BlogPosting`, `Article`, `BreadcrumbList`), breadcrumb visibile e
coerente con il dato, `robots.txt` (agenti AI per nome, `Content-Signal`, riga
`Sitemap:`), sitemap (indice che nomina le figlie, nessun URL fuori posto, **date
che seguono i contenuti**, indice datato come le figlie), i **due annunci** della
card (piè di pagina e `<head>`), i link interni fra articoli e verso le sezioni,
la TOC con gli anchor che esistono davvero, le card `.md` (struttura e copia per lo
sviluppo), il 404 `noindex`, e il peso della homepage (HTML+CSS **raw** sotto i
56KB: un tetto, non un desiderio).

**Niente suite di test unitari, per ora, e vale la pena dirlo**: non c'è logica
pura da provare separatamente (`lib/related.ts` è l'unica candidata). Il giorno in
cui si aggiunge un calcolo — un'attribuzione, un ordinamento, una deduzione — il
suo test è la prima riga di quel lavoro.

**I controlli dal vivo non ci sono ancora, ed è la lacuna più onesta da
scrivere.** Il `dist` può essere perfetto e il file arrivare sul dominio tagliato
a metà, o servito con la pagina di ripiego. Tre richieste bastano, e sono tre modi
diversi di rompersi:

```bash
curl -sI https://<dominio>/robots.txt | head -1     # 200, e il tipo giusto
curl -s  https://<dominio>/sitemap.xml | head -3    # <sitemapindex, non la shell SPA
curl -s  https://<dominio>/index.md | head -1       # "# Mattia …", non "<!doctype"
```

Con un `--site=` diventano uno script; con un `--wait` diventano il passo che
aspetta il deploy, che è **l'unico momento** in cui la domanda «il sito è a
posto?» ha una risposta vera. E il pezzo che esiste solo su Cloudflare
(`_headers`, `_redirects`) si prova con `npx wrangler pages dev out`, perché né
`next dev` né un server statico li fanno girare.

## 4 · I crawler AI, e perché sono dichiarati per nome

`robots.txt` non si limita a `User-agent: *`: **trentatré blocchi**, trentadue dei
quali sono agenti AI per nome — GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
Claude-User, Claude-SearchBot, anthropic-ai, PerplexityBot, Perplexity-User,
Google-Extended, Applebot, Applebot-Extended, CCBot, Bytespider, Amazonbot,
meta-externalagent, Meta-ExternalFetcher, FacebookBot, YouBot, cohere-ai, Diffbot,
DuckAssistBot, MistralAI-User, ImagesiftBot, omgili, Webzio-Extended, PanguBot,
iaskspider, AI2Bot, AI2Bot-Dolma, Timpibot, Kangaroo Bot.

Il motivo è che un agente AI non è un motore di ricerca: molti non seguono il `*`,
e chi non trova il proprio nome decide da sé. Dirlo per nome toglie la decisione a
lui.

Sopra i robot c'è il **`Content-Signal`** (`ai-train=yes, search=yes,
ai-input=yes`), che è quello che il file già dice con i suoi trentadue `Allow: /`:
la riga serve perché `robots.txt` è l'unico posto in cui può **contraddire sé
stesso**, e un `ai-train=no` sopra trentadue `Allow: /` è una politica che nessuno
rispetta — non perché sia sbagliata, ma perché non si sa quale delle due valga.
`verify.js` pretende che i tre valori ci siano e dicano di sì, così una politica
che cambia cambia in due posti.

E poi **`llms.txt`**, generato come gli altri: chi è la persona in una riga, le
tre sezioni con **tutti** i titoli e i loro indirizzi, la riga che dice dove
stanno le card, i contatti. È il file che un motore generativo legge per primo:
dice cosa c'è e come raggiungerlo, non ripete il contenuto.

Il resto del corredo per gli agenti — cosa si pubblica, cosa **non** si pubblica e
perché, e cosa servirebbe per accenderlo — sta in
[`SEO-GEO-AI.md`](./SEO-GEO-AI.md) §4.

## 5 · La card markdown di una pagina

Ogni pagina esiste **anche come card**, allo stesso indirizzo con l'estensione
cambiata: `/thoughts/money-layer-for-ai-agents` →
`/thoughts/money-layer-for-ai-agents.md` (la radice, che un nome non ce l'ha, è
`/index.md`).

**Da dove viene.** Non da un registro, ma dall'HTML **già esportato**:
`scripts/gen-cards.mjs` legge `out/` e ne ricava il documento. È l'unico modo per
cui la card non può dire una cosa che la pagina non dice — cambiare un articolo
cambia la pagina, e la card segue senza che nessuno si ricordi di niente.

**Come è fatta.** Un'intestazione che è un documento, perché un file che esce dal
sito deve poter essere citato senza aver visto la pagina:

```markdown
# Il titolo che la pagina scrive

> La description della pagina

- URL: https://mattiaciuni.xyz/thoughts/<slug>
- Type: Blog post
- Published: 2026-09-20

- [Thoughts index](thoughts.md)
- [Home](../index.md)
```

I collegamenti sono **relativi**: un file fuori dal sito non ha una pagina da cui
risolvere un `/thoughts/`, e chi lo legge da solo deve poterlo seguire lo stesso.
Il titolo markdown è una riga, la description è la citazione, i metadati sono
quelli che il registro dichiara (data, tipo), e i vicini sono i due link di
orientamento — non un indice intero.

**Chi la nomina.** In due posti, e sono la stessa riga scritta per due lettori. Il
collegamento sta in fondo al piè di pagina, «For AI: /thoughts/<slug>.md», ed è
l'unico elemento presente su **tutte** le pagine; la `<head>` la annuncia come
`<link rel="alternate" type="text/markdown" href="/…md">` — stesso
`rel="alternate"` della `canonical`, perché è la stessa domanda («di questo
indirizzo esiste un'altra forma?»), con il `type` a dire **quale** forma. Il
secondo esiste perché un crawler **non esegue la pagina**: se la card la nominasse
solo il piè di pagina, la nominerebbe il posto che una macchina non guarda.

I due annunci si controllano **separatamente**, ognuno con la sua lettura del
documento (`verify.js`): chiedendo se l'indirizzo compare *da qualche parte* nella
pagina, il controllo passerebbe **anche** con uno dei due sparito — è la lezione
che questo file porta da un altro progetto, dove il controllo passava mentre metà
annuncio non c'era più.

**Una cosa che qui non c'è, e va detta:** la versione testo **integrale** della
pagina. La card è un documento (dice cosa è la pagina e dove stanno i vicini); una
trascrizione completa è un'altra cosa e serve solo a chi ha già deciso di leggere
quella pagina. Il giorno in cui serve, si costruisce dal documento esportato, con
il suo annuncio in `<head>` e un controllo che dica la stessa pagina della card.

## 6 · La notifica, e quando parte

**Oggi non parte.** Il sitemap è dichiarato in `robots.txt` (la riga `Sitemap:`),
che è **scoperta** e non notifica: il motore la legge quando ripassa, non quando
pubblichiamo. Le due strade che restano, e cosa serve per aprirle:

| Strada | Cosa serve | Perché |
| --- | --- | --- |
| **IndexNow** (Bing, Yandex, Seznam, Naver) | una chiave nel `.env` di build, il file `<chiave>.txt` generato in `out/`, uno script che confronta il live con il nuovo `out/` e manda **solo** le URL cambiate, e un workflow che lo lancia **dopo** il deploy | due passi contano: la chiave deve essere **raggiungibile sul dominio** e identica al `dist` (IndexNow scarta una notifica con chiave sbagliata **in silenzio**), e l'istantanea di cosa i motori conoscevano va presa **prima** del deploy, o dopo il live *è* il nuovo build e il confronto direbbe «niente di nuovo» ogni volta |
| **Search Console** (registrazione + API) | proprietà di **dominio** verificata via DNS (una volta), `sitemap.xml` registrato a mano: **non le figlie**, o le stesse URL si contano due volte | è l'unico modo che Google ammette, e l'unico posto dove si **vedono gli errori** |
| ~~ping a Google~~ | niente | l'endpoint HTTP è deprecato dal 2023: una richiesta lì è un **404**, cioè un verde sopra una richiesta rifiutata |

**La terza leva è `lastmod`, ed è la più delicata.** Google scrive che `lastmod`
è utile *a patto che dica la verità*, altrimenti «eventually we're not going to
believe you anymore». Per questo le date qui **seguono i contenuti** (§2, `lib/sitemap.ts`):
una data scritta a mano o ferma su un indice è esattamente il caso in cui il
motore smette di crederci, e `verify.js` la prende.

**Statistiche: nessuna, e deliberatamente.** Non c'è GA4, non c'è PostHog, non
c'è consenso da raccogliere — perché non c'è niente da caricare. Il giorno in cui
si aggiunge uno script di terze parti: il **consenso è il cancello** (senza
consenso non parte nessuno script, e la CSP lo rispecchia), e il primo tocco di
una sessione si persiste solo dopo. Aggiungere analytics non è una decisione di
marketing, è una decisione sulla CSP, sui tempi del primo schermo e sulla
privacy di chi legge: va presa sapendo cosa si paga.

## 7 · La pagina nuova, in ordine

1. Voce nel registro giusto (`lib/posts.ts` per un articolo, `lib/notes.ts` per
   una nota), con `title`, `description`, `date` e `keywords`.
2. Titolo entro i settanta caratteri, description entro i 170.
3. `npm run build` e `node scripts/verify.js`.
4. Guardare nel costruito: una delle figlie del sitemap nomina la pagina,
   `out/<path>.html` esiste, la `canonical` dice sé stessa, `out/<path>.md` è la
   card della stessa pagina, e `verify.js` non ha avuto niente da dire.

Per un articolo, i passi editoriali e i campi obbligatori stanno in
[`AUTHORING.md`](./AUTHORING.md).
