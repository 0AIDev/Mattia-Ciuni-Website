# Pannello admin

Il pannello e' l'unico posto dove si opera il sito. Otto sezioni, una barra
laterale, nessuna sottopagina.

| Sezione | Cosa fa | Endpoint |
| --- | --- | --- |
| Overview | metriche, stato dei draft, coda | GET `/api/admin/feedback` |
| Content | articoli, note, feedback, pagine, voice note, video, job, redirect, tassonomie, meta media, impostazioni | `content_save`, `content_publish`, `content_restore`, `content_history` |
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
   con la GitHub Contents API, crea un commit e chiama il deploy hook.
3. **Build**: `next build` legge `content/cms/` e sovrascrive i registry in
   codice. Un file con lo stesso slug vince sul registry, quindi un override e'
   sempre reversibile cancellando il file.
4. **Deploy** su Cloudflare Pages, che ricostruisce e serve l'export statico.

Il rollback non e' un pulsante separato dal publish: e' la stessa operazione
al contrario, e riporta un file allo stato di un commit scelto.

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

Variabili d'ambiente del progetto Cloudflare Pages:

| Variabile | Serve per |
| --- | --- |
| `GITHUB_TOKEN` | token fine-grained con Contents read/write sul repo |
| `GITHUB_REPOSITORY` | es. `0AIDev/Mattia-Ciuni-Website` |
| `GITHUB_BRANCH` | `main` |
| `CLOUDFLARE_DEPLOY_HOOK` | richiede il rebuild dopo il publish |
| Binding R2 `MEDIA` | la libreria media |

La sezione **Settings** mostra lo stato di ciascuno: senza `GITHUB_TOKEN` il
pannello salva draft ma non pubblica, e lo dice invece di fallire al primo click.

Migration da applicare una volta sola:

- `supabase/migrations/20260925_000006_admin_cms.sql` (tabella `admin_content`)
- `supabase/migrations/20260925_000007_admin_media_settings.sql` (`admin_media`
  ed estensione del check constraint sui kind)

Entrambe hanno RLS attivo e nessun accesso dal browser: scrive solo la Function,
con la service role lato server.

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
- **`llms.txt` e le card** si rigenerano dalla pagina che esiste davvero,
  quindi una pagina non raggiunta da nessun link viene segnalata dal check
  sitemap invece di restare un'orfana silenziosa.

## Verifiche

```
npx tsc --noEmit              # tipi
npm run build                 # export + prebuild/postbuild
node scripts/verify.js        # include i check del pannello e i titoli
npm run test:media            # validazione + endpoint media
npm run test:cms              # parser e merge
npm run test:admin            # auth, TOTP, draft, publish, rollback
npm run test:visual           # Playwright: dark mode e dimensioni titoli
npm run test:sitemap          # copertura sitemap e hreflang
```

`scripts/check-heading-sizes.mjs` gira anche nel `prebuild`: il preflight di
Tailwind porta ogni heading a `font-size: inherit`, quindi un titolo senza una
classe di dimensione esce a 16px ed e' indistinguibile dal corpo. Il check e'
un gate perche' il difetto e' invisibile nel markup e si vede solo in uno
screenshot.
