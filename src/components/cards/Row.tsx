"use client";

import { useRef, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

interface RowProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  seeAllHref?: string;
}

export function Row({ title, subtitle, children, seeAllHref }: RowProps) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="page-pad group/row">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {subtitle && <p className="text-xs text-ink-dim">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {seeAllHref && (
            <a href={seeAllHref} className="text-xs text-ink-dim transition hover:text-brand">
              See all
            </a>
          )}
          <div className="hidden gap-1 opacity-0 transition group-hover/row:opacity-100 md:flex">
            <button
              onClick={() => scrollBy(-1)}
              aria-label={`Scroll ${title} left`}
              className="rounded-full border border-hairline bg-surface-1/80 p-1.5 text-ink-dim hover:text-ink"
            >
              <Icon name="chevron-left" size={16} />
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label={`Scroll ${title} right`}
              className="rounded-full border border-hairline bg-surface-1/80 p-1.5 text-ink-dim hover:text-ink"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={scroller}
        className="scrollbar-none -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2"
      >
        {children}
      </div>
    </section>
  );
}
