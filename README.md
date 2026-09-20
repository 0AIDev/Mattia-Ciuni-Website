# Mattia Ciuni — personal website

Minimal developer site (stile jakub.kr), tema chiaro fisso `#FCFCFC`, colonna 692px, font Inter (variabile) + Source Serif 4 italic self-hosted via `next/font`. **Next.js 16 App Router (Turbopack) + React 19** con **static export** → deploy nativo su **Cloudflare Pages**. Librerie aggiuntive: `motion` (runtime delle icone animate) + `@animateicons/react` + Tailwind in build.

## Documentazione

Tre file, e sono il contratto del sito — non si scrive un articolo senza il secondo, non si tocca la SEO senza il primo:

- **[`docs/SEO.md`](docs/SEO.md)** — come la SEO è fatta **qui**: chi scrive quale file, cosa si genera da cosa, i comandi che controllano.
- **[`docs/AUTHORING.md`](docs/AUTHORING.md)** — come si scrive un articolo: campi, blocchi, sintassi, e le **regole dei collegamenti** (ogni articolo nomina almeno un altro articolo e una nota, le sezioni si citano con `#anchor`).
- **[`docs/SEO-GEO-AI.md`](docs/SEO-GEO-AI.md)** — l'impianto completo per tre lettori (motore di ricerca, motore generativo, agente), cosa è generico e cosa è dato di questo sito, e la lista di **cosa non si pubblica e perché**.

## Struttura

