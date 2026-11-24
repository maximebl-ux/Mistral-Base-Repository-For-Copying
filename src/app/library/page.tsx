"use client";

import { useState } from "react";
import { ContentCard } from "@/components/cards/ContentCard";
import { EmptyState } from "@/components/ui/primitives";
import { useStore } from "@/stores/store";
import { allCards } from "@/lib/library-data";
import type { CardItem } from "@/types";

const TABS = ["Watchlist", "Liked", "History"] as const;
type Tab = (typeof TABS)[number];

export default function LibraryPage() {
  const store = useStore();
  const { library } = store;
  const [tab, setTab] = useState<Tab>("Watchlist");

  const find = (id: string): CardItem | undefined =>
    allCards().find((c) => c.id === id);

  const ids: Record<Tab, string[]> = {
    Watchlist: library.watchlist,
    Liked: library.liked,
    History: Object.values(library.progress)
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .map((p) => p.contentId),
  };

  const items = ids[tab].map(find).filter((c): c is CardItem => Boolean(c));

  return (
    <div className="page-pad min-h-screen pb-20">
      <div className="pt-28">
        <h1 className="text-2xl font-bold text-ink">My Library</h1>
        <div className="mt-4 flex gap-2" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                tab === t ? "bg-brand font-semibold text-[#171204]" : "bg-surface-2 text-ink-dim hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            title={`Your ${tab.toLowerCase()} is empty`}
            body={tab === "History" ? "Titles you watch will appear here so you can pick up where you left off." : "Titles you add while browsing appear here."}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
      <p className="mt-10 text-xs text-ink-faint">Prototype notice: your library is stored locally in this browser only.</p>
    </div>
  );
}
