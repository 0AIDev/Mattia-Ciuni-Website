# Blocchi dei claim, pezzo per pezzo

Il contratto editoriale non ammette un pezzo senza il controllo delle
affermazioni. Qui c'è, per ogni pezzo della coda, la tabella che il contratto
chiama *claims-check block*: la claim, lo stato, la prova, il test e il
verdetto.

La colonna **Stato** usa il vocabolario del contratto, perché è quello che
 distingue una cosa che esiste da una cosa che stiamo costruendo:

- **LIVE** — c'è nel prodotto e c'è la prova.
- **BUILD** — lo stiamo costruendo adesso, e si può descrivere il passo.
- **DESIGN** — progettato, non spedito. Va detto nel pezzo, non taciuto.
- **EXTERNAL** — fatto di terzi, con fonte di prima parte.

La colonna **Prova** per gli EXTERNAL è l'URL di prima parte, non un riassunto:
una claim esterna senza un URL è un ricordo, e un ricordo non si verifica.

Il materiale da cui sono tratti i pezzi è il repository di ricerca sul Desktop
descritto in [`editorial-plan.md`](editorial-plan.md) §3. Nessuna delle claim
qui sotto è una stima interna, e nessuna usa i numeri di dimensione del mercato
che quel materiale stesso marca come non verificabili.

---

## 2026-10-12 · Who is responsible when an AI agent buys the wrong thing

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| Visa, Mastercard e Amex hanno lanciato framework per transazioni agentiche e chi porta la perdita resta largamente non deciso | EXTERNAL | primary-source di Worldpay, riportato nella ricerca del 28-09-2026 | la frase è attribuita a chi l'ha detta, con ruolo e ente | passa |
| Dispute mancano di meccanismi di risoluzione consolidati; le finestre di chargeback sono state disegnate per il commerce a velocità umana | EXTERNAL | report Visa *Agentic Payments from the Ground Up* | citazione da documento di prima parte | passa |
| I log operativi non bastano, servono record di qualità evidentiary; chi ha il record migliore controlla l'inquadramento | EXTERNAL | serie FBTGibbons parte 5, 20-04-2026, studio legale di payments | due citazioni letterali, autore e data | passa |
| La posizione dell'autore è rispondere di ciò che è stato chiesto di fare e dimostrarlo | LIVE | posizione scritta nel memo pubblico del 03-10-2026 | l'articolo dichiara la posizione come propria | passa |
| Identità e responsabilità dell'agente è una riga non risolta della nostra tabella | LIVE | capability table interna, 03-10-2026 | dichiarata nel pezzo come aperta | passa, ed è dichiarata |

## 2026-10-15 · Why there should be no LLM in the authorization path

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| Nella checkout UCP l'agente non partecipa al passo di pagamento, per garantire determinismo | EXTERNAL | documentazione sviluppatore UCP | citazione letterale | passa |
| AP2 definisce «Verifiable Intent, Not Inferred Action» e lo collega al rischio di errore o allucinazione dell'agente | EXTERNAL | specifica AP2, core concepts | citazione letterale | passa |
| Il motore dà decisioni identiche a 100 richieste identiche in parallelo | LIVE | test nel repository, in esecuzione a ogni commit | rilanciato dalla suite, non dichiarato a parole | passa, «verified by test» |
| Le decisioni ricalcolate dal ledger tornano identiche | LIVE | test di replay | idem | passa |

## 2026-10-19 · The authorization layer for autonomous agents

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| Le date dei cinque framework sono quelle | EXTERNAL | comunicati Visa 30-04-2025, Mastercard 29-04-2025 e 10-06-2026, Google 16-09-2025 e 11-01-2026, OpenAI 29-09-2025, Stripe 11-12-2025 | ogni data è quella sulla pagina, non quella del pitch | passa |
| Non esiste un oggetto di autorità accettato a scala di produzione fuori da un pilota, con la perdita allocata per iscritto | EXTERNAL | gap dichiarato dalla stessa ricerca; nessuna fonte lo conferma | redatto come posizione difendibile, non come assoluto | passa con cautela |
| Le regole di rete allocano la perdita dentro un loop chiuso | EXTERNAL | serie FBTGibbons parte 1 | argomento, non fatto | passa come lettura |
| L'autore non rivendica il mercato come vuoto | — | — | il pezzo nomina i concorrenti per nome e ruolo | passa |

