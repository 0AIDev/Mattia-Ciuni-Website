# design/

I disegni a mano del sito: le **sorgenti** dei file che `public/` serve già
trasformati. La regola del progetto è che qui stanno i master e in `public/`
stanno i file pubblicati — nessun build legge questa cartella, quindi un cambio
qui non rompe la build: serve solo rilanciare lo script che lo consuma.

| File | Dimensione | Lo genera / lo usa |
| --- | --- | --- |
| `og.png` | 1920×1008 | card della home → `scripts/og.ps1 -HomeOnly` → `public/og.png` |
| `thoughts-og.png` | 1920×1008 | card dell'indice Thoughts → `og.ps1` → `public/thoughts/og.png` |
| `notesog.png` | 1920×1008 | card dell'indice Notes → `og.ps1` → `public/notes/og.png` |
| `og-sfondo.png` | 1920×1008 | **generato**: `node scripts/gen-og-bg.mjs` da `sfondo.svg`, col logo — sfondo delle card articolo |
| `og-sfondo-cover.png` | 1920×1008 | **generato**: stesso comando, senza logo — l'immagine che la pagina mostra sopra il `h1` |
| `alex-og.png` | 1920×1008 | card dedicata di un articolo (la tabella `$masters` in `og.ps1`) |
| `ghassen-og.png` | 1994×1008 | card dedicata di un articolo (stessa tabella) |
| `sfondo.svg` | 1920×1008 | sorgente dei due raster sopra: cambia qui, poi rilancia `gen-og-bg.mjs` |
| `Vector.svg` | 1298×670 | logo → `node scripts/gen-logo.mjs` → `public/logo.svg` |
| `mattia.png` | 1254×1254 | avatar della home → `node scripts/gen-avatar.mjs` → `public/mattia.webp` |
| `mattia 1.png` | 1004×1000 | figura del header di `/link` → `node scripts/gen-cutout.mjs` → `public/mattia-cutout.webp` |

Card e cover di articoli, note e carriere le disegna `scripts/og.ps1` (titoli e
date letti da `lib/posts.ts` e `lib/notes.ts`): i file sopra sono solo i master
che lo script riduce a 1200×630. Elenco completo della catena in
[`docs/SEO.md`](../docs/SEO.md).

**I risultati sono committati**: il build su Cloudflare non gira PowerShell né
`sharp`, quindi le card esistono nel repository e la build le copia così come
sono. Rilanciare gli script solo quando cambia il master, e committare anche
l'output.
