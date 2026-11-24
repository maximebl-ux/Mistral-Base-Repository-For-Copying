import type { CaptionEntry, CaptionTrack } from "@/types";

export function toWebVTT(track: CaptionTrack, title?: string): string {
  const lines: string[] = ["WEBVTT", ""];
  if (title) lines.push(`NOTE ${title}`, "");
  track.entries.forEach((e, i) => {
    lines.push(String(i + 1));
    lines.push(`${e.start} --> ${e.end}`);
    lines.push(e.text);
    lines.push("");
  });
  return lines.join("\n");
}

export function downloadWebVTT(track: CaptionTrack, filename?: string) {
  const blob = new Blob([toWebVTT(track)], { type: "text/vtt" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `${track.videoId}-${track.language.toLowerCase()}.vtt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function newEntry(): CaptionEntry {
  return {
    id: `c${Math.random().toString(36).slice(2, 9)}`,
    start: "00:00:00.000",
    end: "00:00:03.000",
    text: "",
  };
}