## 2026-10-22 · What should an AI agent be allowed to do

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| Un mandato delegato porta limiti di prezzo, tempi e altre condizioni | EXTERNAL | specifica AP2 | citazione | passa |
| Sull'espirazione: impostare il claim `exp` al valore più piccolo che consenta il compito | EXTERNAL | raccomandazione della specifica AP2 | citazione | passa |
| Mastercard descrive regole di autorizzazione e limiti di spesa applicati programmaticamente | EXTERNAL | comunicato Agent Pay for Machines, 10-06-2026 | citazione | passa |
| Il motore Noesia ha quattro campi per ogni permesso | LIVE | policy engine in costruzione | descritto come progetto, non come prodotto | passa |

## 2026-10-26 · An AI agent should never have your credit card

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| Google UCP usa i FPAN già memorizzati nel wallet | EXTERNAL | pagina di supporto merchant UCP | citazione | passa |
| Nekuda: un mandato per acquisto, token di reveal monouso, CVV valido 60 minuti | EXTERNAL | documentazione Nekuda | descrizione del prodotto di un vendor, attribuita | passa come claim del vendor |
| Reap: token per agente emesso al payment intent in ~120 ms, limitato a merchant e importo | EXTERNAL | pagina prodotto Reap | claim del vendor, non misurata | passa come claim del vendor |
| Un token è sicuro da maneggiare proprio perché non dice perché è stato maneggiato | — | — | argomento dell'autore | passa |
| Il pezzo non dice che nessuno lo fa | — | — | i tre vendor sono citati per nome | passa |

## 2026-10-29 · What it means to give an AI agent a budget

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| Tolleranza media alla delega ~£177, assunzione merchant £200, sei mercati | EXTERNAL | studio Checkout.com, 09-06-2026 | survey vendor, trattata come direzione | passa con etichetta |
| Non negoziabili: cap 30%, revoca istantanea 29%, cancellazione 28% | EXTERNAL | stesso studio | idem | passa con etichetta |
| 11% dei consumatori US lascerebbe decidere un acquisto a una AI | EXTERNAL | Gartner, 322 consumatori, 27-05-2026 | campione e data citati | passa |
| 48% ha usato AI per studiare l'ultimo acquisto, 35% aprirebbe le credenziali | EXTERNAL | indice Visa 2026 | idem | passa |
| Il controllo del budget e la scrittura del record sono nella stessa transazione | LIVE | correzione dopo l'audit esterno | descritto come correzione, non come capacità | passa |

## 2026-11-02 · Deterministic authorization for AI agents

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| L'idempotenza è sulla chiave dell'intenzione, non della richiesta | LIVE | test di concorrenza nel repository | in CI | passa |
| La catena hash rende visibile un edit senza fidarsi del database | LIVE | implementazione del ledger + verifica in CI | claim stretta: «tamper evident», non «tamper proof» | passa |
| Il tempo, la concorrenza e lo stato esterno sono le altre tre fonti di non determinismo | — | — | argomento dell'autore, con esempi | passa |
| Determinismo non rende giusta una policy sbagliata | — | — | dichiarato esplicitamente nel pezzo | passa |

## 2026-11-05 · The credit card is the wrong interface for AI agents

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| Dove serve autenticazione forte, la decisione è dell'emittente | EXTERNAL | documentazione rete sul SCA | il pezzo evita la formulazione di elusione | passa |
| Visa: il prodotto è in sviluppo e il risultato finale può non avere tutte le feature descritte | EXTERNAL | pagina sviluppatore Visa e pagina soluzioni | citazione | passa |
| Mastercard: autenticazione forte con biometria on-device | EXTERNAL | comunicato Agent Pay | citazione | passa |
| Stripe: Shared Payment Token legato a un mandato, non a un numero di carta | EXTERNAL | documentazione Stripe | descrizione del prodotto | passa |

## 2026-11-09 · What an agent authorization record should contain

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| Conservazione minima di due anni per i dati di investigazione contestazione | EXTERNAL | Visa Acceptance Risk Standards | standard pubblico | passa |
| Un record migliore determina l'inquadramento giuridico della disputa | EXTERNAL | FBTGibbons parte 5 | citazione | passa |
| Otto campi, di cui quattro sullo stato al momento della decisione | DESIGN | schema del record in costruzione | dichiarato come progetto | passa |
| Le deneghe si registrano come le concessioni | DESIGN | decisione di prodotto | dichiarato nel pezzo | passa |

## 2026-11-12 · Least privilege for AI agents

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| Il modello a ruoli presuppone una persona che accumula giudizio nel tempo | — | — | argomento dell'autore | passa |
| L'unità di delega è il task, non il ruolo | DESIGN | modello Noesia | dichiarato come progetto | passa |
| Nessun segreto condiviso di lunga durata per un agente | DESIGN | implementazione | non presentato come live | passa |

