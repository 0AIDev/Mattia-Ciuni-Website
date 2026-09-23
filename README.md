# Mattia Ciuni — personal website

Minimal developer site (stile jakub.kr), tema chiaro fisso `#FCFCFC`, colonna 692px, font Inter + Instrument Serif (self-hosted via `next/font`). **Next.js 16 App Router (Turbopack) + React 19** con **static export** → deploy su **Cloudflare Pages** (progetto collegato a GitHub, cartella `out/`, più una Pages Function per la negoziazione markdown: `functions/_middleware.ts`). Librerie aggiuntive: `motion` (runtime delle icone animate) + `@animateicons/react` + Tailwind in build.

## Documentazione

Tre file, e sono il contratto del sito — non si scrive un articolo senza il secondo, non si tocca la SEO senza il primo:

- **[`docs/SEO.md`](docs/SEO.md)** — come la SEO è fatta **qui**: chi scrive quale file, cosa si genera da cosa, i comandi che controllano.
- **[`docs/AUTHORING.md`](docs/AUTHORING.md)** — come si scrive un articolo: campi, blocchi, sintassi, e le **regole dei collegamenti** (ogni articolo nomina almeno un altro articolo e una nota, le sezioni si citano con `#anchor`).
- **[`docs/SEO-GEO-AI.md`](docs/SEO-GEO-AI.md)** — l'impianto completo per tre lettori (motore di ricerca, motore generativo, agente), cosa è generico e cosa è dato di questo sito, e la lista di **cosa non si pubblica e perché**.

## Struttura

