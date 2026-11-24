import { films, series, videos, channels } from "@/data/catalog";
import { seedComments } from "@/stores/seed";
import { toCard } from "@/lib/cards";
import type { CardItem, Comment } from "@/types";

export { channels, seedComments };

export function allCards(): CardItem[] {
  return [...films, ...series, ...videos.filter((v) => v.status === "published")].map(toCard);
}

export function commentsFor(contentId: string): Comment[] {
  return seedComments.filter((c) => c.contentId === contentId);
}

export const GENRES_LIST = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Fantasy", "Mystery", "Romance", "Sci-Fi", "Thriller",
];
