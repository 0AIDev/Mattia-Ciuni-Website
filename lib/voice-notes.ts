export type VoiceNote = {
  slug: string;
  title: string;
  description: string;
  date: string;
  audioSrc: string;
  duration?: string;
};

// Add recordings here when they are ready. Keeping the registry typed means the
// homepage and the archive will use the same metadata without a CMS migration.
export const voiceNotes: VoiceNote[] = [];
