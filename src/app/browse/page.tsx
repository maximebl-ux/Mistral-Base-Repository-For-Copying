"use client";

import { useMemo, useState } from "react";
import { ContentCard } from "@/components/cards/ContentCard";
import { EmptyState, Select } from "@/components/ui/primitives";
import { GENRES } from "@/data/catalog";
import { allCards } from "@/lib/library-data";
import type { CardItem, ContentKind } from "@/types";

const KINDS: { key: "all" | ContentKind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "film", label: "Films" },
  { key: "series", label: "Series" },
  { key: "video", label: "Videos" },
];

export default function BrowsePage() {
  const [kind, setKind] = useState<"all" | ContentKind>("all");
  const [genre, setGenre] = useState("All genres");
  const [sort, setSort] = useState("trending");

  const items = useMemo(() => {
    let list: CardItem[] = allCards().filter((c) => (kind === "all" ? true : c.kind === kind));
    if (genre !== "All genres") list = list.filter((c) => c.genres.includes(genre));
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    else if (sort === "year") list = [...list].sort((a, b) => b.year - a.year);
    else if (sort === "title") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else list = [...list].sort((a, b) => b.views - a.views);
    return list;
  }, [kind, genre, sort]);

  return (
    <div className="page-pad min-h-screen pb-20">
      <div className="pt-28">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-ink">Browse the catalogue</h1>
          <div className="flex gap-2">
            <Select value={genre} onChange={(e) => setGenre(e.target.value)} aria-label="Filter by genre">
              {["All genres", ...GENRES].map((g) => <option key={g}>{g}</option>)}
            </Select>
            <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
              <option value="trending">Trending</option>
              <option value="rating">Top rated</option>
              <option value="year">Newest</option>
              <option value="title">A-Z</option>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          {items.length === 0 ? (
            <EmptyState title="Nothing matches those filters" body="Try a different genre or content type." />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {items.map((c) => <ContentCard key={c.id} item={c} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
