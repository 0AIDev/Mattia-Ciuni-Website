# Pannello admin

Il pannello e' l'unico posto dove si opera il sito. Nove sezioni, una barra
laterale fissa e un blocco centrale che scorre da solo, nessuna sottopagina.

## Perche' ha un aspetto suo

Il pannello non usa il design system del sito pubblico, e non e' una
dimenticanza. Il sito e' editoriale: serif, pill, raggi grandi, dark mode. Il
pannello e' uno strumento: sans, raggi da 6px, altezze da 28px, una sola
modalita'.

Le due scelte che valgono per tutto:

- **Monocromo.** Non c'e' un colore di stato: c'e' un punto pieno, un punto
  vuoto e la parola accanto. Dieci significati in dieci colori smettono di
  comunicare, e il colore non porta nessuna informazione che il testo non porti
  gia'.
- **I token stanno in `tailwind.config.ts`** sotto `admin` (nove tinte), piu'
  tre regole in `app/globals.css` per quello che Tailwind non copre: raggio dei
  campi, focus, cifre tabulari. Il sito pubblico non le vede, perche' sono sotto
  `#admin-feedback-page`.

Le icone sono `components/admin/icons.tsx`: dodici path disegnati a mano sulla
stessa griglia, invece di un pacchetto da 1500 icone per usarne dodici.

| Sezione | Cosa fa | Endpoint |
| --- | --- | --- |
| Overview | metriche, stato dei draft, coda | GET `/api/admin/feedback` |
| Content | articoli, note, feedback, pagine, voice note, video, job, redirect, tassonomie, meta media, impostazioni | `content_save`, `content_publish`, `content_discard`, `content_restore`, `content_history` |
| Site copy | override di copy per lingua, tassonomie, impostazioni del sito | come Content, con il filtro kind |
| Media | upload su R2, alt text, caption, URL pubblico, delete | `/api/admin/media` |
| SEO | redirect, pagine e lingue, metadata da rivedere | kind `redirect` e `page` in Content |
| Careers | offerte di lavoro e candidature | `jobs_save`, GET |
| Inbox | feedback da moderare e candidature | `publish`, `reject` |
| Analytics | visitatori, pagine, flusso, acquisizione, conversioni | GET |
| Settings | stato del publishing, link NDA, note su analytics e privacy | `settings_read`, `nda_create` |

## Come funziona

1. **Draft** in Supabase (o KV): rapidi, annullabili, nessun deploy.
2. **Publish**: la Function autenticata scrive `content/cms/<kind>/<slug>.json`
   con la GitHub Contents API e crea un commit.
3. **Build**: quel commit **e'** la richiesta di build. Cloudflare Pages
   costruisce ogni push sul branch di produzione. `next build` legge
   `content/cms/` e sovrascrive i registry in codice: un file con lo stesso
   slug vince sul registry, quindi un override e' sempre reversibile
   cancellando il file.
4. **Deploy** su Cloudflare Pages, che serve l'export statico. La build scrive
   l'ora in cui e' finita in `out/deploy.json`, e il pannello la usa per dire
   quando una modifica e' davvero online.

### Una modifica, una build

Chiamare anche una seconda build dopo il commit raddoppiava le build di ogni
publish, e le build di produzione girano una alla volta: la copia giusta
finiva `skipped` e l'attesa raddoppiava. Misurato sulle deployment reali
dell'account, tre publish in sequenza (12:39-12:40) hanno prodotto sei build,
tre `skipped`, e l'ultima utile e' arrivata online **128 secondi** dopo il
click. Con una build sola la stessa coda si svuota in una quarantina di
secondi.

Lo stesso vale dentro un publish: `publishContentToGit` confronta il file che
sta su Git con quello che verrebbe scritto e, se sono identici, non committa.
`jobs_save` su tre offerte ne scriveva tre anche cambiando un solo campo, quindi
accodava tre build per una parola.

Il pulsante **Rebuild the site** in Settings (`content_rebuild`) serve per una
build fallita, un deploy saltato, o un sito piu' vecchio di Git. Anche lui spinge
un commit, vuoto: vedi sotto.

### Come il pannello sa che una modifica e' online

`out/deploy.json` contiene `built_at` e il commit della build, ed e' servito con
`Cache-Control: no-store`. L'azione `deploy_status` lo legge e lo confronta con
l'istante del publish, restituendo `live: true`, `false`, o `null` quando non c'e'
un punto di partenza (senza riferimento non si puo' dire "online", e dirlo lo
faceva chiudere il conto al primo giro di polling).

