import Link from "next/link";
import { Rail } from "@/components/sections/Rail";
import { Hero } from "@/components/sections/Hero";
import { ContinueWatching } from "@/components/sections/ContinueWatching";
import { films, series, videos, GENRES } from "@/data/catalog";
import { toCard } from "@/lib/cards";

export default function HomePage() {
  const heroFilm = films.find((f) => f.featured) ?? films[0];
  const published = videos.filter((v) => v.status === "published");

  const trending = [...films, ...series, ...published]
    .sort((a, b) => b.views - a.views)
    .slice(0, 12);
  const popularFilms = [...films].sort((a, b) => b.rating - a.rating).slice(0, 12);
  const popularSeries = [...series].sort((a, b) => b.rating - a.rating);
  const recommended = [...films].slice(2, 14);
  const recent = [...published].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <div className="pb-20">
      <Hero item={toCard(heroFilm)} description={heroFilm.description} />

      <div className="page-pad pt-8">
        <h2 className="mb-3 text-base font-semibold text-ink">Browse by genre</h2>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <Link
              key={g}
              href={`/browse?genre=${encodeURIComponent(g)}`}
              className="rounded-md border border-hairline bg-surface-1 px-3 py-1.5 text-sm text-ink-dim transition hover:bg-surface-2 hover:text-ink"
            >
              {g}
            </Link>
          ))}
        </div>
      </div>

      <ContinueWatching />
      <Rail title="Trending on Lumen" items={trending.map(toCard)} />
      <Rail title="Popular films" items={popularFilms.map(toCard)} />
      <Rail title="Popular series" items={popularSeries.map(toCard)} />
      <Rail title="Recommended for you" items={recommended.map(toCard)} />
      <Rail title="Recently uploaded" items={recent.map(toCard)} />
    </div>
  );
}
