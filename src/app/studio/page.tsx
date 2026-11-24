"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState, Button } from "@/components/ui/primitives";
import { useStore } from "@/stores/store";
import { videos, channels } from "@/data/catalog";
import { captionTracks } from "@/data/captions";
import { formatViews } from "@/lib/format";

const DEMO_CHANNEL = "ch-nova";

export default function StudioPage() {
  const router = useRouter();
  const { user, mounted, videoMeta, captionOverrides } = useStore();

  useEffect(() => {
    if (mounted && !user) router.replace("/login");
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return (
      <div className="page-pad pt-28">
        <p className="text-sm text-ink-dim">Loading studio…</p>
      </div>
    );
  }

  if (user.role === "viewer") {
    return (
      <div className="page-pad pt-28">
        <EmptyState
          title="Creator studio is not enabled for viewer accounts"
          body="Creator tools belong to creator and admin accounts in this prototype. Sign in with creator@lumen.test to explore them."
          action={
            <Link href="/" className="text-sm text-brand hover:underline">
              Back to home
            </Link>
          }
        />
      </div>
    );
  }

  const mine = user.role === "admin" ? videos : videos.filter((v) => v.channelId === DEMO_CHANNEL);
  const statusOf = (id: string) => videoMeta[id]?.status;
  const visibilityOf = (id: string) => videoMeta[id]?.visibility;
  const titleOf = (id: string, fallback: string) => videoMeta[id]?.title ?? fallback;

  const published = mine.filter((v) => (statusOf(v.id) ?? v.status) === "published");
  const drafts = mine.filter((v) => (statusOf(v.id) ?? v.status) === "draft");
  const processing = mine.filter((v) => (statusOf(v.id) ?? v.status) === "processing");
  const totalViews = mine.reduce((sum, v) => sum + v.views, 0);
  const channel = channels.find((c) => c.id === DEMO_CHANNEL);

  function captionStatus(id: string) {
    const seeded = captionTracks.filter((t) => t.videoId === id).map((t) => t.language);
    const overridden = Object.keys(captionOverrides[id] ?? {});
    const total = new Set([...seeded, ...overridden]).size;
    return total > 0 ? `${total} language${total > 1 ? "s" : ""}` : "None";
  }

  const stats = [
    { label: "Published", value: String(published.length) },
    { label: "Drafts", value: String(drafts.length) },
    { label: "Processing", value: String(processing.length) },
    { label: "Total views", value: formatViews(totalViews) },
    { label: "Subscribers", value: formatViews(channel?.subscribers ?? 0) },
  ];

  return (
    <div className="page-pad pb-20 pt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink">Creator Studio</h1>
          <p className="mt-1 text-sm text-ink-dim">
            {channel?.name} · demo channel data; saved changes stay in this browser
          </p>
        </div>
        <Link href="/studio/upload">
          <Button>Upload video (mock)</Button>
        </Link>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-hairline bg-surface-1/60 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{s.label}</dt>
            <dd className="mt-1 text-xl font-semibold text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Your videos</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-hairline">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-surface-1 text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-2.5 font-medium">Video</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Visibility</th>
                <th className="px-4 py-2.5 font-medium">Views</th>
                <th className="px-4 py-2.5 font-medium">Captions</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {mine.map((v) => {
                const st = statusOf(v.id) ?? v.status;
                return (
                  <tr key={v.id} className="bg-surface-1/30">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink">{titleOf(v.id, v.title)}</p>
                      <p className="text-xs text-ink-faint">{v.id}</p>
                    </td>
                    <td className="px-4 py-2.5 capitalize text-ink-dim">{st}</td>
                    <td className="px-4 py-2.5 capitalize text-ink-dim">{visibilityOf(v.id) ?? v.visibility}</td>
                    <td className="px-4 py-2.5 text-ink-dim">{formatViews(v.views)}</td>
                    <td className="px-4 py-2.5 text-ink-dim">{captionStatus(v.id)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-2 text-xs">
                        <Link href={`/studio/videos/${v.id}`} className="text-brand hover:underline">
                          Edit
                        </Link>
                        <Link href={`/studio/captions/${v.id}`} className="text-ink-dim hover:text-ink">
                          Captions
                        </Link>
                        {st === "published" && (
                          <Link href={`/watch/${v.id}`} className="text-ink-dim hover:text-ink">
                            View
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {user.role === "admin" && (
          <p className="mt-2 text-xs text-ink-faint">Admin view: videos from every channel are listed.</p>
        )}
      </section>

      <p className="mt-6 text-xs text-ink-faint">
        Prototype notice: status, visibility and metadata changes are saved to localStorage and
        layered over the sample catalogue. No backend is involved.
      </p>
    </div>
  );
}
