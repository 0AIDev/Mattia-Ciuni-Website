import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePublishedJson } from "./cms-format";

/**
 * I file JSON sono il punto d'incontro tra l'admin e la build statica:
 * l'admin salva un draft, il publish scrive il file su Git e il prossimo deploy
 * lo legge insieme alle collezioni esistenti. Il registry TypeScript resta la
 * base compatibile con gli articoli gia' pubblicati; un file CMS con lo stesso
 * slug lo sovrascrive.
 */
/**
 * Radice da cui leggere i contenuti pubblicati.
 *
 * Di default e' il `cwd`, cioe' quello che vede la build. Il override esiste per
 * i test: `loadCmsCollection` legge il filesystem al momento dell'import, e senza
 * questo un test che vuole provare il loader deve scrivere nella directory vera
 * del progetto. Un test che scrive in `content/cms/page/` e poi lo cancella
 * distrugge anche i file che gia' c'erano, e in un repo senza versione locale
 * quello e' un danno irreversibile.
 */
let contentRoot = process.cwd();

export function setCmsContentRoot(root: string): void {
  contentRoot = root;
}

export function loadCmsCollection<T>(kind: string): T[] {
  const directory = join(contentRoot, "content", "cms", kind);
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      try {
        // `parsePublishedJson` e non `JSON.parse`: un file scritto dalla prima
        // versione del publish finiva con un `"\\n"` letterale e non era
        // parseable. Qui si scartava con un warning, e il contenuto pubblicato
        // non arrivava online senza che nessuno lo sapesse.
        return parsePublishedJson<T>(readFileSync(join(directory, file), "utf8"));
      } catch (error) {
        console.warn(`cms: invalid ${kind}/${file}`, error);
        return null;
      }
    })
    .filter((value): value is T => value !== null);
}

/**
 * Un file CMS vince sul registry per slug.
 *
 * `keepUnlistedFields` serve ai registri che il pannello **non** possiede per
 * intero. Un'offerta di lavoro, per esempio, ha `postedAt` e `challenge` che
 * l'editor non ha un campo per: sostituendo l'oggetto intero, pubblicare una
 * descrizione dall'editor avrebbe cancellato quei campi dalla pagina, e il
 * `JobPosting` sarebbe uscito senza `datePosted`. Con l'opzione, i campi che il
 * file elenca vincono e quelli che **non** elenca restano quelli del registry.
 *
 * Le collezioni editoriali (articoli, note, pagine) non la usano: li il
 * pannello li possiede davvero, e un campo vuoto deve poter restare vuoto.
 */
export function mergeCmsCollection<T extends { slug: string }>(base: T[], overrides: T[], options: { keepUnlistedFields?: boolean } = {}): T[] {
  const bySlug = new Map(base.map((item) => [item.slug, item]));
  for (const item of overrides) {
    const existing = options.keepUnlistedFields ? bySlug.get(item.slug) : undefined;
    bySlug.set(item.slug, existing ? ({ ...existing, ...item } as T) : item);
  }
  return [...bySlug.values()];
}
