"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatClock } from "@/lib/format";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
  onProgress?: (positionSec: number, durationSec: number) => void;
  startTime?: number;
  overlayNote?: string;
  captionsUrl?: string;
  captionsLabel?: string;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const QUALITIES = ["Auto (1080p)", "1080p", "720p", "480p"];

export function VideoPlayer({ src, poster, title, onProgress, startTime = 0, overlayNote, captionsUrl, captionsLabel }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSave = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState(QUALITIES[0]);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [settings, setSettings] = useState<"none" | "speed" | "quality">("none");
  const [fullscreen, setFullscreen] = useState(false);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2800);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => { setPlaying(true); showControls(); };
    const onPause = () => { setPlaying(false); showControls(); };
    const onTime = () => {
      setTime(v.currentTime);
      if (onProgress && v.duration > 0 && Date.now() - lastSave.current > 4000) {
        lastSave.current = Date.now();
        onProgress(v.currentTime, v.duration);
      }
    };
    const onMeta = () => {
      setDuration(v.duration || 0);
      if (startTime > 0 && startTime < v.duration - 5) v.currentTime = startTime;
    };
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    document.addEventListener("fullscreenchange", onFs);
    showControls();
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [showControls, onProgress, startTime]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted;
    v.playbackRate = speed;
  }, [volume, muted, speed]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !captionsUrl) return;
    for (let i = 0; i < v.textTracks.length; i++) {
      v.textTracks[i].mode = captionsOn ? "showing" : "hidden";
    }
  }, [captionsOn, captionsUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      if (e.code === "KeyM") setMuted((m) => !m);
      if (e.code === "KeyF") void toggleFullscreen();
      if (e.code === "ArrowRight" && videoRef.current) videoRef.current.currentTime += 5;
      if (e.code === "ArrowLeft" && videoRef.current) videoRef.current.currentTime -= 5;
      showControls();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, showControls, toggleFullscreen]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  };

  const pct = duration > 0 ? (time / duration) * 100 : 0;

  return (
    <div
      ref={wrapRef}
      className="group relative aspect-video w-full overflow-hidden rounded-xl bg-black"
      onMouseMove={showControls}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="h-full w-full"
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      >
        {captionsUrl ? (
          <track
            kind="subtitles"
            src={captionsUrl}
            srcLang="en"
            label={captionsLabel ?? "Captions"}
          />
        ) : null}
        Your browser does not support HTML video.
      </video>

      {!playing && (
        <button
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/25 transition hover:bg-black/10"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/90 text-[#171204] shadow-2xl transition hover:scale-105">
            <Icon name="play" size={28} />
          </span>
        </button>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 z-20 space-y-2 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-8 transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "opacity-0"}`}
      >
        <div
          role="slider"
          aria-label="Seek"
          aria-valuenow={Math.round(time)}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          tabIndex={0}
          onClick={seek}
          className="group/bar relative h-1.5 cursor-pointer rounded-full bg-white/25"
        >
          <div className="absolute h-full rounded-full bg-brand" style={{ width: pct + "%" }} />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-brand transition group-hover/bar:scale-110"
            style={{ left: `calc(${pct}% - 6px)` }}
          />
        </div>

        <div className="flex items-center gap-3 text-white">
          <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="hover:text-brand">
            <Icon name={playing ? "pause" : "play"} size={22} />
          </button>
          <button onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"} className="hover:text-brand">
            <Icon name={muted ? "volume-x" : "volume"} size={20} />
          </button>
          <input
            type="range" min={0} max={1} step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => { setVolume(Number(e.target.value)); setMuted(Number(e.target.value) === 0); }}
            aria-label="Volume"
            className="h-1 w-16 accent-[#e6b45c]"
          />
          <span className="text-xs tabular-nums text-white/90">
            {formatClock(time)} / {formatClock(duration)}
          </span>

          <div className="relative ml-auto flex items-center gap-2">
            <button
              onClick={() => setCaptionsOn((c) => !c)}
              aria-label="Toggle captions"
              aria-pressed={captionsOn}
              className={`rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wide transition ${captionsOn ? "bg-brand text-black" : "text-white/80 hover:text-white border border-white/30"}`}
            >
              CC
            </button>
            <button
              onClick={() => setSettings((s) => (s === "none" ? "quality" : s === "quality" ? "speed" : "none"))}
              aria-label="Settings"
              className="hover:text-brand"
            >
              <Icon name="settings" size={18} />
            </button>
            <button onClick={toggleFullscreen} aria-label="Toggle fullscreen" className="hover:text-brand">
              <Icon name={fullscreen ? "minimize" : "maximize"} size={18} />
            </button>

            {settings !== "none" && (
              <div role="dialog" aria-label="Playback settings" className="absolute bottom-10 right-0 w-40 rounded-lg border border-white/15 bg-black/95 p-1.5 text-sm shadow-2xl">
                {settings === "speed" ? (
                  <>
                    <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">Speed</p>
                    {SPEEDS.map((s) => (
                      <button key={s} onClick={() => { setSpeed(s); setSettings("none"); }} className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-white/90 transition hover:bg-white/10 ${speed === s ? "text-brand" : ""}`}>
                        <span>{s === 1 ? "Normal" : `${s}×`}</span>
                        {speed === s && <Icon name="check" size={13} />}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">Quality</p>
                    {QUALITIES.map((q) => (
                      <button key={q} onClick={() => { setQuality(q); setSettings("none"); }} className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-white/90 transition hover:bg-white/10 ${quality === q ? "text-brand" : ""}`}>
                        <span>{q}</span>
                        {quality === q && <Icon name="check" size={13} />}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {captionsOn && !captionsUrl && (
        <p className="pointer-events-none absolute bottom-20 left-1/2 z-10 -translate-x-1/2 rounded bg-black/80 px-3 py-1 text-center text-sm text-white">
          Captions (demo track)
        </p>
      )}
      {overlayNote && (
        <p className="absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-[11px] text-white/85">{overlayNote}</p>
      )}
    </div>
  );
}
