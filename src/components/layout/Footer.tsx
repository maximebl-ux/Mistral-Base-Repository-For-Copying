"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-hairline py-10">
      <div className="page-pad flex flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-display text-lg font-semibold tracking-[0.25em] text-brand">LUMEN</p>
          <p className="max-w-md text-xs text-ink-faint">
            A hybrid streaming prototype. All titles, people and artwork are fictional sample data.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
          <Link href="/browse" className="hover:text-ink">Browse</Link>
          <Link href="/movies" className="hover:text-ink">Films</Link>
          <Link href="/series" className="hover:text-ink">Series</Link>
          <Link href="/search" className="hover:text-ink">Search</Link>
          <Link href="/library" className="hover:text-ink">My Library</Link>
        </nav>
        <p className="text-xs text-ink-faint">© 2025 Lumen Prototype</p>
      </div>
    </footer>
  );
}