- `app/page.tsx` — homepage (Header foto avatar + nome + ruolo / bio con **orario live Milano** in cima / intro / **Principles** (4 punti, titoli in Source Serif 4 italic) / **Now** con "Last updated" auto-aggiornato / Projects / Thoughts / Footer con feed.xml + signature) + JSON-LD `Person` + `WebSite`. Social tratteggiati: solo **X** mostra "@mattiaciuni" con la chiocciola; GitHub, LinkedIn, Instagram e Crunchbase solo il nome
- `components/TableOfContents.tsx` (client) — **TOC automatica** degli articoli: si genera dagli H2 (via `slugify` condiviso in `lib/slug.ts`, così gli anchor combaciano sempre con gli `id` degli heading), rail sticky **a sinistra** della colonna 692px e **solo desktop** (`xl:`, su mobile resta nascosta). Stato compatto a trattini → si espande in hover/focus mostrando i titoli (sfondo trasparente), la sezione corrente si evidenzia allo scroll ("ultimo heading sopra la linea di lettura") e il click aggiorna l'hash, così il link alla sezione resta copiabile. Ogni voce ha anche un bottone **copia link di sezione** (icona a sinistra del titolo, comparsa in hover/focus sulla riga, check di conferma per 1,6s): è un sibling del link, non annidato, quindi copiare non naviga mai. Usata sia da `/thoughts/[slug]` sia da `/notes/[slug]`
- `lib/copy.ts` — `copyText` (clipboard + fallback `execCommand`) e `sectionUrl(anchor)` condivisi da `SectionCopyLink` e dalla TOC
- `app/thoughts/page.tsx` — indice Thoughts (ex blog: `/thoughts/`, titoli dei post in Source Serif 4, tag categoria "Thoughts") + JSON-LD `Blog`
- `app/thoughts/[slug]/page.tsx` — post in layout tipo articolo jakub.kr (header home+copia link, H1 id=slug in Source Serif 4, paragrafi separati da `<br/>`, H2 con anchor icon + hairline, `em` in Source Serif 4 italico, sezione More + nav Next), metadata per-articolo, JSON-LD `BlogPosting` + `BreadcrumbList`, related posts
- `app/notes/page.tsx` + `app/notes/[slug]/page.tsx` — **Notes** filosofiche long-form (150-300 parole l'una, con data, niente blog engine: contenuti direttamente in `lib/notes.ts`, testo puro non MDX). Indice `/notes/`; ogni nota è una pagina con H1, `*em*`, H2 interni e JSON-LD `Article` → SEO su query specifiche (es. "idempotent payments AI agents")
- `components/NowSection.tsx` (client) — sezione "Now" della home con riga discreta "Last updated: <mese anno>" che si aggiorna da sola a ogni visita (data corrente client-side)
- `components/MilanClock.tsx` (client) — orario in tempo reale Milan (timezone `Europe/Rome`, aggiornato ogni secondo), in cima alla bio della home (accetta `className`) con icone globe+clock
- `components/icons.tsx` — icone SVG geometriche fatte a mano (mark, arrow-up-left, chevron, chain-link, check); `components/CopyPostLink.tsx` (client) — bottone circolare copia-link articolo
- `components/ui/*.tsx` — icone animate **stile @animateicons/react** (twitter, mail-check, linkedin, github, crunchbase, arrow-up-left, arrow-up-right, link, copy, clock, globe), componenti locali con il template del pacchetto `@animateicons/react`, root sempre `<span>` (HTML valido inline dentro `<a>`/`<p>`), usate per email/social/feed/back-home/link-ancora/copia/clock. Richiedono `motion` e `cn` in `lib/utils.ts`. Nota: `crunchbase` è un fill-icon (silhouette Simple Icons, path ufficiale) mentre le altre sono stroke
- `components.json` — config shadcn minima (nessuna registry icone: si usa il template `@animateicons/react` copiato in `components/ui/`)
- `lib/slug.ts` — `slugify` condivisa: unica fonte degli anchor di sezione (heading + TOC)
- `lib/posts.ts` — **unico file dove scrivere articoli** (niente MDX, niente dipendenze). Campo `category` mostrato come tag; `*testo*` renderizzato come `em` in Source Serif 4
- `lib/notes.ts` — **unico file dove scrivere le note** (niente MDX): `slug`, `title`, `description`, `date`, `keywords`, `content` (paragrafi + h2 con `*em*`)
- `lib/site.ts` — **unico file per dominio + social** (cambia qui quando hai dominio/handle reali; include `social.crunchbase`)
- `public/og.png` + `public/thoughts/[slug]/og.png`, OG 1200×630 statiche (tema chiaro), generate con `scripts/og.ps1` (niente runtime, niente dipendenze; `next/og` evitato di proposito: crasha il build su Windows e richiede Node runtime, incompatibile con static export puro). La OG della **homepage** è un master disegnato a mano — **`og.png` in root** (1920×1008, come `Vector.svg` e `mattia.png`): lo script lo porta a 1200×630 con `HighQualityBicubic` e lo ricodifica, senza disegnare niente (stesso rapporto d'aspetto, quindi nessun ritaglio). Le OG dei post restano disegnate dallo script, leggendo i titoli da `lib/posts.ts`. `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/og.ps1 -HomeOnly` rigenera solo la homepage; senza `-HomeOnly` rigenera tutto
- `public/mattia.png`, avatar della home (128×128 **B&W** ottimizzato ~11KB, da `mattia.png` 1254×1254 in root): grayscale + resize HighQualityBicubic via System.Drawing (comando PowerShell una tantum)
- **Favicon**: `app/icon.png` (copia del logo raster `favicon.png` in root, 1572×1572). Rimuove `app/icon.svg`. Origin dell'icona nel manifest sta su `/icon.png`.
- **Logo footer**: `public/logo.svg` = variante pulita di `Vector.svg` (in root): viewBox ritagliato sul tratto (il file originale ha canvas 1298×670 con il disegno che sborda e un filtro ombra sfocata) e color `#686868` (gray-1000). Generabile con `node scripts/gen-logo.mjs`.
- `app/sitemap.xml/route.ts` + `app/sitemap-home.xml/route.ts` + `app/sitemap-thoughts.xml/route.ts` + `app/sitemap-notes.xml/route.ts`, `app/robots.txt/route.ts`, `app/llms.txt/route.ts` — SEO: sitemap **indice** `/sitemap.xml` che divide in sotto-sitemap (home / thoughts / notes), tutte formattate (indentate, `lastmod` YYYY-MM-DD, changefreq, priority) e generate in automatico da posts+notes via helper `lib/sitemap.ts`; robots.txt che permette tutto (`Allow: /`) + riferimento all'indice; llms.txt standard per LLM (H1 + summary blockquote + sezioni Thoughts/Notes/Contact generati da dati reali). Poi: `app/manifest.ts` (theme `#FCFCFC`), `app/feed.xml/route.ts`, `app/not-found.tsx`
- `public/_headers`, `public/_redirects` (config Cloudflare Pages)

## Sviluppo

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static export in ./out
npm run lint    # ESLint flat config (eslint.config.mjs)
node scripts/verify.js  # 46 controlli SEO/GEO (meta, JSON-LD, canonical, sitemap, robots, card For AI, link interni, TOC, peso)
```

## Deploy su Cloudflare Pages

1. Pusha il repo su GitHub.
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings: **Framework preset: Next.js (Static HTML Export)**, Build command `npm run build`, Output directory `out`. (Il `output: "export"` in `next.config.mjs` fa già tutto.)
4. Deploy → ottieni `*.pages.dev`. Verifica: `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/feed.xml`, `/og.png`, `/thoughts/`, `/index.md` (card For AI).
5. **Dominio di produzione**: in Pages → **Settings → Environment variables** imposta `NEXT_PUBLIC_SITE_URL` (es. `https://mattiaciuni.xyz`) con un nuovo deploy. Se non la imposti, il build usa il fallback in `lib/site.ts`. `verify.js` e le OG rispettano la stessa variabile.

### Dominio custom

1. Pages → progetto → **Custom domains → Set up a custom domain** → inserisci `mattiaciuni.xyz` (o il dominio finale).
2. Se il DNS è su Cloudflare: record creato in automatico. Se è su registrar esterno: aggiungi il CNAME indicato da Cloudflare, oppure sposta i nameserver su Cloudflare (consigliato).
3. Aggiorna `NEXT_PUBLIC_SITE_URL` nelle env di Pages (oppure `lib/site.ts` → `url`), `public/_redirects` (riga www→apex), e rigenera le OG col dominio giusto: `powershell -File scripts/og.ps1 -Domain "tuodominio.com"`, rebuild.
4. Redirect www→apex: la riga in `public/_redirects` è già attiva. Alternativa: Cloudflare **Rules → Redirect Rules** `www.* → apex 301`.
5. HTTPS: automatico (Universal SSL). HSTS opzionale da SSL/TLS → Edge Certificates.

### Search Console (10 min, fa indicizzare "Mattia Ciuni" in giorni)

1. Aggiungi proprietà dominio → verifica via record TXT.
2. Sitemaps → invia `https://TUO-DOMINIO/sitemap.xml`.
3. Valida un post con `validator.schema.org` (JSON-LD BlogPosting) e testa preview con `opengraph.xyz` o i debugger di X/LinkedIn.

## Scrivere un articolo

Apri `lib/posts.ts`, aggiungi un oggetto all'array `raw`:

```ts
{
  slug: "titolo-url-friendly",
  title: "Titolo",
  category: "Thoughts",
  description: "1-2 frasi: è la meta description + anteprima. Includi keyword naturali.",
  date: "2026-10-01",
  tags: ["AI agents", "payments"],
  keywords: ["keyword 1", "keyword 2", "Mattia Ciuni"],
  content: [
    { type: "p", text: "... *enfasi in Source Serif 4* funziona con *testo* tra asterischi" },
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

## Note SEO/performance

- Font: solo **Inter + Source Serif 4** in tutto il progetto (stack `font-sans`/`font-serif` senza altri fallback); il titolo della pagina Thoughts è in Source Serif 4. JS client: click-to-copy + icone animate (`motion`, ~45KB gzip in più sul First Load: 88KB→~133KB). Font self-hosted (zero request esterne a runtime); zero immagini decorative.
- `rel="me"` sui social per verifica identità; canonical + OG `article:*` su ogni post; `theme-color` #FCFCFC.

## Note Next.js 16 (upgrade da 14)

- Nuove regole ESLint: link interni con `<Link>` da `next/link` (non `<a>`) e flat config `eslint.config.mjs`. ESLint è pinnato a **9.x**: `eslint-config-next@16` usa `eslint-plugin-react` 7.37.5 che non supporta ESLint 10.
- `next lint` rimosso → `npm run lint` = `eslint .`.
- `params` nelle pagine dinamiche è `Promise` (await in `generateMetadata` e nel page component).
- `output: "export"` richiede `export const dynamic = "force-static"` su `robots.ts`, `sitemap.ts`, `manifest.ts`, `feed.xml/route.ts`.
- Build Turbopack: la CSS finisce in `_next/static/chunks/*.css` (non più `_next/static/css/`) → `scripts/verify.js` scansiona ricorsivamente `_next/static` per `.css`/`.js`.
- icone animate: nei file `components/ui/*` la root del template `@animateicons/react` è `m.div` → convertita in `m.span` (HTML valido inline dentro `<a>`/`<p>`, evita hydration mismatch); tipi dell'evento importati come `MouseEvent` da react (niente `React.` globale, niente `any`).
- `next dev` rigenera `AGENTS.md`/`CLAUDE.md` (agent rules) a ogni avvio; disabilita con `agentRules: false` in `next.config.mjs`.
