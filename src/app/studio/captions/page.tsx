"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { useStore } from "@/stores/store";
import { videos } from "@/data/catalog";
import { captionTracks } from "@/data/captions";

const DEMO_CHANNEL = "ch-nova";

export default function CaptionsPage() {
  const router = useRouter();
  const { user, mounted, captionOverrides, videoMeta } = useStore();

  useEffect(() => {
    if (mounted && !user) router.replace("/login");
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return <div className="page-pad pt-28"><p className="text-sm text-ink-dim">Loading…</p></div>;
  }

  if (user.role === "viewer") {
    return (
      <div className="page-pad pt-28">
        <EmptyState
          title="Creator tools need a creator account"
          body="Sign in with a creator account to manage captions."
          action={<Link href="/" className="text-sm text-brand hover:underline">Back to home</Link>}
        />
      </div>
    );
  }

  const mine = user.role === "admin" ? videos : videos.filter((v) => v.channelId === DEMO_CHANNEL);

  return (
    <div className="page-pad pb-20 pt-28">
      <nav className="text-xs text-ink-faint">
        <Link href="/studio" className="hover:text-ink">Studio</Link> · <span className="text-ink-dim">Captions</span>
      </nav>
      <h1 className="mt-2 font-display text-2xl text-ink">Caption management</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-dim">
        Subtitles are edited as timestamped transcript entries and exported as WebVTT. English and
        French are supported in this prototype.
      </p>

      <div className="mt-4 rounded-lg border border-brand/40 bg-brand/10 p-3 text-sm text-ink">
        <p className="font-medium">Automatic AI transcription is not connected yet.</p>
        <p className="mt-1 text-ink-dim">
          The button in the editor simulates the future speech-to-text step. Editing, storage and
          export are real, and the code is structured so a provider can be plugged in later.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-hairline">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-surface-1 text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-2.5 font-medium">Video</th>
              <th className="px-4 py-2.5 font-medium">Tracks</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {mine.map((v) => {
              const seeded = captionTracks.filter((t) => t.videoId === v.id);
              const overridden = Object.keys(captionOverrides[v.id] ?? {}).length;
              const all = new Set([...seeded.map((t) => t.language), ...Object.keys(captionOverrides[v.id] ?? {})]);
              return (
                <tr key={v.id} className="bg-surface-1/30">
                  <td className="px-4 py-2.5 font-medium text-ink">{videoMeta[v.id]?.title ?? v.title}</td>
                  <td className="px-4 py-2.5">
                    {all.size === 0 ? (
                      <Badge>None</Badge>
                    ) : (
                      <span className="text-ink-dim">
                        {[...all].join(", ")}
                        {overridden > 0 ? " · edited" : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/studio/captions/${v.id}`} className="text-xs text-brand hover:underline">
                      Open editor
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
