"use client";

import { useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { ContentCard } from "@/components/cards/ContentCard";
import type { CardItem } from "@/types";

export function Rail({ title, items }: { title: string; items: CardItem[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  if (!items.length) return null;

  return (
    <section className="group/row relative py-4">
      <h2 className="mb-2 text-lg font-semibold text-ink">{title}</h2>
      <div className="relative">
        <div
          ref={scroller}
          className="scrollbar-none flex snap-x gap-4 overflow-x-auto"
        >
          {items.map((item) => (
            <div key={item.id} className="w-[46vw] flex-none snap-start sm:w-[31vw] md:w-[23vw] lg:w-[19vw] xl:w-[16vw]">
              <ContentCard item={item} />
            </div>
          ))}
        </div>
        <button
          aria-label="Scroll left"
          onClick={() => scroller.current?.scrollBy({ left: -400, behavior: "smooth" })}
          className="absolute left-1 top-1/2 hidden -translate-y-1/2 rounded-full border border-hairline bg-surface-1 p-2 shadow-lg group-hover/row:block"
        >
          <Icon name="chevron-left" size={16} />
        </button>
        <button
          aria-label="Scroll right"
          onClick={() => scroller.current?.scrollBy({ left: 400, behavior: "smooth" })}
          className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-full border border-hairline bg-surface-1 p-2 shadow-lg group-hover/row:block"
        >
          <Icon name="chevron-right" size={16} />
        </button>
      </div>
    </section>
  );
}
