import type { CardItem, ContentKind } from "@/types";

export const kindLabel: Record<ContentKind, string> = {
  film: "Film",
  series: "Series",
  video: "Video",
};

export function toCard(e: {
  id: string;
  kind: ContentKind;
  title: string;
  tagline: string;
  year: number;
  rating: number;
  maturity: string;
  views: number;
  posterPalette: number;
  durationMin?: number;
  genres?: string[];
}): CardItem {
  return {
    id: e.id,
    kind: e.kind,
    title: e.title,
    tagline: e.tagline,
    year: e.year,
    rating: e.rating,
    maturity: e.maturity as CardItem["maturity"],
    durationMin: e.durationMin ?? 0,
    views: e.views,
    posterPalette: e.posterPalette,
    genres: e.genres ?? [],
    href:
      e.kind === "film" ? `/movies/${e.id}` : e.kind === "series" ? `/series/${e.id}` : `/watch/${e.id}`,
    watchHref: `/watch/${e.id}`,
  };
}
