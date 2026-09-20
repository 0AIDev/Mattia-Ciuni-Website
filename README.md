# Mattia Ciuni — personal website

Minimal developer site (stile jakub.kr), tema chiaro fisso `#FCFCFC`, colonna 692px, font Inter (variabile) + Source Serif 4 italic self-hosted via `next/font`. **Next.js 16 App Router (Turbopack) + React 19** con **static export** → deploy nativo su **Cloudflare Pages**. Librerie aggiuntive: `motion` (runtime delle icone animate) + `@animateicons/react` + Tailwind in build.

## Struttura

- `app/page.tsx` — homepage (Header foto avatar + nome + ruolo / bio con **orario live Milano** in cima / intro / **Principles** (4 punti, titoli in Source Serif 4 italic) / **Now** con "Last updated" auto-aggiornato / Projects / Thoughts / Footer con feed.xml + signature) + JSON-LD `Person` + `WebSite`. Social tratteggiati: solo **X** mostra "@mattiaciuni" con la chiocciola; GitHub, LinkedIn, Instagram e Crunchbase solo il nome
- `app/thoughts/page.tsx` — indice Thoughts (ex blog: `/thoughts/`, titoli dei post in Source Serif 4, tag categoria "Thoughts") + JSON-LD `Blog`
- `app/thoughts/[slug]/page.tsx` — post in layout tipo articolo jakub.kr (header home+copia link, H1 id=slug in Source Serif 4, paragrafi separati da `<br/>`, H2 con anchor icon + hairline, `em` in Source Serif 4 italico, sezione More + nav Next), metadata per-articolo, JSON-LD `BlogPosting` + `BreadcrumbList`, related posts
- `app/notes/page.tsx` + `app/notes/[slug]/page.tsx` — **Notes** filosofiche long-form (150-300 parole l'una, con data, niente blog engine: contenuti direttamente in `lib/notes.ts`, testo puro non MDX). Indice `/notes/`; ogni nota è una pagina con H1, `*em*`, H2 interni e JSON-LD `Article` → SEO su query specifiche (es. "idempotent payments AI agents")
- `components/NowSection.tsx` (client) — sezione "Now" della home con riga discreta "Last updated: <mese anno>" che si aggiorna da sola a ogni visita (data corrente client-side)
- `components/MilanClock.tsx` (client) — orario in tempo reale Milan (timezone `Europe/Rome`, aggiornato ogni secondo), in cima alla bio della home (accetta `className`) con icone globe+clock
- `components/icons.tsx` — icone SVG geometriche fatte a mano (mark, arrow-up-left, chevron, chain-link, check); `components/CopyPostLink.tsx` (client) — bottone circolare copia-link articolo
- `components/ui/*.tsx` — icone animate **stile @animateicons/react** (twitter, mail-check, linkedin, github, crunchbase, arrow-up-left, arrow-up-right, link, copy, clock, globe), componenti locali con il template del pacchetto `@animateicons/react`, root sempre `<span>` (HTML valido inline dentro `<a>`/`<p>`), usate per email/social/feed/back-home/link-ancora/copia/clock. Richiedono `motion` e `cn` in `lib/utils.ts`. Nota: `crunchbase` è un fill-icon (silhouette Simple Icons, path ufficiale) mentre le altre sono stroke
- `components.json` — config shadcn minima (nessuna registry icone: si usa il template `@animateicons/react` copiato in `components/ui/`)
- `lib/posts.ts` — **unico file dove scrivere articoli** (niente MDX, niente dipendenze). Campo `category` mostrato come tag; `*testo*` renderizzato come `em` in Source Serif 4
- `lib/notes.ts` — **unico file dove scrivere le note** (niente MDX): `slug`, `title`, `description`, `date`, `keywords`, `content` (paragrafi + h2 con `*em*`)
- `lib/site.ts` — **unico file per dominio + social** (cambia qui quando hai dominio/handle reali; include `social.crunchbase`)
- `public/og.png` + `public/thoughts/[slug]/og.png`, OG 1200×630 statiche (tema chiaro), generate con `scripts/og.ps1` (niente runtime, niente dipendenze; `next/og` evitato di proposito: crasha il build su Windows e richiede Node runtime, incompatibile con static export puro)
- `public/mattia.png`, avatar della home (128×128 **B&W** ottimizzato ~11KB, da `mattia.png` 1254×1254 in root): grayscale + resize HighQualityBicubic via System.Drawing (comando PowerShell una tantum)
- `app/sitemap.xml/route.ts` + `app/sitemap-home.xml/route.ts` + `app/sitemap-thoughts.xml/route.ts` + `app/sitemap-notes.xml/route.ts`, `app/robots.ts`, `app/llms.txt/route.ts` — SEO: sitemap **indice** `/sitemap.xml` che divide in sotto-sitemap (home / thoughts / notes), tutte formattate (indentate, `lastmod` YYYY-MM-DD, changefreq, priority) e generate in automatico da posts+notes via helper `lib/sitemap.ts`; robots.txt che permette tutto (`Allow: /`) + riferimento all'indice; llms.txt standard per LLM (H1 + summary blockquote + sezioni Thoughts/Notes/Contact generati da dati reali). Poi: `app/manifest.ts` (theme `#FCFCFC`), `app/icon.svg`, `app/feed.xml/route.ts`, `app/not-found.tsx`
- `public/_headers`, `public/_redirects` (config Cloudflare Pages)

## Sviluppo

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static export in ./out
npm run lint    # ESLint flat config (eslint.config.mjs)
node scripts/verify.js  # 19 check SEO (meta, JSON-LD, canonical, pesi)
```

## Deploy su Cloudflare Pages

1. Pusha il repo su GitHub.
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings: **Framework preset: Next.js (Static HTML Export)**, Build command `npm run build`, Output directory `out`. (Il `output: "export"` in `next.config.mjs` fa già tutto.)
4. Deploy → ottieni `*.pages.dev`. Verifica: `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/feed.xml`, `/og.png`, `/thoughts/`.
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
