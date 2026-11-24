"use client";

import Link from "next/link";
import { Artwork } from "@/components/media/Artwork";
import { Icon } from "@/components/ui/Icon";
import { useStore } from "@/stores/store";
import type { CardItem } from "@/types";
import { formatViews } from "@/lib/format";

interface HeroProps {
  item: CardItem;
  description: string;
}

export function Hero({ item, description }: HeroProps) {
  const { isWatchlisted, toggleWatchlist } = useStore();
  const inList = isWatchlisted(item.id);
  const kindLabel = item.kind === "film" ? "Feature Film" : item.kind === "series" ? "Series" : "Featured";

  return (
    <section className="relative min-h-[76vh] w-full overflow-hidden">
      <Artwork seed={item.id} label="" variant="thumb" className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 hero-scrim" />

      <div className="page-pad relative z-10 flex min-h-[76vh] max-w-2xl flex-col justify-end pb-16 pt-32">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand">{kindLabel}</p>
        <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">{item.title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-dim sm:text-base">{description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-dim">
          <span className="inline-flex items-center gap-1 rounded border border-hairline px-1.5 py-0.5">
            <Icon name="star" size={11} filled className="text-brand" />
            {item.rating.toFixed(1)}
          </span>
          <span className="rounded border border-hairline px-1.5 py-0.5">{item.maturity}</span>
          <span>{formatViews(item.views)} views</span>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={item.watchHref}
            className="inline-flex items-center gap-2 rounded-md bg-brand px-6 py-2.5 text-sm font-semibold text-[#171204] transition hover:bg-[#f0c375]"
          >
            <Icon name="play" size={18} filled />
            Play
          </Link>
          <button
            onClick={() => toggleWatchlist(item.id)}
            className="inline-flex items-center gap-2 rounded-md bg-surface-2/80 px-5 py-2.5 text-sm font-medium text-ink backdrop-blur transition hover:bg-surface-3"
          >
            <Icon name={inList ? "check" : "plus"} size={17} />
            {inList ? "In Watchlist" : "Watchlist"}
          </button>
          <Link
            href={item.watchHref}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm text-ink-dim transition hover:text-ink"
          >
            More info
            <Icon name="info" size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
