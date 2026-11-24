export type ContentKind = "film" | "series" | "video";
export type FilmRating = "G" | "PG" | "PG-13" | "R" | "TV-14" | "TV-MA";
export type Visibility = "public" | "unlisted" | "private";
export type VideoStatus = "published" | "draft" | "processing";
export type CaptionStatus = "manual" | "generated";

export interface BaseEntry {
  id: string;
  kind: ContentKind;
  title: string;
  tagline: string;
  description: string;
  genres: string[];
  year: number;
  rating: number;
  maturity: FilmRating;
  durationMin: number;
  views: number;
  publishedAt: string;
  posterPalette: number;
  featured?: boolean;
  videoUrl?: string;
}

export interface Film extends BaseEntry {
  director: string;
  cast: string[];
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  posterPalette: number;
  subscribers: number;
  verified: boolean;
}

export interface Video extends BaseEntry {
  channelId: string;
  status: "published" | "draft" | "processing";
  visibility: "public" | "unlisted" | "private";
  categories: string[];
  transcriptReady?: boolean;
}

export interface Episode {
  id: string;
  seriesId: string;
  title: string;
  description: string;
  season: number;
  number: number;
  durationMin: number;
  videoUrl: string;
  posterPalette: number;
}

export interface Season {
  season: number;
  title: string;
  year: number;
  episodes: Episode[];
}

export interface Series extends Omit<BaseEntry, "videoUrl"> {
  seasons: Season[];
}

export interface Comment {
  id: string;
  contentId: string;
  userId: string;
  userName: string;
  avatarPalette: number;
  text: string;
  createdAt: string;
  likes: number;
}

export interface CaptionEntry {
  id: string;
  start: string;
  end: string;
  text: string;
}

export interface CaptionTrack {
  id: string;
  videoId: string;
  language: string;
  status: "manual" | "generated";
  entries: CaptionEntry[];
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  bio: string;
  avatarPalette: number;
  role: "viewer" | "creator" | "admin";
  createdAt: string;
}

export interface VideoMetaEdit {
  title?: string;
  description?: string;
  visibility?: "public" | "unlisted" | "private";
  status?: "published" | "draft" | "processing";
}

export interface LibraryData {
  watchlist: string[];
  liked: string[];
  disliked: string[];
  subscriptions: string[];
  progress: Record<string, WatchProgress>;
}

export interface WatchProgress {
  contentId: string;
  positionSec: number;
  durationSec: number;
  updatedAt: string;
}

export interface CardItem {
  id: string;
  kind: ContentKind;
  title: string;
  tagline: string;
  year: number;
  rating: number;
  maturity: FilmRating;
  durationMin: number;
  views: number;
  posterPalette: number;
  genres: string[];
  href: string;
  watchHref: string;
}

export interface Season {
  season: number;
  title: string;
  year: number;
  episodes: Episode[];
}
