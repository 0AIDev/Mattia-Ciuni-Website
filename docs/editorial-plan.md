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
| Le card sono gia' nel repository | [`scripts/og.ps1`](../scripts/og.ps1) | La build che pubblica un pezzo gira su Cloudflare, senza PowerShell: la `og.png` e la `cover.png` di un pezzo di coda sono quindi committate **prima** della sua data, e `-Scheduled` le rigenera in un colpo solo. Il controllo in `verify.js` cerca la cartolina senza pezzo, che è il difetto vero, e non la cartolina senza pagina, che è la normalità di una coda. |
| La build che gira da sola | [`.github/workflows/publish-scheduled.yml`](../.github/workflows/publish-scheduled.yml) | Lunedi, mercoledi, giovedi e venerdi spinge un commit vuoto quando un pezzo porta la data di oggi, e Cloudflare ricostruisce da quel push. Non serve alcun segreto: il `GITHUB_TOKEN` del workflow basta, e un deploy hook non si puo' creare per un progetto Pages. |
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

`FR` = il repository di ricerca sul Desktop: la cartella **Fundroom**, dentro
`Team-Allignment/`. Due nomi di cartella al suo interno contengono il nome
ritirato del prodotto, e `scripts/check-brand.mjs` non permette di scriverlo in
un file tracciato (è lui che ha fermato la prima build di questi articoli, e ha
fatto bene). I percorsi qui sotto partono quindi da `01-RESEARCH/`, e la
cartella con i documenti dell'offerta pre-seed è quella che finisce in
`-preseed-deck`.

I claim di ogni pezzo, cioè la fonte di ogni singola affermazione, sono in
[`editorial-claims.md`](editorial-claims.md). Una coda senza claim non è una
coda che si può pubblicare.

### Le fonti che hanno sbloccato la coda

La parte che mancava era il materiale. Le tre fonti che hanno reso scrivibili
ventuno pezzi sono state le seguenti, e sono tutte di prima parte o di studio
professionale con data:

| File | Che cosa contiene | Pezzi che sblocca |
| --- | --- | --- |
| `research/sources/agentic-rails-primaries.md` | comunicati Visa, Mastercard, Google, OpenAI, Stripe, con le date sulle pagine e le citazioni letterali; l'evidenza su disputa e responsabilità | 12 |
| `research/sources/agent-checkout-network-primaries.md` | il perimetro di chi è chi: mandatari, identità, issuer, e il costo di essere una rete | 8 |
| `research/product/25-agentic-payments-competitive-sweep-2026-09-29.md` | chi copre quale lavoro, senza lasciare che un partner scopra un competitor da solo | 5 |
| `analysis/10-rails-verification.md` | la frase «le regole esistono» e perché non chiude il caso | 3 |
| `analysis/03-market-model.md` | i numeri di sondaggio, con il voto di fonte, e i numeri che non si possono usare | 4 |
| `memo/2026-10-03-delegated-authority-in-euro.md` | la tesi di Mattia: tre posizioni, e la responsabilità come posizione | 5 |

### Il calendario, due pezzi a settimana

Il tetto del contratto è due pezzi a settimana, mai due URL nuovi lo stesso
giorno. Quindi la coda è **lunedì e giovedì**, e comincia lunedì 12 ottobre
perché la settimana del 5 è già piena: quel giorno sono usciti i due pezzi
delle permission e del checkout.

