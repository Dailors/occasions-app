# Changelog

## [1.0.0] — Initial release

### Batch 1 — Foundation
Database schema, RLS policies, and Supabase storage buckets (`wedding_platform_schema.sql`).

### Batch 2 — API layer
Core API routes: `join-album`, `upload`, `dashboard`, `events` CRUD, `albums/qr`, `media`, `video/generate`, `video/[jobId]`.

### Batch 3 — Full application
All pages, components, hooks, AI layer, template engine, FFmpeg renderer, auth flow.

### Batch 4 — Production features
Zustand store, Realtime subscriptions, image compression, skeleton loaders, error boundaries, guest MyUploads, DownloadAll, print QR page, SocialPanel, Lightbox, MobileNav, RetagButton.

### Batch 5 — Bug fixes & wiring
Store reset on event navigation, stale closure fixes in `useRealtime` and `useVideoJob`, double-sidebar fix, retry fix in `useUpload`, template name display in `VideoJobCard`, rate limiting, PWA manifest, `vercel.json`, health check, `maxDuration` exports, sub-page loading/error pages, `OfflineIndicator`.

### Batch 6 — Auth migration & completion
Migrated entire auth layer from deprecated `@supabase/auth-helpers-nextjs` to `@supabase/ssr`. Fixed naming collision in `server.ts`. Fixed QR page to read from Zustand store. Dev FFmpeg stub so app runs without FFmpeg locally. Production FFmpeg split into `lib/video/ffmpeg.ts`. `useAuth` memoization. Albums management API. Barrel exports. `.gitignore`. Final TypeScript cleanup.
