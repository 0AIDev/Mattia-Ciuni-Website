import { loadCmsCollection, mergeCmsCollection } from "./cms-content";

export type FounderVideo = {
  slug: string;
  title: string;
  description: string;
  date: string;
  videoSrc: string;
  poster?: string;
  duration?: string;
  locales?: string[];
  [key: string]: unknown;
};

// Come per le voice notes: registry vuoto in codice, override dal pannello. Un
// video senza `videoSrc` non entra nell'elenco, perche' un lettore con sorgente
// vuoto e' un riquadro nero invece di un video.
const baseVideos: FounderVideo[] = [];

const overrides = loadCmsCollection<FounderVideo>("video").filter(
  (video) => typeof video?.slug === "string" && typeof video.videoSrc === "string" && video.videoSrc.length > 0,
);

export const founderVideos: FounderVideo[] = mergeCmsCollection(baseVideos, overrides).sort((a, b) =>
  String(b.date || "").localeCompare(String(a.date || "")),
);

export function founderVideosForLocale(locale: string): FounderVideo[] {
  return founderVideos.filter((video) => !video.locales || (Array.isArray(video.locales) && video.locales.includes(locale)));
}
