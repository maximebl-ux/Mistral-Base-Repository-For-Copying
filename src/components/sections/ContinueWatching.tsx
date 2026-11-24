"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/stores/store";
import { allCards } from "@/lib/library-data";
import { Artwork } from "@/components/media/Artwork";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/primitives";

export function ContinueWatching() {
  const { library, user } = useStore();

  const cards = useMemo(() => {
    if (!user) return [];
    const byId = new Map(allCards().map((c) => [c.id, c]));
    return Object.values(library.progress)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((p) => ({ progress: p, card: byId.get(p.contentId) }))
      .filter((x) => x.card && x.progress.positionSec > 0);
  }, [library.progress, user]);

  if (!user) {
    return (
      <section className="page-pad py-4">
        <h2 className="mb-2 text-lg font-semibold text-ink">Continue Watching</h2>
        <EmptyState
          title="Sign in to keep watching"
          body="Continue Watching tracks where you left off and is stored locally in this browser."
          action={
            <Link href="/login" className="text-sm text-brand hover:underline">
              Sign in
            </Link>
          }
        />
      </section>
    );
  }

  if (!cards.length) return null;

  return (
    <section className="page-pad py-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Continue Watching</h2>
        <Link href="/library" className="text-sm text-brand hover:underline">
          Library
        </Link>
      </div>
      <div className="scrollbar-none flex snap-x gap-4 overflow-x-auto">
        {cards.map(({ progress, card }) => {
          const pct = Math.min(100, Math.round((progress.positionSec / progress.durationSec) * 100));
          return (
            <Link
              key={card!.id}
              href={`/watch/${card!.id}`}
              className="group w-[46vw] flex-none snap-start sm:w-[31vw] md:w-[23vw] lg:w-[19vw] xl:w-[16vw]"
            >
              <div className="card-ring relative overflow-hidden rounded-md transition group-hover:brightness-110">
                <Artwork seed={card!.id} label={card!.title} variant="thumb" className="aspect-video w-full" />
                <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                  <span className="rounded-full bg-black/60 p-3">
                    <Icon name="play" size={20} filled className="text-ink" />
                  </span>
                </span>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-black/50">
                  <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <p className="mt-2 text-sm font-medium text-ink">{card!.title}</p>
              <p className="text-xs text-ink-faint">{pct}% watched</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
