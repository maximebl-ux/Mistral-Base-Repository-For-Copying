"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select, Textarea, Badge, EmptyState } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { useStore } from "@/stores/store";

const DRAFT_ID = "vid-draft-storyboard";
const CATEGORIES = ["Documentary", "Critique & Analysis", "Tutorial", "Behind the scenes"];

export default function UploadMockPage() {
  const router = useRouter();
  const { user, mounted, saveVideoMeta, videoMeta } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<{ name: string; sizeMb: string } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [saved, setSaved] = useState(false);

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
          body="Sign in with creator@lumen.test to try the upload workflow."
          action={<Link href="/" className="text-sm text-brand hover:underline">Back to home</Link>}
        />
      </div>
    );
  }

  const draft = videoMeta[DRAFT_ID];

  function pickFile() {
    const f = fileInput.current?.files?.[0];
    if (!f) return;
    setSelected({ name: f.name, sizeMb: (f.size / (1024 * 1024)).toFixed(1) });
  }

  function saveDraft() {
    saveVideoMeta(DRAFT_ID, {
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      visibility,
      status: "draft",
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="page-pad mx-auto max-w-2xl pb-20 pt-28">
      <nav className="text-xs text-ink-faint">
        <Link href="/studio" className="hover:text-ink">Studio</Link> · <span className="text-ink-dim">Upload</span>
      </nav>
      <h1 className="mt-2 font-display text-2xl text-ink">Upload a video</h1>

      <div className="mt-3 rounded-lg border border-brand/40 bg-brand/10 p-3 text-sm text-ink">
        <p className="font-medium">Upload is a mockup in this prototype.</p>
        <p className="mt-1 text-ink-dim">
          No file leaves your browser and nothing is processed. The workflow below demonstrates the
          intended production flow: select a file, add metadata, save as draft.
        </p>
      </div>

      <div
        className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-dashed border-hairline px-6 py-10 text-center"
        onDragOver={(e) => e.preventDefault()}
      >
        <Icon name="upload" size={28} className="text-ink-dim" />
        <p className="text-sm text-ink">Drag a video here or choose a file</p>
        <p className="text-xs text-ink-faint">MP4, WebM up to 2 GB (not actually uploaded in this prototype)</p>
        <input ref={fileInput} type="file" accept="video/*" onChange={pickFile} className="hidden" id="upload-file" />
        <Button variant="secondary" onClick={() => fileInput.current?.click()}>
          Select file
        </Button>
        {selected && (
          <p className="text-xs text-ink-dim">
            Selected: <span className="text-ink">{selected.name}</span> ({selected.sizeMb} MB) — attached
            to this form only; no transfer happens.
          </p>
        )}
      </div>

      <div className="mt-6 space-y-5 rounded-lg border border-hairline bg-surface-1/60 p-5">
        <Field label="Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={90}
            placeholder={draft?.title ?? "Storyboard Animatic (Draft)"}
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={600}
            placeholder="What is this video about?"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Visibility when published">
            <Select value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)}>
              {["public", "unlisted", "private"].map((v) => (
                <option key={v} value={v} className="capitalize">{v}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={saveDraft}>Save as draft</Button>
          {saved && <span className="text-sm text-brand">Saved to the sample draft</span>}
        </div>
        <p className="text-xs text-ink-faint">
          Prototype note: saving applies your metadata to the sample draft “Storyboard Animatic”
          (id {DRAFT_ID}) via the same store the rest of the app reads, so you can see the full
          flow. Real uploads and processing require the future storage/streaming backend.
        </p>
      </div>

      <Link href={`/studio/videos/${DRAFT_ID}`} className="mt-6 inline-block text-sm text-brand hover:underline">
        Open the draft in the video editor
      </Link>
    </div>
  );
}
