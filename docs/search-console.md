# Search Console: togliere dall'indice gli indirizzi vecchi e accelerare il ricrawl di `mattiaciuni.com`

6 ottobre 2026. Il sito ha un dominio proprio dal 5 ottobre, e il vecchio
indirizzo risponde 301. Ma un 301 non è una cancellazione: Google continua a
servire l'istantanea che aveva, con il titolo che aveva allora, finché non
ripassa da quelle URL. Questo file è la sequenza esatta dei passi manuali per
far finire quel periodo, e per farlo finire prima.

Nessuno di questi passi si può fare dal repository, e nessuno è obbligatorio per
il sito: il sito funziona. Sono i passi che decidono **cosa dicono i motori**, e
quello che dicono i motori è la ragione per cui esiste tutto il resto.

## 0 · Il punto di partenza, verificato

| Cosa | Stato al 6 ottobre 2026 |
| --- | --- |
| `https://mattiaciuni.com/` | `200`, titolo `Mattia Ciuni \| Founder & CEO at Noesia, AI agent payments` |
| `https://mattiaciuni.pages.dev/` | `301` → `https://mattiaciuni.com/` (percorso e query intatti) |
| `https://www.mattiaciuni.com/` | `301` → `https://mattiaciuni.com/` |
| sitemap sull'origine | `sitemap.xml` è un indice con 4 figlie, più `news-sitemap.xml` |
| indici che servono ancora il titolo vecchio | l'istantanea di settembre dell'host ritirato, e le pagine dell'altro marchio (§7) |

Il 301 è già in produzione e già provato: `npm run test:domain` importa la
funzione e la chiama con richieste vere, quindi il comportamento è verificato
senza aspettare un deploy.

## 1 · Le proprietà, una volta sola

| Proprietà da creare | Tipo | A che serve |
| --- | --- | --- |
| `mattiaciuni.com` | **Dominio** (verifica DNS) | copre apex, `www` e ogni sottodominio, sopravvive a un cambio di schema. È quella che conviene tenere come principale |
| `https://mattiaciuni.com/` | Prefisso URL | se vuoi il report per prefisso e il confronto puntuale con l'inventario vecchio |
| `https://mattiaciuni.pages.dev/` | Prefisso URL | serve per il rapporto dell'host vecchio (§4) e per il tool "Cambio di indirizzo" (§3) |

**La proprietà Dominio si verifica senza toccare il sito.** Nella zona
`mattiaciuni.com` ci sono già due record `TXT` `google-site-verification`. Il
passo è: Search Console → *Aggiungi proprietà* → **Dominio** → `mattiaciuni.com`
→ il record è già presente → *Verifica*. Nessun deploy, nessun file caricato.

**La proprietà dell'host vecchio è il caso non ovvio.** Il DNS non è
un'opzione: `pages.dev` è un dominio di Cloudflare, non una zona tua, quindi non
puoi aggiungerci record. Resta il metodo del file HTML, e qui c'è una cosa che
conviene sapere prima di provarci: **il 301 copre ogni percorso instradato**,
compreso `/robots.txt`, quindi un file di verifica messo su una pagina non
risponderebbe. Ma i file statici non passano dalla Function — è
`public/_routes.json` a decidere quali percorsi la Function vede — e questo si
vede dal vivo: `https://mattiaciuni.pages.dev/og.png` risponde **200** mentre
`/robots.txt` risponde **301**. Quindi il file di verifica funziona, a due
condizioni:

1. va messo in `public/` con il nome esatto che Search Console genera
   (`google<hash>.html`);
2. il suo percorso **non** deve finire nell'elenco `include` di
   `public/_routes.json` — oggi quell'elenco è di percorsi noti, un file nuovo
   non c'è, quindi la condizione si soddisfa da sé. Se un giorno
   `scripts/gen-redirects.mjs` allargasse le regole a un prefisso, il file
   verrebbe instradato e la verifica smetterebbe di funzionare: è l'unico modo
   in cui questo passo può rompersi.

Serve comunque un deploy perché il file arrivi anche su `pages.dev`.

## 2 · Le sitemap da inviare

| Endpoint | Che cos'è | In `robots.txt` |
| --- | --- | --- |
| `/sitemap.xml` | **indice**: contiene `sitemap-home`, `sitemap-thoughts`, `sitemap-notes`, `sitemap-feedback` | sì |
| `/news-sitemap.xml` | le ultime pubblicazioni, per Google News | sì |
| `/sitemap-home.xml` | le pagine fisse (home, about, work, link, careers, legali, lingue) | scoperta dall'indice |
| `/sitemap-thoughts.xml` | gli articoli pubblicati a oggi | scoperta dall'indice |
| `/sitemap-notes.xml` | le note | scoperta dall'indice |
| `/sitemap-feedback.xml` | il registro pubblico del feedback | scoperta dall'indice |