| Data | Titolo | Query | Cluster |
| --- | --- | --- | --- |
| 05-10 | Why AI agents need permission systems | AI agent permissions | 02 |
| 05-10 | Why AI agents keep stopping at checkout | AI agents checkout | 03 |
| **12-10** | Who is responsible when an AI agent buys the wrong thing | AI agent liability | 03 |
| **15-10** | Why there should be no LLM in the authorization path | deterministic AI systems | 04 |
| **19-10** | The authorization layer for autonomous agents | AI agent authorization | 02 |
| **22-10** | What should an AI agent be allowed to do | AI agent controls | 02 |
| **26-10** | An AI agent should never have your credit card | AI agent credit card | 02 |
| **29-10** | What it means to give an AI agent a budget | AI agent spending limit | 03 |
| **02-11** | Deterministic authorization for AI agents | deterministic authorization | 04 |
| **05-11** | The credit card is the wrong interface for ai agents | AI agent payment infrastructure | 03 |
| **09-11** | What an agent authorization record should contain | AI agent transaction receipt | 04 |
| **12-11** | Least privilege for AI agents | least privilege AI agents | 02 |
| **16-11** | Why agent payments need an append-only audit trail | AI agent audit | 04 |
| **19-11** | The difference between an AI assistant and an autonomous agent | AI assistant vs autonomous agent | 01 |
| **23-11** | Designing an agent policy engine | agent policy engine | 04 |
| **26-11** | The moment AI agents stop being assistants | autonomous agents | 01 |
| **30-11** | AI agents don't need more intelligence, they need more authority | AI agent authority | 01 |
| **03-12** | Revocation: how to stop an agent mid-flight | AI agent revocation | 04 |
| **07-12** | The agentic economy will start with small decisions | agentic economy | 01 |
| **10-12** | Why autonomous purchasing needs a control layer | AI agent purchasing | 03 |
| **14-12** | What happens when you let software actually do the job | autonomous AI agents | 01 |
| **17-12** | Only 23% of merchants can tell an agent from a human | AI agent traffic | 03 |
| **21-12** | The mandate has to be written before the agent runs | agent mandate | 02 |

Tutti e ventuno sono **scritti**, tutti passano il controllo delle mille parole,
e nessuno è nell'export finché la sua data non arriva.

### L'aritmetica, detta perché il piano la chiede

Il piano originale chiede trentasei pezzi in novanta giorni, cioè circa tre a
settimana. Il contratto di questo sito ne ammette due. ** Vince il contratto,
e il conto è semplice: ventuno pezzi in undici settimane, fino al 21 dicembre.**
Il resto del piano non è scartato, è spostato: il mese due del piano
(spending, accountability) e il mese tre (tecnico, consolidamento Noesia)
diventano il primo trimestre del 2027, con due pezzi a settimana e le stesse
fonti.

### Quello che non si scrive adesso

Tre pezzi hanno il titolo e la data ma non la fonte, e restano in attesa:

- **Why Noesia is not a payment company.** Aspetta una verifica con il CTO
  sulla posizione legale. Il materiale c'è, la firma no.
- **What we changed after people attacked Noesia.** Il materiale esiste
  (`lib/feedback.ts`), ma il pezzo va scritto come conseguenza, non come
  riassunto della pagina di feedback.
- **Building Noesia in public: ottobre 2026.** Non si scrive a dicembre per
  ottobre: si scrive ai primi di novembre, con i fatti del mese.

E un pezzo che non si scrive affatto, perché il piano lo chiede e il contratto
lo vieta: la pagina di aggregazione per topic (`/thoughts/ai-agent-authorization/`
e simili). Ventuno URL che rispondono alla stessa domanda di quelli che già
esistono è il modo più veloce per farsi declassare come hub di pagine vuote. Il
piano chiedeva anche la pagina `/now` come pagina propria: oggi la sezione
**Now** sta sulla home ed è un paragrafo, e la sua versione lunga ha più senso
come nota che come rotta nuova.

### Un pezzo di oggi cita pezzi di domani

La coda è scritta tutta insieme, quindi un pezzo appena pubblicato contiene
link verso pezzi che escono nelle settimane dopo. Sono link a pagine che **non
esistono ancora**: per un lettore restano un 404 per qualche giorno, e il
controllo dei link interni in `verify.js` li avrebbe contati come morti, facendo
cadere il controllo proprio il giorno della pubblicazione.

