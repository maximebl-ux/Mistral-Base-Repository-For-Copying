"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  CaptionEntry,
  Comment,
  LibraryData,
  UserProfile,
  WatchProgress,
} from "@/types";
import { seedUsers, seedComments, hashPassword } from "@/stores/seed";

const USERS_KEY = "lumen:users";
const SESSION_KEY = "lumen:session";
const LIBRARY_KEY = "lumen:library";
const COMMENTS_KEY = "lumen:comments";
const CAPTIONS_KEY = "lumen:captions";
const VIDEO_META_KEY = "lumen:video-meta";

export interface VideoMetaEdit {
  title?: string;
  description?: string;
  visibility?: "public" | "unlisted" | "private";
  status?: "published" | "draft" | "processing";
  categories?: string[];
}

interface StoreValue {
  user: UserProfile | null;
  mounted: boolean;
  users: UserProfile[];
  library: LibraryData;
  comments: Comment[];
  captionOverrides: Record<string, Record<string, CaptionEntry[]>>;
  videoMeta: Record<string, VideoMetaEdit>;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (username: string, email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  toggleWatchlist: (id: string) => void;
  toggleLiked: (id: string) => void;
  toggleDisliked: (id: string) => void;
  isDisliked: (id: string) => boolean;
  toggleSubscription: (id: string) => void;
  isLiked: (id: string) => boolean;
  isWatchlisted: (id: string) => boolean;
  isSubscribed: (id: string) => boolean;
  saveProgress: (p: WatchProgress) => void;
  clearProgress: (id: string) => void;
  addComment: (contentId: string, text: string) => void;
  deleteComment: (id: string) => void;
  saveCaptionTrack: (videoId: string, language: string, entries: CaptionEntry[]) => void;
  saveVideoMeta: (videoId: string, patch: VideoMetaEdit) => void;
}

const emptyLibrary: LibraryData = { watchlist: [], liked: [], disliked: [], subscriptions: [], progress: {} };

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>(seedUsers);
  const [library, setLibrary] = useState<LibraryData>(emptyLibrary);
  const [comments, setComments] = useState<Comment[]>([]);
  const [captionOverrides, setCaptionOverrides] = useState<Record<string, Record<string, CaptionEntry[]>>>({});
  const [videoMeta, setVideoMeta] = useState<Record<string, VideoMetaEdit>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!readJSON<UserProfile[]>(USERS_KEY)) writeJSON(USERS_KEY, seedUsers);
    setUsers(readJSON<UserProfile[]>(USERS_KEY) ?? seedUsers);
    setUser(readJSON<UserProfile>(SESSION_KEY));
    setLibrary({ ...emptyLibrary, ...(readJSON<LibraryData>(LIBRARY_KEY) ?? emptyLibrary) });
    setComments(readJSON<Comment[]>(COMMENTS_KEY) ?? seedComments);
    setCaptionOverrides(readJSON<Record<string, Record<string, CaptionEntry[]>>>(CAPTIONS_KEY) ?? {});
    setVideoMeta(readJSON<Record<string, VideoMetaEdit>>(VIDEO_META_KEY) ?? {});
    setMounted(true);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const stored = readJSON<UserProfile[]>(USERS_KEY) ?? seedUsers;
    const found = stored.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { ok: false, error: "No account found with this email." };
    if (found.passwordHash !== hashPassword(password)) return { ok: false, error: "Incorrect password." };
    setUser(found);
    writeJSON(SESSION_KEY, found);
    return { ok: true };
  }, []);

  const register = useCallback((username: string, email: string, password: string) => {
    const stored = readJSON<UserProfile[]>(USERS_KEY) ?? seedUsers;
    if (stored.some((u) => u.email.toLowerCase() === email.toLowerCase()))
      return { ok: false, error: "An account with this email already exists." };
    const newUser: UserProfile = {
      id: `u-${Math.random().toString(36).slice(2, 10)}`,
      username,
      email,
      passwordHash: hashPassword(password),
      bio: "",
      avatarPalette: Math.floor(Math.random() * 12),
      role: "creator",
      createdAt: new Date().toISOString(),
    };
    const next = [...stored, newUser];
    setUsers(next);
    writeJSON(USERS_KEY, next);
    setUser(newUser);
    writeJSON(SESSION_KEY, newUser);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    writeJSON(SESSION_KEY, null);
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      const stored = readJSON<UserProfile[]>(USERS_KEY) ?? seedUsers;
      const updated = stored.map((u) => (u.id === next.id ? next : u));
      setUsers(updated);
      writeJSON(USERS_KEY, updated);
      writeJSON(SESSION_KEY, next);
      return next;
    });
  }, []);

  const persistLibrary = useCallback((next: LibraryData) => {
    setLibrary(next);
    writeJSON(LIBRARY_KEY, next);
  }, []);

  const toggleList = useCallback(
    (list: "watchlist" | "liked" | "disliked" | "subscriptions", id: string) => {
      const has = library[list].includes(id);
      persistLibrary({
        ...library,
        [list]: has ? library[list].filter((x) => x !== id) : [...library[list], id],
      });
    },
    [library, persistLibrary]
  );



  const saveProgress = useCallback(
    (p: WatchProgress) => {
      persistLibrary({ ...library, progress: { ...library.progress, [p.contentId]: p } });
    },
    [library, persistLibrary]
  );

  const clearProgress = useCallback(
    (id: string) => {
      const next = { ...library.progress };
      delete next[id];
      persistLibrary({ ...library, progress: next });
    },
    [library, persistLibrary]
  );

  const persistComments = useCallback((next: Comment[]) => {
    setComments(next);
    writeJSON(COMMENTS_KEY, next);
  }, []);

  const addComment = useCallback(
    (contentId: string, text: string) => {
      if (!user || !text.trim()) return;
      const c: Comment = {
        id: `cm-${Date.now().toString(36)}`,
        contentId,
        userId: user.id,
        userName: user.username,
        avatarPalette: user.avatarPalette,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        likes: 0,
      };
      persistComments([c, ...comments]);
    },
    [user, comments, persistComments]
  );



  const deleteComment = useCallback(
    (id: string) => persistComments(comments.filter((c) => c.id !== id)),
    [comments, persistComments]
  );

  const saveCaptionTrack = useCallback(
    (videoId: string, language: string, entries: CaptionEntry[]) => {
      const all = readJSON<Record<string, Record<string, CaptionEntry[]>>>(CAPTIONS_KEY) ?? {};
      const forVideo = all[videoId] ?? {};
      const next = { ...all, [videoId]: { ...forVideo, [language]: entries } };
      setCaptionOverrides(next);
      writeJSON(CAPTIONS_KEY, next);
    },
    []
  );

  const saveVideoMeta = useCallback(
    (videoId: string, patch: VideoMetaEdit) => {
      const all = readJSON<Record<string, VideoMetaEdit>>(VIDEO_META_KEY) ?? {};
      const next = { ...all, [videoId]: { ...(all[videoId] ?? {}), ...patch } };
      setVideoMeta(next);
      writeJSON(VIDEO_META_KEY, next);
    },
    []
  );

  const value = useMemo<StoreValue>(
    () => ({
      user,
      mounted,
      users,
      library,
      comments,
      captionOverrides,
      videoMeta,
      login,
      register,
      logout,
      updateProfile,
      toggleWatchlist: (id) => toggleList("watchlist", id),
      toggleLiked: (id) => toggleList("liked", id),
      toggleDisliked: (id) => toggleList("disliked", id),
      toggleSubscription: (id) => toggleList("subscriptions", id),
      isLiked: (id) => library.liked.includes(id),
      isDisliked: (id) => library.disliked.includes(id),
      isWatchlisted: (id) => library.watchlist.includes(id),
      isSubscribed: (id) => library.subscriptions.includes(id),
      saveProgress,
      clearProgress,
      addComment,
      deleteComment,
      saveCaptionTrack,
      saveVideoMeta,
    }),
    [user, mounted, users, library, comments, captionOverrides, videoMeta, login, register, logout, updateProfile, toggleList, saveProgress, clearProgress, addComment, deleteComment, saveCaptionTrack, saveVideoMeta]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* prototype data is non-critical */
  }
}
