"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ContentCard } from "@/components/cards/ContentCard";
import { EmptyState, Input, Select } from "@/components/ui/primitives";
import { GENRES } from "@/data/catalog";
import type { CardItem } from "@/types";

const TABS = ["All", "Films", "Series", "Videos"] as const;
type Tab = (typeof TABS)[number];

function pool(cards: CardItem[]): CardItem[] {
  return [...cards].sort((a, b) => b.rating - a.rating);
}

export function SearchClient({ allItems }: { allItems: CardItem[] }) {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [query, setQuery] = useState(q);
  const [tab, setTab] = useState<Tab>("All");
  const [genre, setGenre] = useState("All genres");
  const [sort, setSort] = useState("Relevance");

  const results = useMemo(() => {
    const t = query.trim().toLowerCase();
    let items = t
      ? allItems.filter(
          (c) => c.title.toLowerCase().includes(t) || c.tagline.toLowerCase().includes(t) || c.genres.some((g) => g.toLowerCase().includes(t))
        )
      : pool(allItems);
    if (tab === "Films") items = items.filter((c) => c.kind === "film");
    if (tab === "Series") items = items.filter((c) => c.kind === "series");
    if (tab === "Videos") items = items.filter((c) => c.kind === "video");
    if (genre !== "All genres") items = items.filter((c) => c.genres.includes(genre));
    if (sort === "Rating") items = [...items].sort((a, b) => b.rating - a.rating);
    if (sort === "Year") items = [...items].sort((a, b) => b.year - a.year);
    if (sort === "A-Z") items = [...items].sort((a, b) => a.title.localeCompare(b.title));
    return items;
  }, [query, tab, genre, sort, allItems]);

  return (
    <div className="page-pad min-h-screen pb-20">
      <div className="pt-28">
        <h1 className="text-2xl font-bold text-ink">{query ? <>Results for “{query}”</> : <>Search the catalogue</>}</h1>
        <input
          className="mt-4 w-full max-w-lg rounded-md border border-hairline bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
          placeholder="Try “mystery” or a title…"
          aria-label="Search catalogue"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap items-center gap-2" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${tab === t ? "bg-brand font-semibold text-[#171204]" : "bg-surface-2 text-ink-dim hover:text-ink"}`}
            >
              {t}
            </button>
          ))}
          <Select value={genre} onChange={(e) => setGenre(e.target.value)} aria-label="Filter by genre">
            {["All genres", ...GENRES].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort results">
            {["Relevance", "Rating", "Year", "A-Z"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </div>
        <p className="mt-6 text-sm text-ink-dim">{results.length} result{results.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="mt-4">
        {results.length === 0 ? (
          <EmptyState title="No results found" body='Try a different search — for example "mystery", "documentary" or a title name.' />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {results.map((r) => (
              <ContentCard key={r.id} item={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
