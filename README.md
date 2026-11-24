# LUMEN — Hybrid Streaming Platform Prototype

A polished, functional prototype of a public video streaming platform combining a
Netflix-style catalogue with YouTube-style creator features. Built with **Next.js 15,
React 19, TypeScript and Tailwind CSS v4** — no paid APIs, no Supabase/Mux, no real
uploads. All data is local sample data.

## Quick start

```bash
npm install
npm run dev   # http://localhost:3000
```

Production build: `npm run build && npm start`

## Demo accounts (mock auth, stored in browser localStorage)

Three role accounts (viewer, creator, admin) are seeded in `src/stores/seed.ts` so the
gated areas can be exercised. Their logins are intentionally **not** documented here or
shown in the UI: the login page lists no credentials, and the role-gated pages no longer
name a demo email. Request the demo logins from the project owner, or register your own
viewer account at `/register` (registration only creates viewer accounts).

| Role    | Unlocks                    |
| ------- | -------------------------- |
| viewer  | library, watchlist, likes  |
| creator | + Creator Studio, captions |
| admin   | + Admin console            |

## What's here

- **Design system** — CSS variables + Tailwind tokens (`src/app/globals.css`), reusable
  primitives (`src/components/ui`), deterministic generative artwork instead of photos
  (`src/components/media/Artwork.tsx`, palettes in `src/lib/art.ts`). Brand name
  "Lumen" is a placeholder; change it in `src/components/layout/Logo.tsx` and
  `src/app/layout.tsx` metadata.
- **Homepage** — cinematic hero, genre collections, Continue Watching, and rails for
  Trending / Popular films / Popular series / Recommended / Recently uploaded, each
  horizontally scrollable with hover actions.
- **Catalogue** — `/browse` (kind/genre/sort filters), `/movies`, `/series`, film detail
  pages with cast + similar titles, series detail pages with season sections and
  per-episode pages with next-episode navigation.
- **Watch page** (`/watch/[id]`) — full custom player: play/pause, seek, volume,
  playback speed, quality menu (visual), fullscreen, keyboard shortcuts (Space/M/F/←/→),
  like/dislike, subscribe, comments, "More like this". Real WebVTT captions render via
  `<track>` where a caption track exists (e.g. *Shooting in Natural Light*, *Sintel*).
- **Library** (`/library`) — Watchlist / Liked / History tabs, persisted locally.
- **Accounts** — register, login, profile editing (username, bio, avatar palette).
- **Creator Studio** (`/studio`) — dashboard stats, video table with status/visibility/
  caption status, video editor (title/description/categories/visibility/status),
  upload mockup (`/studio/upload`, clearly labeled as not transferring files).
- **Captions** (`/studio/captions`) — per-video transcript editor with timestamped
  entries, English/French selection, simulated "Generate captions" button, live subtitle
  preview in the player, and WebVTT export (`src/lib/vtt.ts`).
- **Admin** (`/admin`) — users, channels, videos, films & series, categories and caption
  status tables with a working visibility toggle; hard-gated to the admin role.
- **Search** (`/search?q=…`) — full-text match over the catalogue with content-type tabs,
  genre filter, sorting and empty states.

## Simulated features (intentional in this phase)

- **Authentication** — mock client-side auth; `hashPassword` is a toy hash. Production
  auth is deliberately not wired.
- **Uploads** — the upload page demonstrates the workflow but never pretends to
  transfer or process a file.
- **AI transcription** — "Generate captions" is a simulated delay; the code is shaped so
  a real provider returning `CaptionEntry[]` replaces one timeout
  (see `src/app/studio/captions/[id]/page.tsx`).
- **Quality menu** — visual only; all sample media is single-rendition.
- **View/like counts** — static sample data.
- **Admin management** — writes are local overlays via `videoMeta`, not backend writes.

## Known limitations

- All persistence is `localStorage` under `lumen:*` keys; clearing site data resets demo
  accounts (they re-seed on load).
- Sample media streams from Google's public GTV sample bucket (Blender Foundation open
  movies, CC-licensed). Titles without `videoUrl` show an honest "no sample media"
  state instead of a fake player.
- Series episode counts/durations are static sample data; playback resume is per-title.

## Future integrations (architecture is ready)

- **PostgreSQL / Supabase** — the store's read/write helpers and type contracts
  (`src/types/index.ts`) map 1:1 to tables: `users`, `videos`, `films`, `series`,
  `episodes`, `comments`, `caption_tracks`, `library_items`.
- **Streaming provider (e.g. Mux)** — `VideoPlayer` takes a plain `src`; swap the
  sample URLs for playback IDs and add a signed-playback layer.
- **Speech-to-text** — implement `generateCaptions(videoId, language): CaptionEntry[]`
  where the simulation timeout sits; WebVTT export already works.
- **Real uploads** — replace `/studio/upload` form target with a direct-to-storage
  signed upload; `VideoMetaEdit` already models the metadata patch flow.

## Project structure

```
src/
  app/            # App Router pages (home, movies, series, browse, search, watch,
                  # library, login, register, profile, studio/*, admin)
  components/     # ui/, layout/, cards/, sections/, media/, player/, search/, auth/
  data/           # sample catalogue, caption tracks, comment seeds
  lib/            # format helpers, card mapping, vtt, artwork palettes
  stores/         # context store (auth, library, comments, captions, video meta)
  types/          # shared TypeScript contracts
```
