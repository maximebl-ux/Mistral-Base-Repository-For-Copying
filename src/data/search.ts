import type { CardItem } from "@/types";
import { allCards } from "@/lib/library-data";

export function searchSuggestions(q: string): CardItem[] {
  const t = q.toLowerCase().trim();
  if (!t) return [];
  return allCards().filter(
    (c) =>
      c.title.toLowerCase().includes(t) ||
      c.tagline.toLowerCase().includes(t) ||
      c.genres.some((g) => g.toLowerCase().includes(t))
  );
}

export function searchPopular(): CardItem[] {
  return [...allCards()].sort((a, b) => b.rating - a.rating);
}

export const GENRE_LIST = [
  "Action", "Adventure", "Animation", "Comedy", "Crime",
  "Documentary", "Drama", "Fantasy", "Mystery", "Romance", "Sci-Fi", "Thriller",
];
