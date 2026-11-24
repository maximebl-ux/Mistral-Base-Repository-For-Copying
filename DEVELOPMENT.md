# LUMEN — Development Document

Status: **Phase 1 prototype complete** (design system → homepage → catalogue → watch →
profiles/library → studio → captions → admin → tested/fixed).

## Completed features

| Area | Status | Notes |
| --- | --- | --- |
| Project scaffold | ✅ | Next.js 15 + React 19 + TS strict + Tailwind v4, no extra deps |
| Design system | ✅ | CSS vars, `ui/` primitives, generative artwork, dark cinematic theme |
| Nav bar | ✅ | Wordmark, search, Home/Browse/Movies/Series/Library, profile menu (role-gated) |
| Homepage | ✅ | Hero + genre chips + Continue Watching + 5 scrollable rails with hover actions |
| Catalogue pages | ✅ | Browse (filters/sort/empty state), Movies, Series, film & series detail |
| Watch page | ✅ | Custom player (play/pause/seek/volume/speed/quality/fullscreen/keys), like & dislike, subscribe, comments, recommended rail, next-episode |
| Player captions | ✅ | Real WebVTT `<track>` rendering where tracks exist + CC toggle |
| Accounts | ✅ | Register/login/logout/profile edit/avatar palette; mock auth, labeled |
| Library | ✅ | Watchlist/Liked/History tabs, persisted, add/remove works |
| Creator Studio | ✅ | Stats, video table, metadata editor (title/desc/categories/visibility/status), upload mockup |
| Captions | ✅ | Transcript editor (EN/FR), add/edit/delete entries, simulated generate, live preview, WebVTT export |
| Admin | ✅ | Users/Channels/Videos/Films & Series/Categories/Captions tables, visibility toggle, role-gated |
| Search | ✅ | Query + tabs + genre + sort + empty states over sample catalogue |
| Accessibility | ✅ | Skip link, aria-pressed/labels on controls, role=slider on seek bar, keyboard shortcuts |
| Verification | ✅ | `tsc --noEmit` clean, `next build` clean (19 routes), all routes smoke-tested 200 |

## Simulated features (all clearly labeled in the UI)

- Auth: localStorage-local users, toy password hash, demo accounts auto-seeded.
- Uploads: file picker shows metadata only; explicitly marked "not uploaded in this prototype".
- Automatic transcription: simulated 1.6 s delay producing placeholder `CaptionEntry[]`; the injection
  point for a real provider is documented in the editor source.
- Quality menu: visual selection only (single-rendition samples).
- Refresh/upload processing states: statuses exist as sample data; nothing processes.
- Admin writes: persisted locally as overlays (`lumen:video-meta`), not a backend.

## Known bugs

- None known at time of delivery: typecheck and production build are clean and all
  routes return 200 with expected SSR content (unknown routes 404). Client-only
  persistence means the first paint of account-gated UIs shows a brief loading state
  until localStorage hydration completes (by design, avoids hydration mismatches).

## Remaining tasks / next phase

- Server-side persistence (PostgreSQL/Supabase) replacing localStorage.
- Real upload + processing pipeline (direct-to-storage signed uploads).
- Real speech-to-text provider for the caption system (EN first, FR next).
- Multi-rendition HLS/DASH playback + real quality switching.
- Watch-history sync across devices; per-episode resume forseries continuity.
- Small UX polish: search suggestions dropdown in the navbar, toast wiring for
  watchlist/caption actions (component exists, currently unused).

## Future production integrations

1. **Database**: the store contracts map to `users/videos/films/series/episodes/comments/caption_tracks/library_items` tables.
2. **Streaming**: swap `SAMPLE_VIDEOS` URLs for provider playback IDs; `VideoPlayer.src` is the only touchpoint.
3. **Transcription**: implement `generateCaptions(videoId, language): CaptionEntry[]` at the marked simulation point; WebVTT layer already works for export and `<track>` rendering.
4. **Auth**: replace the mock store auth with real sessions (the app reads `user` from one context, so the swap is localized).
