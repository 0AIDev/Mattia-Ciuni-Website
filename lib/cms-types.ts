// I tipi del pannello. Un solo `CmsKind` per tutto quello che il pannello
// pubblica, cosi' il draft, il commit Git e l'override statico parlano la stessa
// lingua e non serve un canale parallelo per ogni tipo di contenuto.
//
// I kind sono dichiarati anche nel check constraint della tabella Supabase
// (`20260925_000006_admin_cms.sql` + le migration di estensione): i due elenchi
// devono restare allineati, perche' il constraint e' la porta che rifiuta una
// riga invalida prima che arrivi al publish.
export type CmsKind =
  | "post"
  | "note"
  | "feedback"
  | "page"
  | "site_copy"
  | "job"
  | "voice_note"
  | "video"
  | "redirect"
  | "taxonomy"
  | "media_meta"
  | "settings";

export type CmsStatus = "draft" | "published" | "archived";

export interface CmsContentData {
  slug?: string;
  title?: string;
  description?: string;
  date?: string;
  updated?: string;
  category?: string;
  tags?: string[];
  keywords?: string[];
  content?: unknown[];
  author?: string;
  github?: string;
  [key: string]: unknown;
}

export interface AdminContentItem {
  id: string;
  kind: CmsKind;
  slug: string;
  status: CmsStatus;
  title: string;
  description: string;
  body_markdown: string;
  data: CmsContentData;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  version?: number;
}

export const CMS_KINDS: readonly CmsKind[] = [
  "post",
  "note",
  "feedback",
  "page",
  "site_copy",
  "job",
  "voice_note",
  "video",
  "redirect",
  "taxonomy",
  "media_meta",
  "settings",
] as const;

/**
 * Un kind e' "pubblicabile" se il publish scrive un file che la build statica
 * legge. `media_meta` e `settings` sono descrittori: i media stanno su R2 e le
 * impostazioni finiscono nel registro generato, quindi per questi il publish
 * committa il JSON ma non cambia il comportamento finche' il codice non legge
 * il file. La UI lo dichiara invece di far credere che il deploy basti da solo.
 */
export const CMS_CONTENT_KINDS: readonly CmsKind[] = [
  "post",
  "note",
  "feedback",
  "page",
  "site_copy",
  "job",
  "voice_note",
  "video",
  "redirect",
  "taxonomy",
] as const;

export function isCmsKind(value: unknown): value is CmsKind {
  return typeof value === "string" && (CMS_KINDS as readonly string[]).includes(value);
}

export function isCmsStatus(value: unknown): value is CmsStatus {
  return value === "draft" || value === "published" || value === "archived";
}

export function isCmsContentKind(value: unknown): value is CmsKind {
  return typeof value === "string" && (CMS_CONTENT_KINDS as readonly string[]).includes(value);
}
