# Distribuzione dei ruoli: i feed e dove mandarli

Tre URL, una sola fonte di verità (`lib/careers/jobs.ts`). Un ruolo passa a
`status: "open"` e i tre feed si aggiornano al prossimo `npm run build` — sono
route statiche, non endpoint dinamici: il feed pubblicato è lo stesso export che
pubblica le pagine, e non può dire una cosa diversa da quello che il sito dice.

| Feed | URL | Formato | Chi lo legge |
| --- | --- | --- | --- |
| XML Indeed | `https://mattiaciuni.pages.dev/jobs.xml` | `<source>/<job>` | Indeed, Glassdoor, Jooble, Talent.com/Neuvoo, Jobrapido |
| RSS 2.0 | `https://mattiaciuni.pages.dev/jobs.rss.xml` | RSS | Careerjet, lettori generici, IFTTT |
| Atom 1.0 | `https://mattiaciuni.pages.dev/jobs.atom.xml` | Atom | aggregatori europei, alcuni ATS |

La trasformazione sta tutta in `lib/careers/feed.ts`: description HTML pulita
(`h3` dalle sezioni `###`, `ul` dagli elenchi), solo ruoli `open`, tetto di 100
voci (`FEED_LIMIT`). Il JSON-LD `JobPosting` delle pagine ruolo condivide la
stessa description, quindi Google Jobs e le board non possono leggere verità
diverse.

## La regola che non si negozia

Ogni `<url>`, ogni `<link>`, ogni `guid` punta a
`https://mattiaciuni.pages.dev/careers/<slug>/`. La candidatura avviene **sul
sito**: il form con verifica email, il challenge pagato, il database. Nessuna
board riceve un form suo, nessun click è sponsorizzato. Se un aggregatore
propone "apply on our site" come default, si disattiva: è il modo in cui le
board monetizzano i tuoi candidati.

## Checklist di submission

| # | Board | Dove | Feed da dare | Tempi |
| --- | --- | --- | --- | --- |
| 1 | Indeed | indeed.com/hire → Add organic listings | `jobs.xml` | 1–3 giorni |
| 2 | Glassdoor | employer.glassdoor.com → Post a job → Import from XML feed | `jobs.xml` | 3–5 giorni |
| 3 | Jooble | jooble.org → For employers → Add job feed | `jobs.xml` | 1–2 giorni |
| 4 | Talent.com / Neuvoo | talent.com → For employers → XML feed | `jobs.xml` | 1–3 giorni |
| 5 | Careerjet | careerjet.com → For employers → Submit your jobs | `jobs.rss.xml` | 1–3 giorni |
| 6 | Jobrapido | jobrapido.com → employer portal | `jobs.xml` | 2–5 giorni |
| 7 | Google Jobs | nessuna submission: il JSON-LD delle pagine ruolo è la submission | — | 1–7 giorni |
| 8 | LinkedIn | post manuale con link a `/careers/` (l'API richiede partner access) | — | immediato |
| 9 | X / Discord / Reddit | post manuale con `?utm_source=x` / `discord` / `reddit` | — | immediato |

Tutte le submission del feed sono gratuite. Il "sponsored boost" è l'unico
prodotto a pagamento e non serve.

## Da dove torna il candidato (la parte che si misura)

Ogni candidato arriva con una fonte. I link manuali portano
`?utm_source=<board>` (es. `/careers/ml-engineer-risk/?utm_source=linkedin`);
chi arriva dal feed di una board senza UTM viene riconosciuto dall'hostname del
referrer. Il form manda il valore al server, che lo confina alla allowlist di
`lib/careers/validation.ts` (`APPLICATION_SOURCES`) prima di scriverlo — il
client può dire quello che vuole, il database registra solo valori puliti. La
colonna è `source` su `careers_applications` (testo; i valori fuori lista
tornano `direct`).

> **Migrazione database (una volta, manuale):**
> `alter table careers_applications add column source text not null default 'direct';`
> L'endpoint è autosufficiente nel frattempo: se la colonna manca, l'INSERT con
> `source` prende un 400 e il codice riprova senza — la candidatura non si perde
> mai per una colonna di analytics. Dopo la migrazione, il primo tentativo la
> registra e le righe precedenti restano `direct`: è la verità (nessun feed
> esisteva prima).

Dopo tre mesi il report è una query:
`select source, count(*) from careers_applications group by 1 order by 2 desc;`
— e dice dove vale la pena passare il tempo.

## Cosa NON è stato costruito (e perché)

**Job alerts email.** Il prompt la segnava come opzionale: è un prodotto intero
(nuova tabella Supabase, endpoint di iscrizione con verifica, email Resend,
invio al publish). La pagina careers ha già il link al Sunday log settimanale,
che arriva a chi si interessa al lavoro: finché i ruoli si contano sulle dita
della mano, un alert dedicato è infrastruttura per nessuno. Quando i ruoli
diventano il modo principale di entrare in azienda, il suo test è la prima riga
di quel lavoro.

**CORS.** Gli aggregatori leggono i feed **server-side** (il loro crawler fa
una GET): i vincoli CORS proteggono il browser di un visitatore, non il crawler
di una board. Le risposte portano già `Cache-Control: public, max-age=3600` e
`robots.txt` dichiara i tre URL.
