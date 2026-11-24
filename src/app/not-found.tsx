import Link from "next/link";
import { Artwork } from "@/components/media/Artwork";

export default function NotFound() {
  return (
    <div className="page-pad flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-hairline">
        <Artwork seed="lost-signal" label="Lost signal" className="aspect-video w-full" />
      </div>
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Title not found</h1>
        <p className="mt-2 max-w-md text-sm text-ink-dim">
          The page you are looking for was moved, removed or never existed in this catalogue.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-[#171204] transition hover:bg-[#f0c375]"
      >
        Back to home
      </Link>
    </div>
  );
}
