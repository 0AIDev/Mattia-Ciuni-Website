import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
        return JSON.parse(readFileSync(join(directory, file), "utf8")) as T;
      } catch (error) {
        console.warn(`cms: invalid ${kind}/${file}`, error);
        return null;
      }
    })
    .filter((value): value is T => value !== null);
}

export function mergeCmsCollection<T extends { slug: string }>(base: T[], overrides: T[]): T[] {
  const bySlug = new Map(base.map((item) => [item.slug, item]));
  for (const item of overrides) bySlug.set(item.slug, item);
  return [...bySlug.values()];
}