Il pannello mostra la riga sotto ai pulsanti che hanno premuto e in fondo alla
barra laterale: `Deploying 12s` e poi `Last build 4s ago`. Senza questo
l'unica risposta era "published" e il resto toccava a chi guardava il sito.

Il file nasce con la build successiva a quella che l'ha introdotto, quindi su un
deploy vecchio `deploy_status` risponde `available: false` e il pannello dice
"last build unknown" invece di mentire.

Tornare indietro sono **due** operazioni, e sembravano una sola:

- `content_discard` — *Load published version*: rilegge il file dal branch e
  sostituisce il draft locale. Non crea commit, non chiede deploy, perche' la
  versione su Git e' gia' quella online.
- `content_restore` — riporta il file allo stato di un commit scelto e quindi
  **scrive**: nuovo commit, nuovo deploy. E' l'operazione "questo publish mi ha
  rotto la pagina".

Il pulsante mandava `sha: "HEAD"` alla seconda: il validatore rifiutava quello
sha con un 400 e il pulsante non ha mai funzionato.

### Due tetti di corpo, non uno

`8KB` vale per login, moderazione, NDA e logout. `1MB` vale per `content_save` e
`jobs_save`, le due sole azioni che trasportano contenuto. Con un tetto unico da
8KB, tre dei diciassette contenuti gia' pubblicati (12KB, 10KB, 8.4KB) non si
potevano salvare: il pannello diceva "The CMS draft could not be saved" su un
articolo lungo, senza dire perche'.

