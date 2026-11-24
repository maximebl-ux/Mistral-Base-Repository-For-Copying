import type { CardItem, ContentKind } from "@/types";
import { films, series, videos, channels } from "@/data/catalog";
import { toCard } from "@/lib/cards";

export function getAllCards(): CardItem[] {
  return [...films, ...series, ...videos.filter((v) => v.status === "published")].map(toCard);
}

export function findById(id: string) {
  return films.find((e) => e.id === id) ?? series.find((e) => e.id === id) ?? videos.find((e) => e.id === id) ?? channels.find((e) => e.id === id);
}

export function kindOf(entry: unknown): ContentKind | undefined {
  if (entry && typeof entry === "object" && "kind" in entry) return (entry as { kind: ContentKind }).kind;
  return undefined;
}

export function searchAll(q: string) {
  const t = q.toLowerCase();
  return getAllCards().filter((c) => c.title.toLowerCase().includes(t) || c.genres.some((g) => g.toLowerCase().includes(t)));
}