La correzione è nel controllo: un link interno che punta a uno slug presente in
un registro, in una sezione che il sito usa, è un **pezzo programmato** e va
tollerato finché non esce. Uno slug che non è in nessun registro resta un
errore di battitura e continua a far fallire il controllo, che è la cosa che il
controllo deve trovare. La lista dei link programmati viene stampata a ogni
esecuzione, quindi non è un'eccezione invisibile.

Se questo fastidio non è accettato, l'alternativa è scrivere i pezzi in modo che
citino solo pezzi già usciti, che appiattisce la sequenza degli argomenti. Ho
scelto la prima strada e ho reso la seconda esplicita nel log.

### Una nota operativa sulle card

La card di un pezzo **non pubblicato deve esistere gia' nel repository**. La build
che lo pubblica gira su Cloudflare, dove non c'e' PowerShell: senza la card in
`public/`, il pezzo esce il giorno giusto con la `og:image` dichiarata e
mancante. Le card dei ventuno pezzi di coda sono quindi gia' committate, e
`verify.js` le accetta perche' controlla che non ci sia una cartolina per uno
slug che nessun registro contiene, non che ogni cartolina abbia gia' la sua
pagina.

Il comando per rigenerarle, quando un titolo o una descrizione cambiano:

```bash
powershell -NoProfile -File scripts/og.ps1 -Only <slug>   # un pezzo
powershell -NoProfile -File scripts/og.ps1 -Scheduled      # tutta la coda
```

Il giro **completo** senza flag resta da usare con cautela: sovrascrive anche le
card ritoccate a mano dopo la generazione, che è il caso della card di Raj
(commit 3993165). E serve rigenerarle tutte quando cambia lo sfondo, perché
allora anche i pezzi ancora da pubblicare devono avere la card nuova.

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

### Lo stato reale, verificato il 5 ottobre 2026

Quello che segue è stato letto dal progetto Cloudflare, non dedotto:

| Anello | Stato | Chi lo chiude |
| --- | --- | --- |
| Data che decide la pubblicazione | **funziona**, verificato con un pezzo spostato a oggi | fatto |
| Card in `public/` per tutta la coda | **funziona**, 42 immagini committate | fatto |
| Build su Cloudflare | **funziona**, deploy verdi | fatto |
| `CLOUDFLARE_DEPLOY_HOOK` su GitHub Actions | **non serve**: un deploy hook Pages non si puo' creare, il workflow spinge un commit vuoto | fatto |
| `INDEXNOW_KEY` | **funziona**: la build lo annuncia a ogni ricostruzione | fatto |
| Credenziali Google (`GOOGLE_*`) | **funzionano**: la build scrive `submitted https://mattiaciuni.com/sitemap.xml` | fatto |
| `RESEND_FROM_EMAIL` | mittente su un dominio del marchio ritirato | l'utente, dalla dashboard |

I primi tre anelli sono gli unici che fanno partire lunedì, e per due bastano
trenta secondi di dashboard ciascuno.

**Gli hook di build non si creano con l'API.** L'endpoint esiste solo per
Workers Builds (`/accounts/{id}/builds/workers/{script}/deploy_hooks`); per un
progetto Pages collegato a Git si creano dalla dashboard. Il valore va quindi
copiato a mano nei secret del repository, in Settings → Secrets and variables →
Actions.

**Perché non ho corretto `INDEXNOW_KEY` con l'API.** Tutte e 18 le variabili del
progetto sono in chiaro e leggibili, quindi una `PATCH` con l'elenco completo
sarebbe stata tecnicamente possibile, ma la forma esatta del corpo non e'
documentata nella specifica risolvibile e i primi tentativi sono stati rifiutati.
Una `PATCH` sbagliata avrebbe potuto azzerare le altre diciassette variabili,
inclusa la chiave di Resend e il token del pannello: peggio che lasciare la
variabile sbagliata. Un campo nella dashboard e' piu' breve e non rischia niente.

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