## 2026-11-16 · Why agent payments need an append-only audit trail

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| Verifiable Intent è un registro a prova di manomissione, co-sviluppato con Mastercard e donato a FIDO | EXTERNAL | comunicato Google, aprile 2026 | il pezzo abbassa la claim a «tamper evident» | passa con correzione esplicita |
| Il lettore con il record migliore controlla l'esito | EXTERNAL | FBTGibbons parte 5 | citazione | passa |
| Cancellazione del payload con catena intatta | DESIGN | schema del ledger | dichiarato come progetto | passa |
| Verifica della catena eseguita in CI | LIVE | test nel repository | claim stretta | passa |

## 2026-11-19 · The difference between an AI assistant and an autonomous agent

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| Nella checkout UCP l'utente completa il pagamento da solo | EXTERNAL | documentazione UCP | citazione | passa |
| ACP: l'utente conferma ogni passo, acquisto singolo | EXTERNAL | comunicato OpenAI 29-09-2025 | citazione, con nota che la pagina è del 2025 | passa |
| AP2 v0.2 introduce i pagamenti «Human Not Present» | EXTERNAL | comunicato FIDO, aprile 2026 | citazione | passa |
| Il prototipo attuale chiede conferma (163 → 137 euro) | LIVE | run del prototipo, citato come prototipo | il numero è dichiarato non production | passa |

## 2026-11-23 · Designing an agent policy engine

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| Il linguaggio di policy non ha escape hatch | DESIGN | linguaggio Noesia | dichiarato come progetto | passa |
| Politica immutabile una volta usata, versione nel record | DESIGN | implementazione | idem | passa |
| Dry run sulle decisioni passate | DESIGN | funzionalità descritta | non presentata come live | passa |
| Il motore non impara | DESIGN | decisione di prodotto | dichiarata | passa |

## 2026-11-26 · The moment AI agents stop being assistants

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| Le date dei cinque framework sono quelle | EXTERNAL | comunicati ufficiali | già verificate sopra | passa |
| «Oltre un milione di merchant Shopify in arrivo» è del 29-09-2025 e va ricontrollato | EXTERNAL | comunicato OpenAI | il pezzo cita la data e non il numero come attuale | passa |
| Tolleranza ~£177 | EXTERNAL | Checkout.com 09-06-2026 | survey vendor | passa con etichetta |
| Il pezzo non prevede una data | — | — | dichiarato in apertura | passa |

## 2026-11-30 · AI agents don't need more authority, not more intelligence

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| «These agents will need to be trusted with payments, not only by users, but by banks and sellers as well» | EXTERNAL | comunicato Visa 30-04-2025, Jack Forestell | citazione attribuita | passa |
| 96% degli acquirer ritiene importante la governance; 55% prevede nuove capacità di autorizzazione | EXTERNAL | indice Visa 2026 | stessa fonte, due numeri distinti | passa |
| 23% dei merchant distingue il traffico AI | EXTERNAL | indice Visa 2026 | verificato che non sia il 23% dei consumatori | passa |
| Ogni unità di autorità deve comprare reversibilità o evidenza | — | — | regola di progetto dell'autore | passa |

## 2026-12-03 · Revocation: how to stop an agent mid-flight

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| La revoca istantanea è il secondo non negoziabile (29%) | EXTERNAL | Checkout.com 06-2026 | survey vendor | passa con etichetta |
| La revoca «immediata» di ogni credenziale derivata è una claim del vendor | EXTERNAL | documentazione Nevermined | attribuita al vendor, non misurata | passa come claim del vendor |
| La nostra latenza di revoca non è misurata | DESIGN | nessuna misura | dichiarato nel pezzo | passa, ed è dichiarata |
| L'expiry è il meccanismo primario | DESIGN | modello Noesia | dichiarato come progetto | passa |

## 2026-12-07 · The agentic economy will start with small decisions

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| Il protocollo macchina a macchina pubblicava decine di milioni di dollari su 30 giorni ad aprile 2026 | EXTERNAL | dashboard del protocollo, aprile 2026 | il pezzo dà l'ordine di grandezza con la data e dice che gran parte del volume è test | passa con data |
| Tolleranza ~£177 | EXTERNAL | Checkout.com | già verificata | passa |
| Il modello di ricerca interno vieta di costruire il modello economico sui micropagamenti | — | analisi di mercato interna | il pezzo segue la regola invece di citare stime | passa |

