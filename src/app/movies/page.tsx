import { films } from "@/data/catalog";
import { toCard } from "@/lib/cards";
import { ContentCard } from "@/components/cards/ContentCard";

export const metadata = { title: "Movies" };

export default function MoviesPage() {
  return (
    <div className="page-pad space-y-6 pt-28 pb-20">
      <h1 className="text-2xl font-bold text-ink">Movies</h1>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {films.map((f) => (
          <ContentCard key={f.id} item={toCard(f)} />
        ))}
      </div>
    </div>
  );
}
