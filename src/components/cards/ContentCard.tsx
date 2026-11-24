"use client";

import Link from "next/link";
import { Artwork } from "@/components/media/Artwork";
import { formatViews } from "@/lib/format";
import { useStore } from "@/stores/store";
import type { CardItem } from "@/types";

const kindLabel: Record<string, string> = { film: "Film", series: "Series", video: "Video" };

export function ContentCard({ item }: { item: CardItem }) {
  const { isWatchlisted, toggleWatchlist } = useStore();
  const saved = isWatchlisted(item.id);

  return (
    <div className="group relative flex-none">
      <Link href={item.watchHref} className="block overflow-hidden rounded-lg transition duration-300 hover:scale-[1.03]" >
        <Artwork seed={item.id} label={item.title} className="aspect-video w-full" />
      </Link>
      <button
        aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
        onClick={() => toggleWatchlist(item.id)}
        className="absolute right-2 top-2 rounded bg-brand/90 px-1.5 py-1 text-xs text-[#171204] opacity-0 transition group-hover:opacity-100"
      >
        {saved ? "✓" : "+"}
      </button>
      <div className="mt-2">
        <p className="truncate text-sm font-medium text-ink">{item.title}</p>
        <p className="text-xs text-ink-dim">{item.year} · {kindLabel[item.kind]} · {item.maturity}</p>
      </div>
    </div>
  );
}
