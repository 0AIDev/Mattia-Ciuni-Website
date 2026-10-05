# Piano editoriale: Mattia Ciuni → Noesia

Il piano in sé sta in un documento esterno. Questo file è la parte operativa:
come un pezzo diventa una pagina, cosa serve per scriverlo, e cosa di quel piano
non si può fare inventando.

## 1 · La divisione dei ruoli

**Noesia possiede il prodotto. Mattia possiede il punto di vista.** Ogni
argomento importante ha una coppia: qui l'opinione, la scoperta, il momento in
cui qualcosa è andato storto; su `withnoesia.com` la definizione,
l'implementazione, la documentazione. Due pagine che rispondono alla stessa
domanda competono tra loro, quindi non si scrive mai "what is an AI agent" in due
posti.

## 2 · Cosa è stato costruito perché il piano giri da solo

| Pezzo | Dove | Cosa fa |
| --- | --- | --- |
| La data decide la pubblicazione | [`lib/publication.ts`](../lib/publication.ts) | Un pezzo con la data nel futuro sta nel repository e non esiste in nessuna pagina. Il filtro è nel registro, non nelle pagine: rotta, sitemap, feed, card, liste correlate e link in fondo leggono tutti da lì, quindi non può trapelare da una superficie dimenticata. |
| Il controllo che impone la coerenza | `scripts/verify.js` | Il numero di pagine esportate deve corrispondere ai pezzi pubblicati. Se il filtro e la sua copia nei controlli si separano, cade un check e lo dice. |
| Il minimo di parole | `scripts/verify.js` | Ogni pezzo con data **2026-10-05 o successiva** deve avere almeno 1000 parole, contate dal `content` in poi (titolo e descrizione non sono parole dell'articolo). Vale anche per i pezzi non ancora pubblicati: la finestra prima della data è il momento in cui si corregge, non il giorno in cui esce. |
| La build che gira da sola | [`.github/workflows/publish-scheduled.yml`](../.github/workflows/publish-scheduled.yml) | Lunedi, mercoledi e venerdi avvia la ricostruzione su Cloudflare. Serve il segreto `CLOUDFLARE_DEPLOY_HOOK` nelle impostazioni del repository: senza, esce verde e lo dice nel log. |
| L'annuncio | [`scripts/ping-indexnow.mjs`](../scripts/ping-indexnow.mjs) | Annuncia a IndexNow (Bing, Yandex, Seznam) le pagine con la data di oggi, lette dall'export. Se non c'è niente di nuovo non manda niente: un segnale che arriva sempre è un segnale che si può ignorare. |

### Perché non si pubblica in blocco

Trenta URL nuovi lo stesso giorno su un dominio di due settimane sono il segnale
con cui i motori riconoscono un sito che gonfia il numero delle proprie pagine,
e il piano stesso lo dice: la strategia deve essere aggressiva nella copertura,
non nel numero di URL. Il tetto è **due pezzi a settimana**, ed è per questo che
"tutto scritto adesso" e "pubblicato secondo il piano" non sono in conflitto: la
data nel futuro è esattamente la separazione tra le due cose. Un pezzo con data
futura è una bozza che si legge, si corregge e si firma, e che diventa pagina
senza che nessuno debba ricordarsene.

## 3 · La coda, con la fonte di ogni titolo

La colonna **Fonte** è la parte che conta. Il contratto editoriale dice una cosa
sola su come nasce un pezzo: *si estrae da materiale esistente, mai
dall'immaginazione*. Un titolo senza fonte reale non è un articolo in attesa, è
un articolo che non si può scrivere, e l'unico modo di non pubblicare testo
generico è scriverlo solo quando la fonte esiste.

`FR` = `Payle HQ/fundroom/Team-Allignment/`, il repository di ricerca.

### Cluster 01 · Autonomous agents

| Titolo | Query | Fonte | Stato |
| --- | --- | --- | --- |
| The moment AI agents stop being assistants | AI agents, autonomous agents | FR `01-RESEARCH/payle-preseed-deck/memo/`, §"Il caso" | da scrivere |
| AI agents don't need more intelligence, they need more authority | AI agent authority | FR memo + la tesi dell'autorizzazione | da scrivere |
| The difference between an AI assistant and an autonomous agent | AI assistant vs autonomous agent | Celeste (browser AI) vs il modello a mandato | da scrivere |
| The agentic economy will start with small decisions | agentic economy | FR `analysis/03-market-model.md` | da scrivere |
| What happens when software can act for you | agentic commerce | FR memo §"Come si arrangia la gente oggi" | da scrivere |

### Cluster 02 · Authorization

| Titolo | Query | Fonte | Stato |
| --- | --- | --- | --- |
| **Why AI agents need permission systems** | AI agent permissions | FR memo + motore di autorizzazione (Go, policy DSL, ledger) | **pubblicato** |
| The authorization layer for autonomous agents | AI agent authorization | il pillar + questo file | da scrivere |
| What should an AI agent be allowed to do | AI agent controls | truth table righe B2, B3, B4, B5 | da scrivere |
| An AI agent should never have your credit card | AI agent credit card | "scoped capabilities that expire", il vocabolario del contratto | da scrivere |
| Least privilege for AI agents | least privilege AI agents | l'articolo con Alex, che già lo applica agli agenti | da scrivere |

### Cluster 03 · Money

| Titolo | Query | Fonte | Stato |
| --- | --- | --- | --- |
| **Why AI agents keep stopping at checkout** | AI agents checkout | Celeste + il buco fra stato *pending* e *decline* | **pubblicato** |
| The credit card is the wrong interface for AI agents | AI agent payments | pillar `money-layer-for-ai-agents` | da scrivere |
| What it means to give an AI agent a budget | AI agent spending limit | truth table B2, B3 | da scrivere |
| **Who is responsible when an AI agent buys the wrong thing** | AI agent liability | FR memo, la domanda del caso del volo | **la prossima** |
| Why autonomous purchasing needs a control layer | AI agent purchasing | FR `analysis/10-rails-verification.md` | da scrivere |

### Cluster 04 · Technical

| Titolo | Query | Fonte | Stato |
| --- | --- | --- | --- |
| Why there should be no LLM in the authorization path | deterministic AI systems | legge di prodotto, 100 richieste identiche in parallelo | da scrivere |
| Deterministic authorization for AI agents | deterministic authorization | idempotenza provata in CI | da scrivere |
| Designing an agent policy engine | agent policy engine | policy DSL | da scrivere |
| What an agent authorization record should contain | AI agent transaction receipt | ledger hash-chained, audit esterno | da scrivere |
| Why agent payments need an append-only audit trail | AI agent audit | ledger, kill switch, reconciliation | da scrivere |
| Revocation: how to stop an agent mid-flight | AI agent revocation | **DESIGN**: latenza di revoca non è misurata | da scrivere, con il limite dichiarato |

### Cluster 05 · Founder

| Titolo | Query | Fonte | Stato |
| --- | --- | --- | --- |
| What we changed after people attacked Noesia | Noesia, AI agent infrastructure | già raccontato in `lib/notes.ts`: il budget aggregato nato da un'obiezione pubblica | da scrivere |
| Why Noesia is not a payment company | Noesia, agent authorization | posizionamento "authorization layer" | da scrivere, dopo una verifica col CTO |
| Building Noesia in public: October 2026 | Noesia | mensile, dai fatti del mese | **serve il mese** |
| Why we hire by artifact | startup hiring | `artifact-based-hiring` esiste già | non riscrivere |

### Quello che non si scrive adesso

I cluster su **MCP**, **trust/safety** e **company building** richiedono materiale
che oggi non esiste: un'implementazione MCP reale, una posizione sulla
responsabilità firmata, i numeri del mese. Un pezzo su "come si revoca un
agente" scritto senza una misura di revoca è la cosa che il contratto editoriale
chiama *overclaim*, ed è anche il modo più veloce per farsi smontare da un
lettore tecnico.

## 4 · L'annuncio, con i limiti veri

Quello che è automatico:

- Il **sitemap** cambia a ogni pubblicazione, e Google lo rilegge da solo.
- La **Sitemap API** di Search Console viene chiamata dal postbuild
  (`scripts/submit-google-sitemap.mjs`) appena esistono le credenziali del
  service account: `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
  `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` e `GOOGLE_SEARCH_CONSOLE_SITE_URL` come
  variabili del progetto Pages. Senza, il build scrive nel log che ha saltato.
- **`news-sitemap.xml`** esiste già ed è il canale corretto per gli articoli
  freschi.
- **IndexNow** annuncia Bing, Yandex e Seznam con le URL pubblicate oggi.

Quello che non si può fare, e vale la pena scriverlo perché è la richiesta più
frequente: **non esiste un'API per chiedere a Google l'indicizzazione di un URL
singolo.** L'Indexing API di Google è riservata per policy agli annunci di
lavoro e agli eventi; usarla per gli articoli è una violazione dei termini e non
produce indicizzazione. "Request indexing" esiste solo nella dashboard, a mano.
Per Google l'annuncio è il sitemap che cambia, e per questo il lavoro fatto qui
è: la voce giusta nel sitemap, il feed aggiornato, la news sitemap, e la
Sitemap API quando ci sono le credenziali.

## 5 · Il giorno che pubblichi

Un pezzo si scrive e si ferma quando ha: una data (anche futura), almeno 1000
parole, il blocco dei claim con la fonte di ogni affermazione, e i link del
contratto (≥1 al pillar, ≥1 a un pezzo correlato, ≥1 a una pagina di entità:
`withnoesia.com` o `/work`). Poi:

```bash
npm run build          # deve essere verde
node scripts/verify.js # 141 controlli, incluso il minimo di parole
npm run check:brand    # nessun nome ritirato, nessun host sbagliato
```

Le immagini `og.png` e `cover.png` non sono facoltative: `verify.js` cade se
mancano, ed è voluto. Si generano con
`powershell -File scripts/og.ps1 -Only <slug>` dopo che il titolo e la
descrizione sono quelli definitivi, perché li legge da `lib/posts.ts`.

## 6 · Quello che serve da Mattia

1. **Il blocco dei claim per ogni pezzo**, o il materiale da cui ricavarlo. È la
   parte che nessuno può fare al posto suo: una fonte per ogni affermazione su
   Noesia, e la differenza fra quello che esiste e quello che è progettato.
2. **La firma prima di ogni data.** Il contratto la chiama "10 minuti di
   revisione": un pezzo con la data nel futuro è lì apposta per questo.
3. **Una risposta sulla truth table.** Il documento dice che non è approvata:
   finché le tre firme non ci sono, la colonna "public label" non è la verità del
   sito, e il §5 elenca cinque contraddizioni fra quello che il sito vecchio
   dichiara e quello che la sua stessa nota legale dice. Nessun articolo può
   girare intorno a quella domanda: la tocca.
