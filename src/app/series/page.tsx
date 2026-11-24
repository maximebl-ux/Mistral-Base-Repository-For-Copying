import Link from "next/link";
import { series } from "@/data/catalog";
import { Artwork } from "@/components/media/Artwork";

export const metadata = { title: "Series" };

export default function SeriesPage() {
  return (
    <div className="page-pad space-y-6 pt-28 pb-20">
      <h1 className="text-2xl font-bold text-ink">Series</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {series.map((s) => (
          <Link key={s.id} href={`/series/${s.id}`} className="group block">
            <div className="overflow-hidden rounded-lg">
              <Artwork seed={s.id} label={s.title} className="aspect-video w-full transition group-hover:scale-[1.02]" />
            </div>
            <p className="mt-2 font-medium text-ink group-hover:text-brand">{s.title}</p>
            <p className="text-xs text-ink-dim">{s.seasons.length} season{s.seasons.length > 1 ? "s" : ""} · {s.rating.toFixed(1)}/10 · {s.maturity}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
