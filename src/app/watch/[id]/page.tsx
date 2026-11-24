"use client";

import { use, useEffect, useMemo } from "react";
import Link from "next/link";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { CommentsSection } from "@/components/player/CommentsSection";
import { Rail } from "@/components/sections/Rail";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/primitives";
import { useStore } from "@/stores/store";
import { films, series, videos, episodes, channels } from "@/data/catalog";
import { captionTracks } from "@/data/captions";
import { toWebVTT } from "@/lib/vtt";
import { toCard } from "@/lib/cards";
import { formatViews, minutesLabel } from "@/lib/format";

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    user,
    toggleLiked,
    toggleDisliked,
    isLiked,
    isDisliked,
    isSubscribed,
    toggleSubscription,
    saveProgress,
    captionOverrides,
    library,
  } = useStore();

  const film = films.find((f) => f.id === id);
  const show = series.find((s) => s.id === id);
  const video = videos.find((v) => v.id === id);
  const episode = episodes.find((e) => e.id === id);

  const parentShow = episode ? series.find((s) => s.id === episode.seriesId) : undefined;
  const seasonEps = parentShow
    ? parentShow.seasons.find((s) => s.season === episode!.season)?.episodes ?? []
    : [];
  const epIndex = episode ? seasonEps.findIndex((e) => e.id === episode.id) : -1;
  const nextEp = epIndex >= 0 && epIndex < seasonEps.length - 1 ? seasonEps[epIndex + 1] : undefined;

  if (!film && !show && !video && !episode) {
    return (
      <div className="page-pad pt-28">
        <EmptyState
          title="Title not found"
          body="The content you are looking for does not exist in this catalogue."
          action={
            <Link href="/" className="text-sm text-brand hover:underline">
              Back to home
            </Link>
          }
        />
      </div>
    );
  }

  const videoUrl =
    film?.videoUrl ?? episode?.videoUrl ?? video?.videoUrl ?? undefined;

  const title = film?.title ?? show?.title ?? video?.title ?? episode?.title ?? "";
  const description =
    film?.description ?? show?.description ?? video?.description ?? episode?.description ?? "";
  const metaLine = film
    ? `${film.year} · ${minutesLabel(film.durationMin)} · ${film.genres.join(", ")}`
    : show
      ? `${show.year} · ${show.genres.join(", ")}`
      : episode
        ? `${parentShow?.title} · S${episode.season}E${episode.number} · ${minutesLabel(episode.durationMin)}`
        : video
          ? `${video.year} · ${video.genres.join(", ")}`
          : "";

  const channelId = video?.channelId;
  const channel = channels.find((c) => c.id === channelId);

  const recommended = useMemo(() => {
    const base = film ?? video ?? parentShow ?? undefined;
    const pool = [...videos.filter((v) => v.status === "published"), ...films, ...series];
    const genres = base?.genres ?? [];
    const scored = pool
      .filter((x) => x.id !== id)
      .map((x) => ({ x, score: x.genres.filter((g) => genres.includes(g)).length }))
      .sort((a, b) => b.score - a.score || b.x.views - a.x.views);
    return scored.slice(0, 10).map(({ x }) => toCard(x));
  }, [film, video, episode, id]);

  const captionLanguage = useMemo(() => {
    const key = video?.id ?? episode?.id ?? film?.id;
    if (!key) return null;
    const local = captionTracks.filter((t) => t.videoId === key);
    const overrides = captionOverrides[key] ?? {};
    if (local.length) return overrides["English"] ? "English (edited)" : "English";
    if (overrides["French"]) return "French (edited)";
    return null;
  }, [video, episode, film, captionOverrides]);

  const captionsUrl = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const key = video?.id ?? episode?.id ?? film?.id;
    if (!key) return undefined;
    const track = captionTracks.find((t) => t.videoId === key && t.language === "English");
    const edited = captionOverrides[key]?.["English"];
    if (!edited?.length && !track) return undefined;
    const entries = edited?.length ? edited : track!.entries;
    const blob = new Blob(
      [toWebVTT({ id: `${key}-en`, videoId: key, language: "English", status: "manual", entries })],
      { type: "text/vtt" }
    );
    return URL.createObjectURL(blob);
  }, [video, episode, film, captionOverrides]);

  useEffect(() => {
    return () => {
      if (captionsUrl) URL.revokeObjectURL(captionsUrl);
    };
  }, [captionsUrl]);

  const like = () => {
    if (!isLiked(id)) {
      toggleLiked(id);
      if (isDisliked(id)) toggleDisliked(id);
    } else toggleLiked(id);
  };
  const dislike = () => {
    if (!isDisliked(id)) {
      toggleDisliked(id);
      if (isLiked(id)) toggleLiked(id);
    } else toggleDisliked(id);
  };

  return (
    <div className="page-pad pb-16 pt-24">
      {videoUrl ? (
        <VideoPlayer
          src={videoUrl}
          title={title}
          startTime={library.progress[id]?.positionSec ?? 0}
          captionsUrl={captionsUrl}
          captionsLabel={captionLanguage ?? undefined}
          onProgress={(pos, dur) =>
            saveProgress({ contentId: id, positionSec: pos, durationSec: dur, updatedAt: new Date().toISOString() })
          }
        />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-surface-2 text-sm text-ink-dim">
          <p>No sample media linked for this title yet.</p>
          <p className="text-xs text-ink-faint">The player is ready and waiting for one.</p>
        </div>
      )}

      <div className="mt-4">
        <h1 className="text-xl font-bold text-ink">{title}</h1>
        <p className="mt-1 text-xs text-ink-faint">
          {metaLine}
          {video && channel ? ` · ${formatViews(video.views)} views` : ""}
          {" · "}
          Prototype sample media — all titles are fictional.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {user && (
          <>
            <button
              onClick={like}
              aria-pressed={isLiked(id)}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition ${
                isLiked(id) ? "bg-brand text-[#171204]" : "bg-surface-2 text-ink-dim hover:text-ink"
              }`}
            >
              <Icon name="thumbs-up" size={16} />
              {isLiked(id) ? "Liked" : "Like"}
            </button>
            <button
              onClick={dislike}
              aria-pressed={isDisliked(id)}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition ${
                isDisliked(id) ? "bg-danger text-white" : "bg-surface-2 text-ink-dim hover:text-ink"
              }`}
            >
              <Icon name="thumbs-down" size={16} />
              {isDisliked(id) ? "Disliked" : "Dislike"}
            </button>
          </>
        )}
        {episode && nextEp && (
          <Link
            href={`/watch/${nextEp.id}`}
            className="inline-flex items-center gap-1.5 rounded bg-surface-2 px-3 py-1.5 text-sm text-ink transition hover:bg-surface-3"
          >
            Next episode
            <Icon name="chevron-right" size={15} />
            <span className="text-ink-dim">{nextEp.title}</span>
          </Link>
        )}
      </div>

      {channel && video && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-hairline bg-surface-1/60 p-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">{channel.name}</p>
            <p className="text-xs text-ink-dim">{channel.description}</p>
          </div>
          {user && (
            <button
              onClick={() => toggleSubscription(channel.id)}
              aria-pressed={isSubscribed(channel.id)}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition ${
                isSubscribed(channel.id) ? "bg-surface-3 text-ink" : "bg-brand text-[#171204]"
              }`}
            >
              <Icon name={isSubscribed(channel.id) ? "check" : "bell"} size={15} />
              {isSubscribed(channel.id) ? "Subscribed" : "Subscribe"}
            </button>
          )}
        </div>
      )}

      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-dim">{description}</p>

      {show && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-ink">Episodes</h2>
          <ol className="mt-3 space-y-3">
            {show.seasons.flatMap((s) => s.episodes).map((ep) => (
              <li key={ep.id}>
                <Link href={`/watch/${ep.id}`} className="flex gap-4 rounded-lg border border-hairline p-3 transition hover:bg-surface-1">
                  <span className="text-sm text-ink-faint">S{ep.season}E{ep.number}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{ep.title}</p>
                    <p className="clamp-2 text-xs text-ink-dim">{ep.description}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <Rail title="More like this" items={recommended} />

      <CommentsSection contentId={id} />
    </div>
  );
}