Search Console → *Sitemap* → incolla `sitemap.xml` → *Invia*. Poi `news-sitemap.xml`.
Le quattro figlie non vanno inviate una per una: sono dentro l'indice e vengono
scoperte da lì. L'endpoint con la barra finale (`/sitemap.xml/`) è già
reindirizzato dal file `public/_redirects`, quindi una variante rimasta appesa in
Search Console continua a rispondere `301` verso quella giusta invece di dare 404.

Il segnale che conta in questo file è `lastmod`: è quello che fa rileggere una
sitemap senza che nessuno la re-invii.

## 3 · Cambio di indirizzo

Search Console → *Impostazioni* → *Cambio di indirizzo*. Richiede che **entrambe**
le proprietà siano verificate: quella nuova e quella vecchia. Poi indica
`https://mattiaciuni.com` come sito nuovo e `https://mattiaciuni.pages.dev` come
sito precedente.

Da dire com'è, invece di darlo per fatto: Google non offre questo tool quando il
sito precedente è un sottodominio di un dominio che non controlli. Con
`pages.dev` può semplicemente non comparire. Se non compare, non è un guasto e
non c'è niente da forzare: il segnale lo sposta il `301`, che c'è già, insieme
alle `canonical` e alla sitemap. Il cambio di indirizzo è la scorciatoia, non il
meccanismo.

## 4 · Far sparire gli URL vecchi dall'indice

