"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Badge, EmptyState } from "@/components/ui/primitives";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { useStore } from "@/stores/store";
import { videos } from "@/data/catalog";
import { toWebVTT, downloadWebVTT, newEntry } from "@/lib/vtt";
import type { CaptionEntry, CaptionTrack } from "@/types";

const LANGUAGES = [
  { value: "English", sampleLang: "en" },
  { value: "French", sampleLang: "fr" },
] as const;

type Lang = (typeof LANGUAGES)[number]["value"];

const SAMPLE_LINES: Record<Lang, string[]> = {
  English: [
    "Transcribed dialogue line one.",
    "Transcribed dialogue line two.",
    "Transcribed dialogue line three.",
  ],
  French: [
    "Première ligne transcrite.",
    "Deuxième ligne transcrite.",
    "Troisième ligne transcrite.",
  ],
};

const TIMINGS: [string, string][] = [
  ["00:00:01.000", "00:00:04.000"],
  ["00:00:04.500", "00:00:08.000"],
  ["00:00:08.500", "00:00:12.000"],
];

export default function CaptionEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, mounted, captionOverrides, saveCaptionTrack } = useStore();

  const video = videos.find((v) => v.id === id);
  const [language, setLanguage] = useState<Lang>("English");
  const [entries, setEntries] = useState<CaptionEntry[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Seed local editing state: local overrides first, then sample tracks.
  useEffect(() => {
    const local = captionOverrides[id]?.[language];
    if (local?.length) {
      setEntries(local);
    } else {
      import("@/data/captions").then(({ captionTracks }) => {
        const seedTrack = captionTracks.find((t) => t.videoId === id && t.language === language);
        setEntries(seedTrack ? seedTrack.entries.map((e) => ({ ...e })) : []);
      });
    }
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, language]);

  useEffect(() => {
    if (mounted && !user) router.replace("/login");
  }, [mounted, user, router]);

  const track: CaptionTrack = useMemo(
    () => ({ id: `cap-${id}-${language}`, videoId: id, language, status: generating ? "generated" : "manual", entries }),
    [id, language, entries, generating]
  );

  const captionsUrl = useMemo(() => {
    if (typeof window === "undefined" || !video?.videoUrl || !entries.length) return undefined;
    const blob = new Blob([toWebVTT(track)], { type: "text/vtt" });
    return URL.createObjectURL(blob);
  }, [video, track, entries.length]);

  useEffect(() => {
    return () => {
      if (captionsUrl) URL.revokeObjectURL(captionsUrl);
    };
  }, [captionsUrl]);

  if (!mounted || !user) {
    return <div className="page-pad pt-28"><p className="text-sm text-ink-dim">Loading…</p></div>;
  }

  if (!video) {
    return (
      <div className="page-pad pt-28">
        <EmptyState
          title="Video not found"
          action={<Link href="/studio/captions" className="text-sm text-brand hover:underline">Back to captions</Link>}
        />
      </div>
    );
  }

  if (user.role === "viewer") {
    return (
      <div className="page-pad pt-28">
        <EmptyState
          title="Creator tools need a creator account"
          body="Sign in with creator@lumen.test to edit captions."
          action={<Link href="/" className="text-sm text-brand hover:underline">Back to home</Link>}
        />
      </div>
    );
  }

  function updateEntry(index: number, patch: Partial<CaptionEntry>) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
    setDirty(true);
  }

  function generate() {
    setGenerating(true);
    setSaved(false);
    // Simulated speech-to-text: no audio is analysed. Provider injection point:
    // replace this timeout with a call to a real transcription service that
    // returns CaptionEntry[]; everything downstream (editing, VTT export,
    // player rendering) already consumes that shape.
    window.setTimeout(() => {
      setEntries((prev) => {
        if (prev.length > 0) return prev;
        return TIMINGS.map(([start, end], i) => ({
          id: `c${i + 1}`,
          start,
          end,
          text: SAMPLE_LINES[language][i] ?? `${SAMPLE_LINES[language][0]} (${i + 1})`,
        }));
      });
      setGenerating(false);
      setDirty(true);
    }, 1600);
  }

  function save() {
    saveCaptionTrack(id, language, entries);
    setSaved(true);
    setDirty(false);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="page-pad pb-20 pt-28">
      <nav className="text-xs text-ink-faint">
        <Link href="/studio" className="hover:text-ink">Studio</Link> ·{" "}
        <Link href="/studio/captions" className="hover:text-ink">Captions</Link> ·{" "}
        <span className="text-ink-dim">{video.title}</span>
      </nav>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Transcript editor</h1>
        <div className="flex items-center gap-2">
          <Badge>Simulated generation</Badge>
          <Badge>WebVTT export</Badge>
        </div>
      </div>
      <p className="mt-1 text-sm text-ink-dim">
        Edit the timestamped entries below. {video.videoUrl ? "The preview uses your entries live." : "This video has no sample media, so preview shows the export only."}
      </p>

      <div className="mt-4">
        {!captionsUrl || !video.videoUrl ? (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-surface-2 text-sm text-ink-dim">
            <p>No sample media linked — subtitle preview is unavailable for this title.</p>
          </div>
        ) : (
          <VideoPlayer src={video.videoUrl} title={video.title} captionsUrl={captionsUrl} captionsLabel={language} />
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <Field label="Language">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Lang)}
            className="rounded-md border border-hairline bg-surface-1 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value}>{l.value}</option>
            ))}
          </select>
        </Field>
        <Button variant="secondary" onClick={generate} disabled={generating}>
          {generating ? "Generating…" : "Generate captions (simulated)"}
        </Button>
        <Button onClick={save} disabled={!dirty}>Save track</Button>
        <Button
          variant="ghost"
          onClick={() => downloadWebVTT(track, `${id}-${language.toLowerCase()}.vtt`)}
          disabled={!entries.length}
        >
          Export WebVTT
        </Button>
        {saved && <span className="text-sm text-brand">Saved to this browser</span>}
      </div>

      <div className="mt-4">
        {!entries.length ? (
          <EmptyState
            title="No entries for this language yet"
            body="Use “Generate captions (simulated)”, or add entries manually below."
            action={
              <Button variant="secondary" onClick={() => { setEntries((p) => [...p, newEntry()]); setDirty(true); }}>
                Add first entry
              </Button>
            }
          />
        ) : (
          <ol className="space-y-2">
            {entries.map((e, i) => (
              <li key={e.id} className="grid grid-cols-[110px_110px_1fr_auto] items-center gap-2 rounded-lg border border-hairline bg-surface-1/40 p-2">
                <Input
                  aria-label={`Entry ${i + 1} start`}
                  value={e.start}
                  onChange={(ev) => updateEntry(i, { start: ev.target.value })}
                  className="font-mono text-xs"
                />
                <Input
                  aria-label={`Entry ${i + 1} end`}
                  value={e.end}
                  onChange={(ev) => updateEntry(i, { end: ev.target.value })}
                  className="font-mono text-xs"
                />
                <Input
                  aria-label={`Entry ${i + 1} text`}
                  value={e.text}
                  onChange={(ev) => updateEntry(i, { text: ev.target.value })}
                  className="text-sm"
                />
                <button
                  aria-label={`Delete entry ${i + 1}`}
                  onClick={() => { setEntries((prev) => prev.filter((x) => x.id !== e.id)); setDirty(true); }}
                  className="rounded px-2 py-1.5 text-xs text-ink-faint transition hover:bg-danger/10 hover:text-danger"
                >
                  Delete
                </button>
              </li>
            ))}
          </ol>
        )}
        {entries.length > 0 && (
          <Button variant="ghost" className="mt-3" onClick={() => { setEntries((p) => [...p, newEntry()]); setDirty(true); }}>
            Add entry
          </Button>
        )}
      </div>

      <p className="mt-6 text-xs text-ink-faint">
        Prototype notice: the AI transcription service is not connected — the generate button
        simulates the workflow. Saved tracks live in this browser's localStorage and are served to
        the on-site player; production would sync them to the backend per video and language.
      </p>
    </div>
  );
}
