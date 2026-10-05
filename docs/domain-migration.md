# Migrazione del dominio: `mattiaciuni.pages.dev` → `mattiaciuni.com`

5 ottobre 2026. Il sito ha un dominio proprio. Questo file è il perché, i
passi, e come si torna indietro.

## Il problema che si sta risolvendo

Cloudflare Pages assegna a ogni progetto un indirizzo gratuito,
`<progetto>.pages.dev`. Funziona, ma è un indirizzo che Cloudflare può
riassegnare e che non dice niente di chi scrive: ogni `canonical`, ogni
`<loc>`, ogni card markdown, ogni link nei feed dei lavori porta lì. Un
indirizzo di passaggio è una scelta che si fa per sempre, e questa si era fatta
solo perché il dominio non era pronto.

Il dominio è diventato pronto oggi, e il sito è stato spostato.

## La regola che tiene insieme tutto

Un solo file dichiara l'origine production: `lib/site-origin.ts`. Da lì escono
`metadataBase`, i `canonical`, le sitemap, `robots.txt`, `llms.txt`, il feed RSS,
gli URL dei feed per i lavori, l'Open Graph e il JSON-LD. Il build **rifiuta**
un valore diverso di `NEXT_PUBLIC_SITE_URL`, quindi né `.env.example` né una
variabile sbagliata possono cambiare il dominio SEO per sbaglio.

`functions/_middleware.ts` fa la parte che un export statico non può fare: se la
richiesta arriva da un host che non è più l'origine (il sottodominio
`mattiaciuni.pages.dev` del progetto, o il `www`), risponde **301** verso
`https://mattiaciuni.com` con la stessa query e lo stesso percorso.

Perché in codice e non in `public/_redirects`: le regole di Cloudflare Pages con
il dominio dentro non si comportano allo stesso modo su tutti i runtime, e se la
parte di dominio viene ignorata la regola diventa `/*` e rimanda l'apex verso
sé stesso — un loop, che su un sito SEO è peggio di nessun redirect. Su questo
piano (Free) non c'è nemmeno Bulk Redirects, che è la strada che
ufficialmente consiglierebbe Cloudflare per `*.pages.dev`.

Il 301 copre tutto ciò che è una pagina: le 204 pagine esportate, sitemap,
feed, le card `.md` e le API. È `public/_routes.json` a decidere quali
percorsi arrivano alla funzione, perché è l'unico codice che vede l'host della
richiesta — e a scrivere quelle regole a mano il buco è stato reale: il primo
deploy rispondeva 301 su `/thoughts/` e **200** su `/about/`, `/feedback/` e
tutte le versioni localizzate. Sul vecchio host, il sito esisteva due volte.

Non copre i file statici (immagini, CSS, font in `/_next/`), che sono gli stessi
byte sotto due host e non hanno un rango da difendere.

`scripts/verify.js` rilegge le pagine dall'export e fallisce se una non è
instradata, quindi la prossima pagina nuova non può ripetere la cosa: rimuovere
una riga da `_routes.json` fa fallire il build e nomina le pagine rimaste fuori.

## Cosa è stato fatto su Cloudflare

| Cosa | Perché |
| --- | --- |
| Rimosso `A 217.160.0.168` e `AAAA 2001:8d8:100f:f000::200` (hosting IONOS) | Erano la causa del **525** (origin che non parla TLS) e occupavano il nome apex: finché ci sono, Pages non può essere collegato. MX, SPF, `autodiscover`, `_dmarc` e `_domainconnect` **non** sono stati toccati: è la posta. |
| `mattiaciuni.com` aggiunto come custom domain del progetto Pages `mattiaciuni` | È il nome che il sito deve avere. |
| `www.mattiaciuni.com` aggiunto come custom domain | Serve il certificato: senza, il `www` non risponde in HTTPS e un redirect non si può nemmeno fare. |
| `CNAME mattiaciuni.com → mattiaciuni.pages.dev` (proxied) | Il record che collega il dominio al progetto. |
| `CNAME www.mattiaciuni.com → mattiaciuni.pages.dev` (proxied) | Idem per il `www`. |
| `NEXT_PUBLIC_SITE_URL` aggiornato a `https://mattiaciuni.com` in production **e** preview | Va fatto **prima** del primo deploy post-migrazione: il build legge questa variabile e fallisce se non coincide con `lib/site-origin.ts`. |

Il `mattiaciuni.pages.dev` **non** è stato cancellato e non va cancellato: è
l'indirizzo che Google e Bing hanno indicizzato per due settimane. Se
scomparisse, chi ha ancora quel link prenderebbe un 404 e il ranking che il 301
doveva spostare resterebbe dove era, su un indirizzo che non serve più.

## Come si verifica

```bash
npm run test:domain     # 301, percorso e query intatti, www raddrizzato, anteprima e production intatti
node scripts/verify.js  # check "origin: the middleware 301s every retired host…"
npm run check:brand
```

`npm run test:domain` importa la funzione e la chiama con richieste vere: è
l'unico modo di vedere un redirect senza deploy. Un `curl -I` sul dominio
pubblico, dopo il deploy, dice la stessa cosa dal di fuori.

## Cosa resta da fare a mano, lato motori

Nessuno di questi passi si può fare dal repository, e sono quelli che valgono
qualcosa:

1. **Google Search Console — proprietà `https://mattiaciuni.com`.** I due record
   `google-site-verification` sono già nella zona. Invia `sitemap.xml`.
2. **Google Search Console — "Cambio di indirizzo"** (Search Console → *Impostazioni*
   → *Migrazione*), con `mattiaciuni.com` come nuovo sito e
   `https://mattiaciuni.pages.dev` come precedente. È lo strumento che Google ha
   costruito apposta per questo caso e che sostituisce il redirect da solo: va
   comunque fatto, insieme al 301, non al posto del 301.
3. **Bing Webmaster Tools** — proprietà nuova, e la stessa segnalazione di
   migrazione. L'`INDEXNOW_KEY` del progetto Pages continua a valere.
4. **Verificare che il sito vecchio non avesse URL indicizzati che il nuovo non
   ha.** Se l'hosting IONOS serviva un sito diverso sotto lo stesso dominio, i
   suoi indirizzi non esistono più nella sitemap e rispondono 404. L'unica fonte
   è Search Console → *Copertura*, filtrata per `mattiaciuni.com` con data anteriore
   alla migrazione. Le righe scoperte vanno aggiunte a `public/_redirects` come
   `/vecchio  /nuovo  301` (regole di percorso, non di host).

## Come si torna indietro

Il rollback è un ripristino di DNS, e i valori sono qui per quello:

```bash
# ricreare l'apex sull'hosting precedente (zona mattiaciuni.com)
A     mattiaciuni.com  217.160.0.168                 proxied
AAAA  mattiaciuni.com  2001:8d8:100f:f000::200       proxied
```

Dal lato codice, tornare indietro è una riga: `PRODUCTION_ORIGIN` in
`lib/site-origin.ts`, il valore in `.env.example` nel progetto Pages, e la
lista `RETIRED_HOSTS` nel middleware. Il file più lungo da toccare è la
documentazione, perché qui il dominio è scritto in ogni riga di prosa.

Il rollback SEO non è gratis: un dominio che è stato dichiarato production,
indicizzato e poi dichiarato di nuovo ha due cambi di indirizzo nella sua
storia, e i motori non lo trattano come un sito stabile. Per questo il 301 è
permanente e il resto è pensato per durare.