- `app/page.tsx` — homepage (Header foto avatar + nome + ruolo / bio con **orario live Milano** in cima / intro / **Principles** (4 punti, titoli in Instrument Serif italic) / **Now** con "Last updated" auto-aggiornato / Projects / Thoughts / Footer con feed.xml + signature) + JSON-LD `Person` + `WebSite`. Social tratteggiati: solo **X** mostra "@mattiaciuni" con la chiocciola; GitHub, LinkedIn, Instagram e Crunchbase solo il nome
- `components/TableOfContents.tsx` (client) — **TOC automatica** degli articoli: si genera dagli H2 (via `slugify` condiviso in `lib/slug.ts`, così gli anchor combaciano sempre con gli `id` degli heading), rail sticky **a sinistra** della colonna 692px e **solo desktop** (`xl:`, su mobile resta nascosta). Stato compatto a trattini → si espande in hover/focus mostrando i titoli (sfondo trasparente), la sezione corrente si evidenzia allo scroll ("ultimo heading sopra la linea di lettura") e il click aggiorna l'hash, così il link alla sezione resta copiabile. Ogni voce ha anche un bottone **copia link di sezione** (icona a sinistra del titolo, comparsa in hover/focus sulla riga, check di conferma per 1,6s): è un sibling del link, non annidato, quindi copiare non naviga mai. Usata sia da `/thoughts/[slug]` sia da `/notes/[slug]`
- `lib/copy.ts` — `copyText` (clipboard + fallback `execCommand`) e `sectionUrl(anchor)` condivisi da `SectionCopyLink` e dalla TOC
- `app/thoughts/page.tsx` — indice Thoughts (ex blog: `/thoughts/`, titoli dei post in Instrument Serif, tag categoria "Thoughts") + JSON-LD `Blog`
- `app/thoughts/[slug]/page.tsx` — post in layout tipo articolo jakub.kr (header home+copia link, H1 id=slug in Instrument Serif, paragrafi separati da `<br/>`, H2 con anchor icon + hairline, `em` in Instrument Serif italico, sezione More + nav Next), metadata per-articolo, JSON-LD `BlogPosting` + `BreadcrumbList`, related posts
- `app/notes/page.tsx` + `app/notes/[slug]/page.tsx` — **Notes** filosofiche long-form (150-300 parole l'una, con data, niente blog engine: contenuti direttamente in `lib/notes.ts`, testo puro non MDX). Indice `/notes/`; ogni nota è una pagina con H1, `*em*`, H2 interni e JSON-LD `Article` → SEO su query specifiche (es. "idempotent payments AI agents")
- `components/NowSection.tsx` (client) — sezione "Now" della home con riga discreta "Last updated: <mese anno>" che si aggiorna da sola a ogni visita (data corrente client-side)
- `components/MilanClock.tsx` (client) — orario in tempo reale Milan (timezone `Europe/Rome`, aggiornato ogni secondo), in cima alla bio della home (accetta `className`) con icone globe+clock
- `components/icons.tsx` — icone SVG geometriche fatte a mano (mark, arrow-up-left, chevron, chain-link, check); `components/CopyPostLink.tsx` (client) — bottone circolare copia-link articolo
- `components/ui/*.tsx` — icone animate **stile @animateicons/react** (twitter, mail-check, linkedin, github, crunchbase, arrow-up-left, arrow-up-right, link, copy, clock, globe), componenti locali con il template del pacchetto `@animateicons/react`, root sempre `<span>` (HTML valido inline dentro `<a>`/`<p>`), usate per email/social/feed/back-home/link-ancora/copia/clock. Richiedono `motion` e `cn` in `lib/utils.ts`. Nota: `crunchbase` è un fill-icon (silhouette Simple Icons, path ufficiale) mentre le altre sono stroke
- `components.json` — config shadcn minima (nessuna registry icone: si usa il template `@animateicons/react` copiato in `components/ui/`)
- `lib/slug.ts` — `slugify` condivisa: unica fonte degli anchor di sezione (heading + TOC)
- `lib/posts.ts` — **unico file dove scrivere articoli** (niente MDX, niente dipendenze). Campo `category` mostrato come tag; `*testo*` renderizzato come `em` in Instrument Serif
- `lib/notes.ts` — **unico file dove scrivere le note** (niente MDX): `slug`, `title`, `description`, `date`, `keywords`, `content` (paragrafi + h2 con `*em*`)
- `lib/site-origin.ts` — **l'unica stringa del dominio di produzione** (`https://mattiaciuni.pages.dev`): la leggono il build (`lib/site.ts` → canonical, sitemap, feed, JSON-LD, OG), la Pages Function (che sa quale dominio sta dentro l'export per poterlo sostituire con quello che serve la pagina) e `scripts/verify.js`. Un file a parte perché fossero tre copie tornerebbe il guasto del 21/09 (sito live su un host, indirizzi dichiarati su un altro)
- `lib/site.ts` — **dominio + social**: il dominio lo prende da `NEXT_PUBLIC_SITE_URL` (variabile del progetto Pages) o da `lib/site-origin.ts`; qui stanno gli handle social (`social.crunchbase` incluso)
- `public/og.png`, `public/thoughts/og.png`, `public/notes/og.png`, `public/thoughts/<slug>/og.png` e `public/notes/<slug>/og.png`: OG 1200×630 statiche (tema chiaro), generate con `scripts/og.ps1` (niente runtime, niente dipendenze; `next/og` evitato di proposito: crasha il build su Windows e richiede Node runtime, incompatibile con static export puro). Homepage, indice Thoughts e indice Notes partono da **master disegnati a mano in root, 1920×1008** — `og.png`, `thoughts-og.png`, `notesog.png` (come `Vector.svg` e `mattia.png`): lo script li porta a 1200×630 con `HighQualityBicubic` e li ricodifica, senza disegnare niente (stesso rapporto d'aspetto, quindi nessun ritaglio). Le OG di **post e note** le compone lo script dal template: `og-sfondo.png` (il tuo `sfondo.svg` rasterizzato con `node scripts/gen-og-bg.mjs`) + **titolo in Instrument Serif Regular** e **sottotitolo in Inter Light**, centrati sotto il logo, con i TTF in `scripts/fonts/` caricati da disco (nessuna installazione). Lo stesso giro scrive anche **`cover.png`** accanto a ogni `og.png`: la stessa card **senza il logo**, ed è quella che la pagina mostra **sopra il `h1`** (`components/CoverImage.tsx` — colonna intera, riquadro con bordo e ombra leggera), perché nella `<head>` va la card con il logo e dentro il sito quella senza. Il sottotitolo è la riga di contesto (`Thoughts · 20 September 2026`, o `Notes · 12 September 2026`); con `-Subtitle description` al suo posto va la description dell'articolo. Titoli, slug e date si leggono da `lib/posts.ts` e `lib/notes.ts`: zero duplicazioni. Utili: `-Only <slug>` (un solo articolo), `-Preview` (scrive in `out/_tmp/og` per approvarlo prima), `-HomeOnly` (solo la homepage)
- `public/mattia.webp`, avatar della home: **80×80 WebP, 0,8KB**, dal master `mattia.png` in root (1254×1254) con `node scripts/gen-avatar.mjs`. 80px è il doppio dei 40px a cui la pagina lo mostra (`h-10 w-10`), quindi è nitido sui display 2x senza servire pixel che nessuno vede: prima era un PNG 128×128 da 10,7KB, cioè ~10KB di risparmio che su mobile sono una richiesta che finisce prima
- **Favicon**: `app/icon.png` (copia del logo raster `favicon.png` in root, 1572×1572). Rimuove `app/icon.svg`. Origin dell'icona nel manifest sta su `/icon.png`.
- **Logo footer**: `public/logo.svg` = variante pulita di `Vector.svg` (in root): viewBox ritagliato sul tratto (il file originale ha canvas 1298×670 con il disegno che sborda e un filtro ombra sfocata) e color `#686868` (gray-1000). Generabile con `node scripts/gen-logo.mjs`.
- `components/NewsletterSection.tsx` — sezione globale newsletter, sempre prima del footer: copy inglese fisso, form minimale senza sfondo, stato iscritto ricordato nel browser, honeypot e feedback inline; `/privacy/` descrive raccolta e cancellazione
- `functions/api/admin/feedback.ts` + `app/admin/feedback/` — la coda di review, privata: bootstrap **monouso** con `ADMIN_TOKEN` per generare il secret TOTP, QR e manual key; dopo la conferma, ogni login richiede esclusivamente l'email autorizzata `ceo@usepayle.com` + codice TOTP. Per ripartire da zero usa `/admin/feedback/?reset=1` con il secret Cloudflare `ADMIN_TOTP_RESET_TOKEN`: revoca tutte le sessioni, invalida il secret precedente e riapre il bootstrap TOTP. `ADMIN_TOKEN` identifica Mattia Ciuni come Chief Executive Officer; `COFOUNDER_TOKEN` identifica Ghassen come Co-Founder & CTO e usa lo stesso TOTP. Il secret viene conservato solo in KV, il QR viene restituito solo durante il bootstrap, i codici hanno finestra ±1 periodo, login e TOTP hanno rate limit separati, e la sessione è un cookie `__Host-` `HttpOnly`/`Secure`/`SameSite=Strict` revocabile. Il token non è più sufficiente né per browser né per CLI (`X-Admin-TOTP` serve anche alle automazioni). In locale `next dev` non esegue Pages Functions: usa `npm run dev:pages` con `.dev.vars` e `LOCAL_ADMIN=1`, che usa uno store in memoria non persistente. La pagina non esiste per nessun indice — niente sitemap, niente `llms.txt`, niente feed, niente indice della chat, **niente card `.md`** — e `scripts/test-admin.mjs` / `scripts/test-feedback.mjs` provano a rompere il login offline, perché queste proprietà non si vedono nell'export
- `functions/api/feedback.ts` — Pages Function del form di feedback: honeypot, limite del corpo sui byte realmente letti, controllo same-origin, rate limit KV, validazione, coda condivisa `FEEDBACK` con fallback Supabase `private_kv`, mirror in `feedback_submissions`, senza persistenza dell'IP, e notifica Brevo a `ceo@usepayle.com` il cui link si compone dall'host che ha servito la pagina (non da una costante)
- `functions/api/subscribe.ts` — Pages Function per Resend + Brevo: validazione e blocklist disposable, rate limit KV per IP, attribuzione UTM/referrer e log senza PII. Configura le chiavi provider come Secret, `ADMIN_TOTP_RESET_TOKEN` come Secret separato e `RATE_LIMIT` come binding KV nel progetto Pages; il comando `npm run test:newsletter` copre il contratto offline e non simula la consegna di email
- `lib/macbook-search.ts` + `fixtures/macbook/` — Phase 1B search/evidence contract. `SEARCH_MODE=sandbox` usa esclusivamente offerte registrate con provenienza reale; il repository parte intenzionalmente senza offerte verificate. `SEARCH_MODE=live` resta bloccato fuori dal rehearsal e non accetta dati retailer dal client. Apple, Amazon e Back Market sono gli unici retailer ammessi e servono almeno tre risultati validi.
- `app/sitemap.xml/route.ts` + `app/sitemap-home.xml/route.ts` + `app/sitemap-thoughts.xml/route.ts` + `app/sitemap-notes.xml/route.ts`, `app/robots.txt/route.ts`, `app/llms.txt/route.ts` — SEO: sitemap **indice** `/sitemap.xml` che divide in sotto-sitemap (home / thoughts / notes), tutte formattate (indentate, `lastmod` YYYY-MM-DD, changefreq, priority) e generate in automatico da posts+notes via helper `lib/sitemap.ts`; robots.txt che permette tutto (`Allow: /`) + riferimento all'indice; llms.txt standard per LLM (H1 + summary blockquote + sezioni Thoughts/Notes/Contact generati da dati reali). Poi: `app/manifest.ts` (theme `#FCFCFC`), `app/feed.xml/route.ts`, `app/not-found.tsx`
- `functions/_middleware.ts` — Pages Function che fa tre cose: sotto `/admin/` risponde **404 a ogni `.md`** (una pagina privata non ha card, e la risposta arriva prima degli asset: l'edge aveva continuato a servire per mezz'ora la copia in cache di `admin/feedback.md` dopo che il file era stato cancellato), `Accept: text/markdown` su una pagina restituisce la sua card `.md` (con `Content-Type: text/markdown`, `x-markdown-tokens` e `Vary: Accept`), e gli indirizzi assoluti che l'export dichiara (`canonical`, `og:image`, JSON-LD, `<loc>`, `Sitemap:`) vengono riscritti con **l'host che sta servendo la pagina** — così il dominio segue il deploy invece di dover essere indovinato, e le anteprime (Discord, X, Slack) chiedono la card a un dominio che esiste. Con `SITE_URL` impostata nel progetto il dominio si fissa invece di seguire l'host: è il caso del dominio custom. Tutto il resto passa agli asset. Vedi §Scoperta per gli agenti.
- `public/_routes.json` — la Function **non viene invocata** per immagini, CSS, font e JS: elenca solo le rotte in cui compaiono indirizzi assoluti (pagine, sitemap, robots, feed, llms.txt, card `.md`, `/.well-known/`) più `/admin/*`, che ci sta perché anche la negazione (nessuna card sotto una pagina privata) deve passare da una Function: una richiesta servita dalla cache degli asset non la incontra mai. Senza questo file Pages la invocherebbe su ogni richiesta.
- `agent-skills/<nome>/SKILL.md` — la fonte a mano delle skill per gli agenti (una: come leggere e citare il sito). Da qui `scripts/gen-agent-files.mjs` ricava in `postbuild` `/.well-known/agent-skills/index.json` e la copia pubblicata, col digest sha256 calcolato sugli stessi byte.
- `public/_headers` (tipo e cache dei file noti, header di sicurezza, `Link` di scoperta) e `public/_redirects` — letti da Cloudflare Pages. Le regole di `_redirects` **non** si possono provare in locale con `next dev`: girano solo nel runtime di Pages (`npx wrangler pages dev out`), come `_headers`.

## Sviluppo

```bash
npm install
npm run dev     # http://localhost:3000 (static UI only; Pages Functions/API are not mounted)
npm run dev:pages # checks .dev.vars, builds, and runs Cloudflare Pages locally at http://localhost:8787; copy .dev.vars.example to .dev.vars first for admin/TOTP
npm run build   # static export in ./out
npm run lint    # ESLint flat config (eslint.config.mjs)
node scripts/verify.js  # controlli SEO/GEO (meta, JSON-LD, canonical, sitemap, robots, card For AI, OG card per ogni articolo, ogni `og:image` dichiarata che esiste davvero, documenti di scoperta, link interni, nessun `<a>` dentro un `<a>`, nessun link interno rotto, pagine legali coerenti con quello che il sito fa, TOC, dominio coerente con l'export, peso, e nessuna traccia della dashboard privata negli indici macchina — sitemap, llms.txt, feed, indice della chat — né un file scritto intorno alla pagina)
npm run test:newsletter  # copy, accessibilità, honeypot/rate-limit contract e presenza su ogni pagina
npm run test:admin       # attacchi offline al login della dashboard (token a confronto costante, sessioni KV, logout vero, rate limit, id di moderazione confinati ai feedback)
npm run test:feedback    # attacchi offline all'endpoint pubblico del feedback (honeypot, tetto del corpo sui byte arrivati, dati IP non persistiti, link della notifica sull'host che ha servito la pagina)
npm run test:security    # guardrail su segreti, source map, artefatti privati, security.txt e header Cloudflare
node scripts/check-live.mjs --site=https://mattiaciuni.pages.dev  # gli stessi controlli **sul sito pubblicato** (il dominio risolve? ogni pagina elencata risponde e dichiara la propria card?)
```

## Deploy su Cloudflare Pages

Il sito è un export statico: Pages pubblica la cartella `out/` e basta, più `functions/` se c'è (qui ci sono la negoziazione markdown, `/api/subscribe` e il read-only `/api/macbook/rehearsal-log`). Nessun server da eseguire, nessun adapter.

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → repo `0AIDev/Mattia-Ciuni-Website`, branch `main`.
2. Build settings: **Build command** `npm run build`, **Build output directory** `out`. Nient'altro: `_headers`, `_redirects`, `_routes.json` e la pagina 404 stanno già nell'export, e li legge Pages da sé.
3. **Environment variables** (Production): `NEXT_PUBLIC_SITE_URL` = `https://<progetto>.pages.dev` (per questo repo: `https://mattiaciuni.pages.dev`, lo stesso valore scritto in `lib/site-origin.ts`). Serve a far nascere l'export già col dominio giusto; senza, il build usa `lib/site-origin.ts` e va bene lo stesso.
4. Deploy → `https://mattiaciuni.pages.dev`. Verifica rapida: `/sitemap.xml`, `/news-sitemap.xml`, `/robots.txt`, `/llms.txt`, `/feed.xml`, `/og.png`, `/thoughts/`, `/index.md` (card For AI). La funzione `/api/subscribe` richiede i Secret Resend/Brevo e il binding KV `RATE_LIMIT` nel progetto Pages. Il MacBook Gate richiede inoltre il secret Cloudflare `MACBOOK_EMAIL_ENCRYPTION_KEY`, ma Phase 1B non attiva traffico live verso retailer.
5. Il controllo che guarda **il sito pubblicato** e non l'export (è quello che avrebbe preso il guasto del 21/09, quando il dominio dichiarato non esisteva):

```bash
node scripts/check-live.mjs --site=https://mattiaciuni.pages.dev
```

6. **Vecchio Worker**: il progetto Workers omonimo (`mattiaciuni.<account>.workers.dev`) non è più la sorgente. Va cancellato da **Workers & Pages → mattia-ciuni-website → Settings → Delete**, altrimenti resta lì a servire una copia vecchia su un indirizzo che qualcuno può ancora incollare in chat.

### Newsletter, Resend e Brevo

La sezione globale della newsletter è inclusa nel layout con form minimale e attribuzione UTM/referrer. In produzione `/api/subscribe` aggiorna il CRM Brevo e invia il template Welcome tramite Resend.

1. In Cloudflare Pages → Settings → Environment variables → Production configura come **Secret**: `RESEND_API_KEY`, `RESEND_WELCOME_TEMPLATE_ID`, `RESEND_FROM_EMAIL`, `BREVO_API_KEY`. Configura `BREVO_LIST_ID` come variabile normale: è necessaria per verificare gli iscritti prima di inviare un nuovo Welcome.
2. Verifica il mittente Resend e pubblica i record SPF/DKIM richiesti dal provider. Il template ID e il list ID sono specifici dei tuoi account e non vanno indovinati.
3. Il binding KV `RATE_LIMIT` deve puntare alla namespace `mattiaciuni-newsletter-rate-limit`; limita i tentativi per IP e usa `Retry-After` quando il limite scatta. Non inserire mai API key nel client, nel repository o negli screenshot.
4. Il Welcome viene inviato dopo l'aggiornamento Brevo. Prima dell'invio l'indirizzo viene canonicalizzato: Gmail rimuove punti, alias `+tag` e normalizza `googlemail.com`, così `mattiaciuni@gmail.com` e `mattiaciuni+a@gmail.com` sono una sola iscrizione. Per gli altri provider viene usata solo la normalizzazione lowercase, perché le regole degli alias non sono universali. Se uno dei provider non è configurato, l'endpoint risponde 503 senza fingere che l'iscrizione sia riuscita.

`npm run test:newsletter` controlla il contratto offline. Resend, Brevo, SPF/DKIM, la consegna reale e il test end-to-end restano **UNVERIFIED** finché non vengono provati con una casella reale.

### MacBook Gate email encryption and rehearsal proof

The MacBook Gate stores only encrypted contest email data in `macbook_email_verifications.email_ciphertext`. The encryption secret is `MACBOOK_EMAIL_ENCRYPTION_KEY`, configured only as a Cloudflare Pages/Workers Secret. It is never stored in Supabase, the repository, migrations, fixtures, tests, logs, browser storage, or the admin UI. Public routes use the email hash and never decrypt. Decryption is server-side only during an authorized admin review.

Rotation is a versioned operational procedure: add the new Cloudflare secret, run a bounded audited re-encryption job without logging plaintext, verify admin review and public masking, promote the new secret, then remove the old version. Rollback promotes the previous Cloudflare secret version. Emergency revocation removes the compromised secret and disables decryption until re-encryption is complete. Audit events record only the key version, operator role, and counts, never the key or plaintext address. The complete procedure is in `docs/MACBOOK-GATE-PHASE-1A.md`.

The public `GET /api/macbook/rehearsal-log` endpoint is read-only and returns masked test-account hashes, timestamps, outcomes, evidence counts, and boolean presence checks for the authorization and ledger receipt. It returns `not_ready` until ten records exist and never fabricates rehearsal proof.

### Security baseline

- `/.well-known/security.txt` pubblica il canale ufficiale di disclosure verso `ceo@usepayle.com`.
- `public/_headers` applica CSP, HSTS, anti-clickjacking, COOP, CORP, `nosniff`, Referrer Policy e Permissions Policy. La CSP mantiene solo le origini necessarie per Google Analytics, che viene caricato dopo consenso.
- I form browser accettano POST solo same-origin quando il browser invia `Origin`; le API rifiutano corpi non JSON, corpi oltre il limite, honeypot compilati e richieste oltre il rate limit.
- Le card Markdown restano pubbliche per la discovery. La dashboard admin, i suoi endpoint, i token, i cookie e i source map non vengono pubblicati; il login usa token + TOTP e sessioni `__Host-` in KV.
- `npm audit --omit=dev --audit-level=moderate` deve restare senza vulnerabilità prima del deploy. `npm run test:security` controlla il baseline nel repository, ma non sostituisce un test live dei secret e dei binding Cloudflare.

### Dominio custom

Quando esiste un dominio vero (es. `mattiaciuni.xyz`) convivono due indirizzi: quello buono e il `.pages.dev`. Il dominio si **fissa**, non si segue:

1. Pages → progetto → **Custom domains → Set up a custom domain** → inserisci il dominio. Se il DNS è su Cloudflare il record si crea da sé; se è su un registrar esterno, aggiungi il record indicato (o sposta i nameserver su Cloudflare, consigliato).
2. Imposta `SITE_URL` (Environment variables, Production) al dominio vero e rilancia un deploy: da lì canonical, sitemap, `og:image` e i documenti di scoperta dicono **quel** dominio anche se la pagina arriva da un `.pages.dev` o da un deploy di anteprima. Senza `SITE_URL` il sito segue l'host che serve la pagina.
3. Aggiorna `lib/site-origin.ts` allo stesso dominio (così l'export dice il vero da solo, e `verify.js` lo controlla) e rigenera le OG: `powershell -File scripts/og.ps1`, rebuild.
4. **Redirect `www` → apex**: su Pages può stare in `public/_redirects` (a differenza dei Worker con static assets, che accettano solo percorsi relativi e scartano in silenzio le regole con un dominio dentro — è la build che è caduta il 20/09, non una svista). Va scritto quando il dominio esiste davvero, altrimenti è una regola che rimanda a un host che non risolve.
5. HTTPS: automatico (Universal SSL). HSTS opzionale da SSL/TLS → Edge Certificates.

### Search Console, IndexNow e Google News

1. Aggiungi la proprietà del dominio a Google Search Console e verifica via record TXT.
2. Invia una volta `https://TUO-DOMINIO/sitemap.xml`; il sito pubblica anche `/news-sitemap.xml`, RSS e `robots.txt` con entrambi gli indirizzi.
3. Google non offre più un endpoint pubblico affidabile per il vecchio "ping" sitemap: la scoperta automatica avviene tramite `robots.txt` e sitemap. Search Console resta il posto corretto per ispezionare e richiedere una URL.
4. Per Bing, Yandex, Seznam e altri motori compatibili, imposta `INDEXNOW_KEY` come Secret. Il postbuild genera automaticamente il file di verifica e invia le URL principali a IndexNow; se la chiave manca, il build continua senza inviare nulla.
5. Per inviare automaticamente `/sitemap.xml` a Google Search Console dopo ogni build, assegna a un service account il permesso sulla proprietà e configura i Secret `GOOGLE_SERVICE_ACCOUNT_EMAIL` e `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, più `GOOGLE_SEARCH_CONSOLE_SITE_URL`. Se non sono configurati, il build salta l'invio senza errori. Questo usa la Sitemap API, non l'Indexing API: gli articoli normali non vanno inviati all'Indexing API.
6. Gli articoli hanno JSON-LD `BlogPosting`, RSS e news sitemap. Questo rende il sito tecnicamente idoneo alla scansione, ma Google News decide autonomamente l'inclusione editoriale e non può essere garantita dal codice.

## Scrivere un articolo

Apri `lib/posts.ts`, aggiungi un oggetto all'array `raw`:

```ts
{
  slug: "titolo-url-friendly",
  title: "Titolo",
  category: "Thoughts",
  description: "1-2 frasi: è la meta description + anteprima. Includi keyword naturali.",
  date: "2026-09-21",
  tags: ["AI agents", "payments"],
  keywords: ["keyword 1", "keyword 2", "Mattia Ciuni"],
  content: [
    { type: "p", text: "... *enfasi in Instrument Serif* funziona con *testo* tra asterischi" },
    { type: "h2", text: "..." },
    { type: "list", items: ["...", "..."] },
    { type: "quote", text: "..." },
    { type: "code", lang: "ts", code: "..." },
  ],
},
```

Regole SEO per post: un solo H1 (= title, automatico), primo paragrafo con keyword principale entro 100 parole, slug corto, description < 160 caratteri. Sitemap + RSS si aggiornano da soli al build; per la OG del nuovo post rigenera con `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/og.ps1` (legge slug/title da `lib/posts.ts`, zero duplicazioni).

**Collegamenti (non opzionali)**: dentro il testo va almeno un link a un altro articolo e uno a una nota, con `[etichetta](/notes/<slug>/)` — e le **sezioni si citano** con `#anchor` (`[qui](#what-agents-actually-need)` o `/thoughts/<slug>/#<anchor>`), perché il link alla sezione è copiabile. In fondo, le liste **More thoughts** e **Notes** si aggiungono da sole dai tag/keyword (`lib/related.ts`). Il contratto completo — campi, blocchi, sintassi, voce — è in **[`docs/AUTHORING.md`](docs/AUTHORING.md)**; il resto della SEO in **[`docs/SEO.md`](docs/SEO.md)**.

## Card For AI (.md per pagina)

Ogni pagina ha una **card markdown concisa** alla stessa path con estensione `.md` (es. `/thoughts/money-layer-for-ai-agents.md`), pensata per l'ingestione da parte di agenti/LLM. Contiene: H1 = titolo reale, blockquote = meta description, `- URL:`, `- Type:` (Home, Thoughts index, Blog post, Notes index, Note), `- Published:` per articoli, e link relativi al proprio indice e a `index.md` (che elenca tutte le card).

- Generazione **automatica in `postbuild`** (`npm run build` → `scripts/gen-cards.mjs`): legge il markup già esportato in `out/`, quindi non duplica mai i contenuti e si aggiorna da sola quando aggiungi post/note.
- File generati: `/index.md`, `/thoughts.md`, `/thoughts/<slug>.md`, `/notes.md`, `/notes/<slug>.md` (dentro `out/`, non committati).
- **Puntatore in pagina**: in fondo a ogni pagina (in automatico, via `components/ForAICard.tsx` nel root layout) compare la scritta **"For AI: nomedellapagina.md"** con il link alla card del nome della pagina corrente.
- Aggiungi/rimuovi post o note e non toccare nulla: al build le card si rigenerano. Sono controllate da `scripts/verify.js` e segnalate in `llms.txt` (sezione Cards).

## Scoperta per gli agenti

Quattro cose, tutte che **descrivono solo ciò che esiste** (la regola del progetto: il documento assente costa una riga di rapporto, il documento falso costa la fiducia — l'elenco di quello che **non** pubblichiamo, con il motivo, sta in `docs/SEO-GEO-AI.md` §4.2):

| Cosa | Dove | Dichiarazione |
| --- | --- | --- |
| `Link` di risposta (RFC 8288) | `public/_headers`, su ogni pagina | `describedby` → `/llms.txt` · `service-doc` → `/index.md` · `alternate` → `/feed.xml`, `/sitemap.xml` |
| Catalogo (RFC 9727) | `/.well-known/api-catalog`, `application/linkset+json` | l'ancora è il sito; i due documenti che lo descrivono per una macchina. Nessun `openapi.json`, nessuno `status` |
| Skill | `/.well-known/agent-skills/index.json` + `SKILL.md` | una skill, `read-and-cite-mattia-ciuni`: dove stanno le cose leggibili, come si cita, cosa non c'è. Il digest è ricalcolato da `verify.js` sul file pubblicato |
| Markdown a richiesta | `functions/_middleware.ts` (Pages Function) | `Accept: text/markdown` → la card `.md` della pagina, con `x-markdown-tokens` |
| Dominio che segue il deploy | `functions/_middleware.ts` | gli indirizzi assoluti dichiarati seguono l'host che serve la pagina (`SITE_URL` li fissa su un dominio) |

Come si prova, senza inventarsi un browser:

```bash
npm run build && npx wrangler pages dev out --port 8787
curl -sI http://localhost:8787/ | grep -i '^link:'
curl -s -H 'Accept: text/markdown' http://localhost:8787/thoughts/money-layer-for-ai-agents/ | head -5
curl -s  http://localhost:8787/.well-known/api-catalog
# il dominio segue l'host: qui la canonical dice localhost, su Pages il .pages.dev
curl -s http://localhost:8787/thoughts/money-layer-for-ai-agents/ | grep -o 'rel="canonical" href="[^"]*"'
```

Pubblicati perché **descrivono solo quello che esiste**: `/auth.md` (cosa serve a un agente per autenticarsi: niente, e le istruzioni a non mandare credenziali) e `/.well-known/oauth-protected-resource` (RFC 9728: il sito come risorsa pubblica, con `authorization_servers`, `scopes_supported` e `bearer_methods_supported` **vuote** — è la risposta, non un campo dimenticato). Non pubblicati, e non per dimenticanza: `openapi.json` (non c'è un'API), server card MCP (non c'è un server MCP), `/.well-known/oauth-authorization-server` e `/.well-known/openid-configuration` (nessun issuer: riempirli significherebbe dichiarare `authorization_endpoint` e `token_endpoint` che non esistono), Web Bot Auth (il sito non firma richieste in uscita), x402/MPP/UCP/ACP (non si vende niente a un agente). **DNSSEC** invece è consigliato e non è codice: si accende sulla zona in Cloudflare e si conferma con il record DS dal registrar — è l'unico pezzo della scoperta che vive nel DNS.

## Note SEO/performance

- Font: solo **Inter + Instrument Serif** in tutto il progetto (stack `font-sans`/`font-serif`), entrambi **self-hosted** con `next/font`. La sezione globale **Sundays** usa una sola form client-side, con form inline su desktop e stacked su mobile, senza dipendenze esterne. Il serif arrivava da `fonts.googleapis.com` con un `<link rel="stylesheet">` nella `<head>`: una richiesta che **blocca il rendering** verso un altro dominio (~200ms prima di disegnare il testo), due `preconnect` e ~249KB di woff2 da `fonts.gstatic.com`. Ora è servito dallo stesso host della pagina: verificato in browser, **zero richieste a domini terzi** e `document.fonts.check('16px "Instrument Serif"')` vero. JS client: click-to-copy + icone animate (`motion`, con `LazyMotion`/`domMin`: solo le feature che servono). Zero immagini decorative, e l'unica immagine vera (l'avatar) è 0,8KB.
- `browserslist` in `package.json` dichiara il target (**chrome/edge/firefox 111, safari 16.4**): è il motivo per cui il codice del progetto non viene retro-compilato oltre il necessario. Il blocco di polyfill che resta in `_next/` è dentro guardie `||` (si neutra su un browser moderno) e il chunk `nomodule` da 110KB non viene **nemmeno scaricato** dai browser attuali.
- `rel="me"` sui social per verifica identità; canonical + OG `article:*` su ogni post; `theme-color` #FCFCFC.

## Note Next.js 16 (upgrade da 14)

- Nuove regole ESLint: link interni con `<Link>` da `next/link` (non `<a>`) e flat config `eslint.config.mjs`. ESLint è pinnato a **9.x**: `eslint-config-next@16` usa `eslint-plugin-react` 7.37.5 che non supporta ESLint 10.
- `next lint` rimosso → `npm run lint` = `eslint .`.
- `params` nelle pagine dinamiche è `Promise` (await in `generateMetadata` e nel page component).
- `output: "export"` richiede `export const dynamic = "force-static"` su `robots.ts`, `sitemap.ts`, `manifest.ts`, `feed.xml/route.ts`.
- `trailingSlash: true` (in `next.config.mjs`): le pagine escono come `out/<path>/index.html`, che è la forma che Pages serve senza reindirizzare. Con i file `.html` Pages risponde 200 su `/thoughts/<slug>` e fa **308** su `/thoughts/<slug>/`, cioè l'opposto di ogni canonical del sito — misurato con `wrangler pages dev`, non dedotto.
- Build Turbopack: la CSS finisce in `_next/static/chunks/*.css` (non più `_next/static/css/`) → `scripts/verify.js` scansiona ricorsivamente `_next/static` per `.css`/`.js`.
- icone animate: nei file `components/ui/*` la root del template `@animateicons/react` è `m.div` → convertita in `m.span` (HTML valido inline dentro `<a>`/`<p>`, evita hydration mismatch); tipi dell'evento importati come `MouseEvent` da react (niente `React.` globale, niente `any`).
- `next dev` rigenera `AGENTS.md`/`CLAUDE.md` (agent rules) a ogni avvio; disabilita con `agentRules: false` in `next.config.mjs`.
