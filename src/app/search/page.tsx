"use client";

import { Suspense } from "react";
import { SearchClient } from "@/components/search/SearchClient";
import { allCards } from "@/lib/library-data";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="page-pad min-h-screen pt-28 text-ink-dim">Searching…</div>}>
      <SearchClient allItems={allCards()} />
    </Suspense>
  );
}