Search Console (proprietà dell'host vecchio) → *Rimozioni* → *Nuova richiesta* →
**Rimuovi tutte le URL con questo prefisso** → `https://mattiaciuni.pages.dev/`.

Cosa fa e cosa non fa, per non aspettarsi la cosa sbagliata:

- **Nasconde, non cancella.** La rimozione è temporanea (circa sei mesi) e
  riguarda solo la presenza nell'indice. Non modifica il sito e **non tocca
  `mattiaciuni.com`**: sono due proprietà diverse, e la richiesta è sull'altra.
- **Non è una perdita.** Le URL rimosse rispondono comunque `301` verso la
  destinazione: chi arriva da un vecchio link finisce dove deve. Sei mesi sono
  più che sufficienti perché il ricrawl consolidi l'origine nuova.
- **Non è un sostituto della correzione.** Se l'istantanea vecchia resta nei
  risultati, il motivo è che le sue URL sono ancora note a Google: la rimozione
  toglie il sintomo mentre il `301` fa il resto.
- Per un singolo indirizzo che dà fastidio più degli altri, la stessa pagina ha
  la modalità per una URL sola.

Per vedere l'elenco esatto degli indirizzi vecchi si prende la sitemap attuale e
si sostituisce l'host, senza scrivere niente a mano:

```bash
curl -s https://mattiaciuni.com/sitemap.xml
curl -s https://mattiaciuni.com/sitemap-home.xml
curl -s https://mattiaciuni.com/sitemap-thoughts.xml
# e così via per le altre due; l'host vecchio è lo stesso percorso su mattiaciuni.pages.dev
```

## 5 · Accelerare il ricrawl di quelli nuovi

Search Console → *Ispezione URL* → incolla l'indirizzo → *Verifica URL attivo*.
Se la risposta è "URL disponibile per Google", appare **Richiedi indicizzazione**.

In quest'ordine, perché è l'ordine in cui le pagine contano per l'entità:

1. `https://mattiaciuni.com/`
2. `https://mattiaciuni.com/about/`
3. `https://mattiaciuni.com/work/`
4. `https://mattiaciuni.com/link/`
5. `https://mattiaciuni.com/thoughts/`
6. `https://mattiaciuni.com/en/` e `https://mattiaciuni.com/it/`
7. il pezzo pubblicato oggi (`/thoughts/<slug>/`)

I limiti, detti chiaramente: la richiesta manuale ha un tetto giornaliero per
proprietà (una manciata), non è un interruttore e non garantisce la priorità.
Serve a una cosa sola: mettere in coda *quella* URL invece di aspettare il
prossimo passaggio. Se il tetto è finito, la richiesta si sposta a domani e non
succede niente di male — la sitemap lavora comunque.

Il `lastmod` delle sitemap è aggiornato dalle build, e il build chiama già due
strumenti: `scripts/ping-indexnow.mjs` (annuncia a IndexNow, quindi Bing e gli
altri che lo leggono) e `scripts/submit-google-sitemap.mjs`. Il secondo, se non
ha le credenziali, non fa niente e lo dice una riga nel log (vedi §6).

## 6 · L'unico pezzo di automazione che può mancare (opzionale)

`scripts/submit-google-sitemap.mjs` legge tre variabili e **salta in silenzio**
se non ci sono:

| Variabile | Valore |
| --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | l'email del service account |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | la chiave privata, con i `\n` letterali |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | **dipende dal tipo di proprietà**: `https://mattiaciuni.com` per una proprietà prefisso URL, `sc-domain:mattiaciuni.com` per una proprietà Dominio |

Lo script controlla che questa site URL corrisponda all'origine esportata e
altrimenti si ferma: un invio di sitemap all'origine sbagliata non fallisce mai
da solo, quindi quel controllo è la parte che vale.

Per attivarlo: crea un service account su Google Cloud, abilita la Search
Console API, poi in Search Console → *Impostazioni* → *Utenti e autorizzazioni*
→ *Aggiungi utente* con permesso **completo** per quell'email, e infine metti le
tre variabili fra le env di produzione del progetto Pages. Senza il passaggio in
Search Console la Sitemap API risponde **403**, e l'unico sintomo sarà la riga
"skipped" nel log della build.

## 7 · L'altra superficie, quella con il marchio ritirato

Qui un file del repository non può essere esplicito, e il motivo è voluto:
`npm run check:brand` vieta il nome ritirato in **ogni** file tracciato, perché è
la stessa regola che impedisce al sito di chiamarsi in due modi diversi. Quindi le
superfici si leggono dal monitor, che il nome lo ricava dal guard invece di
scriverlo:

```bash
npm run check:external-brand
```

Al 6 ottobre 2026 l'uscita dice che il sito aziendale dell'altro marchio serve
ancora il nome vecchio nella home, nel file di fatti per i knowledge graph, nella
card markdown della home e in **due pagine di persona** — le due che rispondono a
una ricerca sul nome. E per tutte e cinque dichiara una `canonical` su un host
che non è più l'origine, quindi Google non riesce nemmeno a consolidare.

La sequenza lì è: prima il contenuto (titolo, `llms.txt`, `index.md`, e le due
pagine di persona), poi la rimozione. L'ordine non è un gusto: la rimozione
nasconde una URL per sei mesi, ma se il sito continua a servire il nome vecchio,
al primo ricrawl il nome torna. Nella zona di quel dominio ci sono già due record
`TXT` `google-site-verification`, quindi la proprietà è già verificata e il tool
di rimozione è disponibile.

## 8 · Come si verifica che sia andata

```bash
npm run test:domain            # il 301: host, percorso, query, anteprime
npm run check:external-brand   # cosa dicono ancora le superfici esterne (exit 1 = il nome è pubblicato)
curl -sI https://mattiaciuni.pages.dev/ | head -3   # il 301 dal di fuori, dopo il deploy
```

Il monitor gira da solo una volta a settimana: `Actions` → *Watch the retired
brand outside the repo* (`·github/workflows/brand-watch.yml`). Verde vuol dire
che ogni superficie raggiungibile è pulita; **giallo** vuol dire che una
piattaforma ha risposto con una pagina di blocco e il controllo è incompleto, non
che è andato bene; rosso vuol dire che il nome vecchio è di nuovo pubblicato da
qualche parte.

Dentro Search Console, le due schermate che dicono la verità: *Pagine*
(indicizzate, escluse, non trovate) per entrambe le proprietà, e *Sitemap* →
*Ultima lettura*. Il risultato finale però è una ricerca: l'istantanea vecchia
sparisce dal risultato solo dopo che Google ha ripassato da quelle URL, e le due
date che lo governano sono la richiesta di rimozione e il ricrawl — non il
deploy.

## 9 · Cosa non fare

- **Non cancellare `mattiaciuni.pages.dev`.** È il `301` che sposta il ranking:
  senza risposta, chi ha ancora quel link prende un 404 e il rango resta dove
  era. Il file `docs/domain-migration.md` lo dice anche per il rollback.
- **Non mettere `noindex` sull'host vecchio.** Su una risposta `3xx` Google lo
  ignora: sarebbe una riga in più che non fa niente e che sembra fare qualcosa.
- **Non bloccare Googlebot su `pages.dev`** e non toccare `robots.txt` per
  questo: il sito è già tutto pubblico, ed è una scelta voluta.
- **Non usare *Rimuovi* su `mattiaciuni.com`.** Si rimuove l'istantanea vecchia,
  non l'origine che stai cercando di far leggere.
- **Non cambiare dominio una terza volta.** Due cambi di indirizzo nella storia
  di un sito lo fanno leggere come instabile, e il 301 è pensato per durare.
