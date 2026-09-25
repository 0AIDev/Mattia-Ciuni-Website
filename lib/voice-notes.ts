import { loadCmsCollection, mergeCmsCollection } from "./cms-content";

export type VoiceNote = {
  slug: string;
  title: string;
  description: string;
  date: string;
  audioSrc: string;
  duration?: string;
  /** Lingue in cui la nota e' pubblicata. Una nota senza lingue esiste solo in inglese. */
  locales?: string[];
  [key: string]: unknown;
};

// Il registro tipizzato resta il default in codice: senza un file pubblicato il
// sito si comporta esattamente come prima. Un file CMS con lo stesso slug
// sovrascrive la voce, cosi' dal pannello si corregge un titolo senza toccare
// il registry, e una nota nuova non richiede nessuna modifica al codice.
const baseVoiceNotes: VoiceNote[] = [];

const overrides = loadCmsCollection<VoiceNote>("voice_note").filter(
  (note) => typeof note?.slug === "string" && typeof note.audioSrc === "string" && note.audioSrc.length > 0,
);

export const voiceNotes: VoiceNote[] = mergeCmsCollection(baseVoiceNotes, overrides).sort((a, b) =>
  String(b.date || "").localeCompare(String(a.date || "")),
);

/** Le note che hanno una versione per la lingua richiesta, in ordine di data. */
export function voiceNotesForLocale(locale: string): VoiceNote[] {
  return voiceNotes.filter((note) => !note.locales || (Array.isArray(note.locales) && note.locales.includes(locale)));
}
