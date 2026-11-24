"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { useStore } from "@/stores/store";
import { films, series, videos, channels, GENRES } from "@/data/catalog";
import { captionTracks } from "@/data/captions";
import { formatViews, formatDate } from "@/lib/format";

const TABS = ["Users", "Channels", "Videos", "Films & Series", "Categories", "Captions"] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const router = useRouter();
  const { user, mounted, users, videoMeta, captionOverrides, saveVideoMeta } = useStore();
  const [tab, setTab] = useState<Tab>("Users");

  useEffect(() => {
    if (mounted && !user) router.replace("/login");
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return <div className="page-pad pt-28"><p className="text-sm text-ink-dim">Loading…</p></div>;
  }

  if (user.role !== "admin") {
    return (
      <div className="page-pad pt-28">
        <EmptyState
          title="Administrator access required"
          body="This console is restricted to the admin role. Sign in with admin@lumen.test to explore it."
          action={
            <Link href="/" className="text-sm text-brand hover:underline">
              Back to home
            </Link>
          }
        />
      </div>
    );
  }

  const visibilityOf = (id: string, fallback: "public" | "unlisted" | "private") =>
    videoMeta[id]?.visibility ?? fallback;

  function toggleVisibility(id: string, current: "public" | "unlisted" | "private") {
    saveVideoMeta(id, { visibility: current === "public" ? "private" : "public" });
  }

  return (
    <div className="page-pad pb-20 pt-28">
      <h1 className="font-display text-2xl text-ink">Administration</h1>
      <p className="mt-1 text-sm text-ink-dim">
        Sample management console. In production this writes to the backend with role-based
        permissions; here, visibility changes persist in this browser only.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`rounded-md px-3.5 py-1.5 text-sm transition ${
              tab === t ? "bg-brand font-semibold text-[#171204]" : "bg-surface-1 text-ink-dim hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-hairline">
        {tab === "Users" && (
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-surface-1 text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-2.5 font-medium">Username</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {users.map((u) => (
                <tr key={u.id} className="bg-surface-1/30">
                  <td className="px-4 py-2.5 font-medium text-ink">{u.username}</td>
                  <td className="px-4 py-2.5 text-ink-dim">{u.email}</td>
                  <td className="px-4 py-2.5"><Badge className="capitalize">{u.role}</Badge></td>
                  <td className="px-4 py-2.5 text-ink-dim">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "Channels" && (
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-surface-1 text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-2.5 font-medium">Channel</th>
                <th className="px-4 py-2.5 font-medium">Subscribers</th>
                <th className="px-4 py-2.5 font-medium">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {channels.map((c) => (
                <tr key={c.id} className="bg-surface-1/30">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-ink">{c.name}</p>
                    <p className="text-xs text-ink-faint">{c.id}</p>
                  </td>
                  <td className="px-4 py-2.5 text-ink-dim">{formatViews(c.subscribers)}</td>
                  <td className="px-4 py-2.5">{c.verified ? <Badge>Verified</Badge> : <span className="text-xs text-ink-faint">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "Videos" && (
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-surface-1 text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-2.5 font-medium">Video</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Visibility</th>
                <th className="px-4 py-2.5 font-medium text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {videos.map((v) => {
                const vis = visibilityOf(v.id, v.visibility);
                return (
                  <tr key={v.id} className="bg-surface-1/30">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink">{videoMeta[v.id]?.title ?? v.title}</p>
                      <p className="text-xs text-ink-faint">{channels.find((c) => c.id === v.channelId)?.name}</p>
                    </td>
                    <td className="px-4 py-2.5 capitalize text-ink-dim">{videoMeta[v.id]?.status ?? v.status}</td>
                    <td className="px-4 py-2.5 capitalize text-ink-dim">{vis}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => toggleVisibility(v.id, vis)}
                        className="rounded bg-surface-2 px-2.5 py-1 text-xs text-ink transition hover:bg-surface-3"
                      >
                        Make {vis === "public" ? "private" : "public"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {tab === "Films & Series" && (
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-surface-1 text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">Kind</th>
                <th className="px-4 py-2.5 font-medium">Year</th>
                <th className="px-4 py-2.5 font-medium">Genres</th>
                <th className="px-4 py-2.5 font-medium">Sample media</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {[...films.map((f) => ({ e: f, kind: "Film" })), ...series.map((s) => ({ e: s, kind: "Series" }))].map(({ e, kind }) => (
                <tr key={e.id} className="bg-surface-1/30">
                  <td className="px-4 py-2.5 font-medium text-ink">{e.title}</td>
                  <td className="px-4 py-2.5 text-ink-dim">{kind}</td>
                  <td className="px-4 py-2.5 text-ink-dim">{e.year}</td>
                  <td className="px-4 py-2.5 text-ink-dim">{e.genres.join(", ")}</td>
                  <td className="px-4 py-2.5">
                    {kind === "Film" && (e as (typeof films)[number]).videoUrl ? <Badge>Playable sample</Badge> : <span className="text-xs text-ink-faint">None linked</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "Categories" && (
          <div className="bg-surface-1/30 p-4">
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GENRES.map((g) => (
                <li key={g} className="flex items-center justify-between rounded-md border border-hairline px-3 py-2 text-sm">
                  <span className="text-ink">{g}</span>
                  <span className="text-xs text-ink-faint">
                    {films.filter((f) => f.genres.includes(g)).length + series.filter((s) => s.genres.includes(g)).length} titles
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "Captions" && (
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-surface-1 text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-2.5 font-medium">Video</th>
                <th className="px-4 py-2.5 font-medium">Languages</th>
                <th className="px-4 py-2.5 font-medium">Caption status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {videos.map((v) => {
                const langs = new Set([
                  ...captionTracks.filter((t) => t.videoId === v.id).map((t) => t.language),
                  ...Object.keys(captionOverrides[v.id] ?? {}),
                ]);
                return (
                  <tr key={v.id} className="bg-surface-1/30">
                    <td className="px-4 py-2.5 font-medium text-ink">{videoMeta[v.id]?.title ?? v.title}</td>
                    <td className="px-4 py-2.5 text-ink-dim">{langs.size ? [...langs].join(", ") : "—"}</td>
                    <td className="px-4 py-2.5">{langs.size ? <Badge>Track present</Badge> : <span className="text-xs text-ink-faint">None</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