L'ordine dei controlli: il tetto grande si applica alla `Content-Length`
dichiarata, prima di bufferizzare (l'azione sta dentro il corpo); il tetto
piccolo si riapplica dopo il parsing sull'azione reale, e vale anche per una
lunghezza dichiarata che mente.

### Il file pubblicato deve essere JSON leggibile

Il publish aggiungeva `"\\n"` invece di un ritorno a capo: due caratteri,
backslash e n, dopo la graffa finale. Il file era corrotto, il loader della
build lo scartava con un `console.warn` e **il contenuto pubblicato non arrivava
mai online**, mentre publish, commit e deploy sembravano tutti riusciti.
`lib/cms-format.ts` ha ora un `parsePublishedJson` che accetta anche quella
forma, cosi' un file gia' scritto male non sparisce dal sito.

## Pagine nuove, senza toccare il codice

Una pagina `kind: "page"` diventa una route reale a
`/<lingua>/p/<slug>/`, generata per **ogni lingua elencata** nel campo
`Languages`. Il campo e' una lista esplicita, non un flag: una pagina senza
lingue esiste solo in inglese. Il motivo e' che una traduzione Francese scritta
male fa piu' danno di una versione assente, quindi il pannello mostra quante
lingue mancano invece di pubblicarle in silenzio.

Ogni pagina generata finisce nella sitemap, nelle card `.md`, nel RAG e nel
footer, e dichiara `hreflang` solo per le lingue in cui esiste.

## Media

I file stanno in un bucket R2 **privato** e sono serviti da
`functions/media/[[path]].ts` a `/media/<key>`.

- Estensioni accettate: PNG, JPG, WebP, AVIF, GIF, MP3, M4A, WAV, OGG, WebM,
  MP4, PDF. Massimo 10MB.
- **SVG e HTML sono rifiutati.** Serviti da questo dominio diventerebbero
  contenuto attivo, e da li' uno `<script>` e' XSS con il cookie di sessione.
- Il MIME servito e' calcolato dall'estensione, non da quello dichiarato dal
  browser: un file rinominato viaggia con il suo `Content-Type` originale.
- Le chiavi sono normalizzate a `content/<nome>`: un `..` nel nome non puo'
  scrivere fuori dal prefisso.
- L'alt text e' richiesto per le immagini. E' un'obbligo dichiarato dal
  pannello, non un vincolo: un PDF non ha un'alternativa testuale.

## Redirect

Sono un kind del CMS e finiscono in `out/_redirects` dopo la build
(`scripts/gen-redirects.mjs`). Cloudflare Pages **ignora senza avviso** le
regole oltre la centesima, quindi la build fallisce prima se si supera il
limite.

## Configurazione necessaria

Progetto Cloudflare Pages `mattiaciuni`. Variabili d'ambiente in produzione:

| Variabile | Valore | Serve per |
| --- | --- | --- |
| `GITHUB_TOKEN` | **da creare** | token fine-grained con Contents read/write sul repo |
| `GITHUB_REPOSITORY` | `0AIDev/Mattia-Ciuni-Website` | endpoint della Contents API |
| `GITHUB_BRANCH` | `main` | branch su cui committare |
| `GITHUB_TOKEN` | **da creare** | serve anche a **Rebuild the site**, che spinge un commit vuoto |

Binding in produzione **e** in preview:

| Tipo | Nome | Valore |
| --- | --- | --- |
| R2 | `MEDIA` | bucket `mattiaciuni-media` (privato) |
| KV | `FEEDBACK`, `RATE_LIMIT` | gia' presenti |

### Il rebuild manuale e il deploy hook che non c'e' piu'

Un deploy hook era il modo previsto per chiedere a Cloudflare una build senza
committare, e **non esiste piu'**. La dashboard di un progetto Pages offre solo
Deployments, Metrics, Custom domains e Settings: non c'e' piu' la sezione per
aggiungerlo, l'API risponde `405` a `POST .../deploy-hooks`, e Wrangler non ha
il comando. Non si puo' creare da nessuna parte.

Quello che resta e' il meccanismo che fa gia' ricostruire a ogni push, e che la
Function ha gia' sotto mano: il token GitHub che scrive i contenuti.
`pushRebuildCommit` legge il ref di `main`, prende l'albero del commit di testa,
crea un commit con lo stesso albero — quindi un commit vuoto, che non modifica
nessun file — e sposta il branch su quel commit. L'API dei contenuti non
servirebbe: rifiuta un commit senza cambiamenti, perche' un file identico non e'
una modifica.

Il pulsante e' quindi attivo quando `GITHUB_TOKEN` e' configurato, e quando
manca risponde `github_not_configured` invece del `502` senza spiegazione che
dava quando la variabile c'era ma non era un URL.

Migration da applicare una volta sola:

- `supabase/migrations/20260925_000006_admin_cms.sql` (tabella `admin_content`)
- `supabase/migrations/20260925_000007_admin_media_settings.sql` (`admin_media`
  ed estensione del check constraint sui kind)

Entrambe hanno RLS attivo e nessun accesso dal browser: scrive solo la Function,
con la service role lato server.

**Le due cose sono indipendenti, e il pannello le separa.** `Supabase
connection` dice che `SUPABASE_URL` e la service role key esistono; `Supabase
tables` dice che le tabelle rispondono. Con la prima e non la seconda il
pannello elenca ancora i contenuti (la lista ha un ripiego su KV e sul seed) ma
**il primo salvataggio fallisce**, perche' `saveContentItem` scrive sulla tabella
e non ripiega. La sezione Settings lo dichiara invece di dire `ready`.

La sezione **Settings** mostra lo stato di ognuna di queste voci: senza
`GITHUB_TOKEN` il pannello salva draft ma non pubblica, e lo dice invece di
fallire al primo click.

## Limiti, detti chiaramente

- **Il pannello non esegue codice.** Non crea componenti React, non esegue
  TypeScript, non modifica la logica. Registri che il codice legge con una
  forma fissa (tipo i campi di un'offerta di lavoro) si aggiornano dal pannello
  campo per campo; cambiarne la **forma** richiede codice.
- **Una nuova route e' una pagina `/p/<slug>/`**, non una sezione con un
  template dedicato. Le sezioni esistenti (`/about/`, `/legal/`, ...) restano
  quelle che sono.
- **Il rollback e' per file e per commit**, non un "annulla tutto" temporale.
  Lo storico mostra i commit che hanno toccato `content/cms`.
- **I media sono immutabili per chiave.** Sostituire un file con lo stesso nome
  cambia la cache a un anno: per cambiare il contenuto conviene salire con un
  nome nuovo.
- **Un publish non e' istantaneo, e non puo' esserlo**: il sito e' un export
  statico, quindi la modifica arriva online quando la build finisce. Il pannello
  non puo' accorciarla, puo' solo contarla e dirti quando e' successo. Con la
  build cache di Cloudflare attiva (`.npm` e `.next/cache`) una build sta intorno
  ai 40 secondi invece dei 90 e oltre senza cache.
- **`llms.txt` e le card** si rigenerano dalla pagina che esiste davvero,
  quindi una pagina non raggiunta da nessun link viene segnalata dal check
  sitemap invece di restare un'orfana silenziosa.

## Verifiche

```
npx tsc --noEmit              # tipi
npm run build                 # export + prebuild/postbuild
node scripts/verify.js        # include i check del pannello e i titoli
npm run test:brand            # il gate del brand fallisce davvero?
npm run test:media            # validazione + endpoint media
npm run test:cms              # parser e merge
npm run test:admin            # auth, TOTP, draft, publish, tetto dei corpi
npm run test:admin-actions    # ogni azione del pannello, round-trip GET → POST
npm run test:visual           # Playwright: dark mode e dimensioni titoli
npm run test:sitemap          # copertura sitemap e hreflang
```

`scripts/check-heading-sizes.mjs` gira anche nel `prebuild`: il preflight di
Tailwind porta ogni heading a `font-size: inherit`, quindi un titolo senza una
classe di dimensione esce a 16px ed e' indistinguibile dal corpo. Il check e'
un gate perche' il difetto e' invisibile nel markup e si vede solo in uno
screenshot.

## Cambiare brand

`scripts/check-brand.mjs` gira anch'esso nel `prebuild` e cerca i nomi dei brand
ritirati in **ogni file tracciato**, non in una lista di cartelle: il primo
rebrand aveva applicato lo sweep a `app/`, `lib/`, `content/` e cosi' via, e
`verify-final.out`, un log committato nella root, era rimasto con il nome
vecchio senza che nessuno se ne accorgesse. L'elenco dei file arriva da
`git ls-files`, quindi i binari vengono saltati e nulla di non tracciato blocca
la build.

Un rebrand si fa in tre mosse:

1. sostituisci il nome in ogni sorgente, come negli sweep precedenti;
2. in `scripts/check-brand.mjs` sposta il nome nuovo in `current` e appendi
   quello vecchio a `retired`;
3. se un match e' legittimo, aggiungilo a `allowlist` **come stringa esatta**,
   non come file: cosi' il resto del file continua a essere controllato. Oggi
   c'e' solo l'host Railway del documento NDA, che e' un URL vivo e non una
   stringa di brand.

Il check verifica anche che `lib/site.ts` nomi ancora il brand dichiarato in
`current`: se qualcuno aggiorna `retired` e dimentica `current`, fallisce invece
di controllare in silenzio la stringa sbagliata.

## Cambiare dominio

Il dominio non e' un brand e non si cambia come un brand. `scripts/check-brand.mjs`
non lo controlla, perche' un host sbagliato non contiene il nome del brand e
passerebbe. A controllarlo sono due cose gia' esistenti:

- **`lib/site-origin.ts`** dichiara l'origine production e **rifiuta** al build
  qualunque `NEXT_PUBLIC_SITE_URL` diversa. Quindi il build non puo' pubblicare
  un export con un dominio non autorizzato, e `.env.example` da solo non cambia
  niente.
- **`scripts/verify.js`** confronta l'origine con quella che la Function
  middleware usa per i 301, cosi' le due copie non possono divergere.

Un cambio di dominio, nell'ordine:

1. `PRODUCTION_ORIGIN` in `lib/site-origin.ts` e `NEXT_PUBLIC_SITE_URL` in
   `.env.example`;
2. la stessa variabile nel progetto Cloudflare Pages — **prima** del deploy, o il
   primo build post-cambio fallisce;
3. `RETIRED_HOSTS` in `functions/_middleware.ts`: il vecchio host e il `www` devono
   rispondere 301, non 200, altrimenti il sito esiste due volte e il ranking non
   si sposta;
4. il dominio come custom domain del progetto Pages, con i `CNAME` (l'apex
   non e' un A record: e' un CNAME con flattening, altrimenti l'hosting
   precedente continua a rispondere al suo posto);
5. i passi sui motori, che dal repository non si fanno.

`npm run test:domain` prova il 301 senza deploy (status, percorso, query, host
production e anteprima). L'ultimo capitolo di `docs/domain-migration.md` ha i
passi dei motori e il rollback con i valori DNS del precedente hosting.

Lo stesso vale per il **dominio del prodotto**, che vive in una quarantina di
file: il link della home, il pulsante di candidatura, il contatto nelle mail,
la policy del RAG, il system prompt in `api/chat.ts`. La regola e' una sola e
vale ovunque: un host che porta il nome del brand deve essere esattamente
quello dichiarato in `current.domain`. `www.` davanti, un TLD diverso, il
dominio senza il prefisso `with`, una porta, `http` invece di `https`: sono
tutti URL ben formati, quindi restano invisibili a ogni altro check mentre la
pagina mostra un link che non porta da nessuna parte.

Nota che questa pagina non puo' fare un esempio sbagliato per chiarezza: il
check lo leggerebbe e fallirebbe, il che e' il comportamento giusto ma
renderebbe la documentazione un ostacolo invece di un aiuto.

Il dominio viene confrontato con due dichiarazioni, non una. Il default e' in
`lib/site.ts`, ma `withSiteSettings` lascia vincere un valore non vuoto
pubblicato dal pannello in `content/cms/settings/site.json`: un override
rimasto indietro durante un rebrand sostituirebbe il default in build senza che
nessuno lo noti. Vuoto o assente significa "torna al default" e non e' un
errore; un `site.json` illeggibile invece fallisce.
