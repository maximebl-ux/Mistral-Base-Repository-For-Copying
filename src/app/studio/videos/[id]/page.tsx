"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select, Textarea, Badge, EmptyState } from "@/components/ui/primitives";
import { Artwork } from "@/components/media/Artwork";
import { useStore } from "@/stores/store";
import { videos, channels } from "@/data/catalog";
import { GENRES } from "@/data/catalog";

const STATUSES = ["published", "draft", "processing"] as const;
const VISIBILITIES = ["public", "unlisted", "private"] as const;

export default function VideoEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, mounted, videoMeta, saveVideoMeta } = useStore();

  const video = videos.find((v) => v.id === id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState("");
  const [visibility, setVisibility] = useState<(typeof VISIBILITIES)[number]>("public");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("published");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (mounted && !user) router.replace("/login");
  }, [mounted, user, router]);

  useEffect(() => {
    if (!video) return;
    const edit = videoMeta[video.id];
    setTitle(edit?.title ?? video.title);
    setDescription(edit?.description ?? video.description);
    setCategories(video.categories.join(", "));
    setVisibility(edit?.visibility ?? video.visibility);
    setStatus(edit?.status ?? video.status);
  }, [video, videoMeta]);

  if (!mounted || !user) {
    return <div className="page-pad pt-28"><p className="text-sm text-ink-dim">Loading…</p></div>;
  }

  if (!video) {
    return (
      <div className="page-pad pt-28">
        <EmptyState
          title="Video not found"
          action={<Link href="/studio" className="text-sm text-brand hover:underline">Back to studio</Link>}
        />
      </div>
    );
  }

  if (user.role === "viewer") {
    return (
      <div className="page-pad pt-28">
        <EmptyState
          title="Creator tools need a creator account"
          body="Sign in with a creator account to edit videos."
          action={<Link href="/" className="text-sm text-brand hover:underline">Back to home</Link>}
        />
      </div>
    );
  }

  const channel = channels.find((c) => c.id === video.channelId);

  function save() {
    saveVideoMeta(video!.id, {
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      visibility,
      status,
      categories: categories.split(",").map((c) => c.trim()).filter(Boolean),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="page-pad mx-auto max-w-3xl pb-20 pt-28">
      <nav className="text-xs text-ink-faint">
        <Link href="/studio" className="hover:text-ink">Studio</Link> · <span className="text-ink-dim">{video.id}</span>
      </nav>
      <h1 className="mt-2 font-display text-2xl text-ink">Edit video</h1>
      <p className="mt-1 text-sm text-ink-dim">Channel: {channel?.name}</p>

      <div className="mt-6 rounded-lg border border-hairline bg-surface-1/60 p-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-dim">Thumbnail</span>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <Artwork seed={video.id} label={title || video.title} variant="thumb" className="w-48 rounded-md" />
          <div className="max-w-xs text-sm text-ink-dim">
            <p>
              Thumbnails are generated automatically in this prototype — the artwork is derived
              deterministically from the video id and title.
            </p>
            <p className="mt-2 text-xs text-ink-faint">
              Custom thumbnail uploads arrive with real storage integration.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-5 rounded-lg border border-hairline bg-surface-1/60 p-5">
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={90} />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={600} />
        </Field>
        <Field label="Categories & tags (comma separated)">
          <Input
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            placeholder={`e.g. ${GENRES.slice(0, 2).join(", ")}`}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Visibility">
            <Select value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)}>
              {VISIBILITIES.map((v) => (
                <option key={v} value={v} className="capitalize">{v}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={save}>Save</Button>
          {saved && <span className="text-sm text-brand">Saved to this browser</span>}
          <Badge>Prototype — changes stay local</Badge>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href={`/watch/${video.id}`} className="text-sm text-brand hover:underline">
          View watch page
        </Link>
        <Link href={`/studio/captions/${video.id}`} className="text-sm text-brand hover:underline">
          Manage captions
        </Link>
      </div>
    </div>
  );
}
