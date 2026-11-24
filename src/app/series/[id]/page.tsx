import Link from "next/link";
import { notFound } from "next/navigation";
import { series } from "@/data/catalog";
import { Artwork } from "@/components/media/Artwork";

export default async function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const show = series.find((s) => s.id === id);
  if (!show) notFound();

  return (
    <div className="page-pad pt-28 pb-20">
      <div className="flex flex-col gap-6 md:flex-row">
        <Artwork seed={show.id} label={show.title} variant="poster" className="aspect-[2/3] w-full max-w-[260px] rounded-lg" />
        <div className="flex-1 space-y-2">
          <h1 className="text-3xl font-bold text-ink">{show.title}</h1>
          <p className="text-ink-dim">{show.tagline}</p>
          <p className="max-w-xl text-sm leading-relaxed text-ink-dim">{show.description}</p>
          <p className="text-xs text-ink-dim">{show.year} · {show.genres.join(", ")} · {show.maturity} · {show.rating.toFixed(1)}/10</p>
        </div>
      </div>
      {show.seasons.map((season) => (
        <section key={season.season} className="mt-10">
          <h2 className="text-lg font-semibold text-ink">{season.title} <span className="text-xs font-normal text-ink-faint">({season.year})</span></h2>
          <ol className="mt-3 space-y-3">
            {season.episodes.map((ep) => (
              <li key={ep.id}>
                <Link
                  href={`/watch/${ep.id}`}
                  className="flex gap-4 rounded-lg border border-hairline bg-surface-1/50 p-3 transition hover:bg-surface-2"
                >
                  <span className="w-6 text-center text-sm font-semibold text-ink-faint">{ep.number}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{ep.title}</p>
                    <p className="clamp-2 text-xs text-ink-dim">{ep.description}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
