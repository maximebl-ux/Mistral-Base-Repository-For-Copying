import { notFound } from "next/navigation";
import { films } from "@/data/catalog";
import { toCard } from "@/lib/cards";
import { Artwork } from "@/components/media/Artwork";
import { ContentCard } from "@/components/cards/ContentCard";

export default async function FilmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const film = films.find((f) => f.id === id);
  if (!film) notFound();
  const similar = films.filter((f) => f.id !== film.id).slice(0, 6);

  return (
    <div className="page-pad pt-28 pb-20">
      <div className="flex flex-col gap-6 md:flex-row">
        <Artwork seed={film.id} label={film.title} variant="poster" className="aspect-[2/3] w-full max-w-[260px] rounded-lg" />
        <div className="flex-1 space-y-3">
          <h1 className="text-3xl font-bold text-ink">{film.title}</h1>
          <p className="text-ink-dim">{film.tagline}</p>
          <div className="flex flex-wrap gap-2 text-xs text-ink-dim">
            <span className="rounded border border-hairline px-2 py-1">{film.rating.toFixed(1)}/10</span>
            <span className="rounded border border-hairline px-2 py-1">{film.maturity}</span>
            {film.genres.map((g) => (
              <span key={g} className="rounded border border-hairline px-2 py-1">{g}</span>
            ))}
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-ink-dim">{film.description}</p>
          <p className="text-sm text-ink-dim"><strong className="text-ink">Director:</strong> {film.director}</p>
          <p className="text-sm text-ink-dim"><strong className="text-ink">Cast:</strong> {film.cast.join(", ")}</p>
          <a
            href={`/watch/film/${film.id}`}
            className="inline-flex items-center gap-2 rounded bg-brand px-5 py-2.5 text-sm font-semibold text-[#171204]"
          >
            Play film
          </a>
        </div>
      </div>
      <h2 className="mt-12 text-lg font-semibold text-ink">More like this</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {similar.map((f) => (
          <ContentCard key={f.id} item={toCard(f)} />
        ))}
      </div>
    </div>
  );
}
