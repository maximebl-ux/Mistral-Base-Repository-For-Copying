import type { CardItem, ContentKind } from "@/types";
import { channels, episodes, films, series, videos } from "@/data/catalog";
import type { Episode } from "@/types";

export { films, series, videos, channels, episodes };

export function entryToCard(entry: {
  id: string; kind: string; title: string; tagline: string; year: number;
  rating: number; maturity: string; durationMin: number; views: number;
  posterPalette: number; genres: string[];
}): CardItem {
  return {
    id: entry.id,
    kind: entry.kind as ContentKind,
    title: entry.title,
    tagline: entry.tagline,
    year: entry.year,
    rating: entry.rating,
    maturity: entry.maturity as CardItem["maturity"],
    durationMin: entry.durationMin,
    views: entry.views,
    posterPalette: entry.posterPalette,
    genres: entry.genres,
    href:
      entry.kind === "film" ? `/movies/${entry.id}`
      : entry.kind === "series" ? `/series/${entry.id}`
      : `/watch/video/${entry.id}`,
    watchHref: `/watch/${entry.kind}/${entry.id}`,
  };
}

export function findEpisode(id: string): Episode | undefined {
  return episodes.find((ep) => ep.id === id);
}

export function seriesOfEpisode(epId: string) {
  const ep = findEpisode(epId);
  return ep ? series.find((s) => s.id === ep.seriesId) : undefined;
}

export function episodeIndex(epId: string): number {
  const ep = findEpisode(epId);
  if (!ep) return -1;
  const all = series.find((s) => s.id === ep.seriesId)?.seasons.flatMap((se) => se.episodes) ?? [];
  return all.findIndex((e) => e.id === epId);
}