## 2026-12-10 · Why autonomous purchasing needs a control layer

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| «L'ambiguità non è un'assenza di regole applicabili: le regole esistono» | EXTERNAL | FBTGibbons parte 1 | citazione, e il pezzo la concede | passa |
| Chi porta la perdita resta non deciso | EXTERNAL | Worldpay | citazione | passa |
| Accountability è elencata fra i problemi che il protocollo vuole risolvere | EXTERNAL | specifica AP2 | il pezzo lo usa come argomento, non come dato | passa |
| Il mercato non è vuoto: due società di mandato hanno raccolto, una con i venture delle reti | EXTERNAL | comunicati di finanziamento maggio 2025 | il pezzo le nomina | passa |

## 2026-12-14 · What happens when you let software actually do the job

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| Ogni giocatore della catena potrà riconoscere le transazioni facilitate da agenti | EXTERNAL | comunicato Mastercard Agent Pay | citazione | passa |
| Il pezzo non contiene claim numeriche sul mercato | — | — | verificato per lettura | passa |
| L'argomento è osservativo, non di prodotto | — | — | nessuna promise di Noesia | passa |

## 2026-12-17 · Only 23% of merchants can tell an agent from a human

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| 23% dei merchant distingue il traffico AI, 15% ha dati strutturati | EXTERNAL | indice Visa 2026 | verificato che non sia il dato consumatori | passa |
| Il rapporto di monitoraggio conta per numero, non per valore | EXTERNAL | fact sheet del programma di monitoraggio, 2025 | formula citata per intero | passa |
| Soglia eccessiva 150 bps in Asia Pacifico, Canada, Europa, USA; 220 nelle altre regioni | EXTERNAL | stesso fact sheet | il pezzo nomina le regioni, come impone la fonte | passa |
| Minimo 1.500 transazioni mensili per entrare nel programma | EXTERNAL | stesso fact sheet | citato | passa |
| Esclude le contestazioni risolte con soluzioni pre contesa | EXTERNAL | stesso fact sheet | citato | passa |
| Conservazione due anni dei dati di investigazione | EXTERNAL | Visa Acceptance Risk Standards | citato | passa |
| Non esiste un tasso di contesa agentico pubblicato | EXTERNAL | assenza verificata su tre linee indipendenti, più la conferma di un pratico del settore | il pezzo dichiara anche il numero senza fonte che è stato eliminato | passa |

## 2026-12-21 · The mandate has to be written before the agent runs

| Claim | Stato | Prova | Test | Verdetto |
| --- | --- | --- | --- | --- |
| AP2: si firma un mandato di intento prima, con limiti di prezzo, tempi e condizioni | EXTERNAL | specifica e comunicato AP2 | citazione | passa |
| Visa: la validazione confronta la richiesta con le istruzioni autenticate originali | EXTERNAL | documentazione sviluppatore Visa | citazione | passa |
| Un'inferenza è una previsione e non può essere applicata | — | — | argomento dell'autore | passa |
| Il peso legale della firma non è affermato | — | capability table, riga non risolta | il pezzo dichiara il limite | passa, ed è dichiarato |

---

## Le claim che non compaiono da nessuna parte

Tre cose che la ricerca contiene e che in nessun pezzo compaiono, perché sono
il tipo di contenuto che il contratto vieta:

1. **Il moltiplicatore di contese.** Non esiste una fonte di prima parte. Tre
   testate lo riportano con formulazione identica, il che è il modo in cui una
   singola affermazione non verificata si propaga. Non è una stima prudenziale,
   è una stima non verificata, e come tale non si può introdurre.
2. **I numeri di dimensione del mercato.** Le stime interne di capitali per
   diventare acquirer sono stime di vendor, non dichiarazioni di un
   regolatore, e non entrano in un modello. Nessun pezzo le cita.
3. **I dati del vecchio sito.** Finanziamenti, clienti, SLA e certificazioni che
   la nota legale dello stesso sito nega. Non sono entrati in nessun pezzo e non
   ci entreranno finché la tabella delle capability non è firmata.

## Cosa manca ancora, e quindi non si scrive

- **Il pezzo mensile.** «Building Noesia in public: ottobre 2026» non si scrive
  il 21 dicembre per ottobre: si scrive ai primi di novembre, con i fatti del
  mese. È in coda con la data di pubblicazione già decisa.
- **«Why Noesia is not a payment company».** Aspetta una verifica con il CTO
  sulla posizione legale. Il materiale c'è, la firma no.
- **«What we changed after people attacked Noesia».** Il materiale esiste
  (`lib/feedback.ts`, lo scambio su un commento), ma il pezzo va scritto come
  conseguenza, non come riassunto della pagina di feedback.
