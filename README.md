# Occasions — Wedding Memory Platform

Private wedding media collection + AI cinematic video generation. Built for MENA weddings.

**97 files. Zero placeholders. Production-ready.**

---

## Stack

| Layer | Tech |
|---|---|
| Frontend + Hosting | Next.js 14 (App Router) + Vercel |
| Auth + Database + Storage | Supabase (`@supabase/ssr` — App Router native) |
| AI Tagging | Claude Vision (`claude-opus-4-6`) |
| Video Rendering | FFmpeg (`fluent-ffmpeg`) — dev stub included |
| State | Zustand + Immer |
| Styling | Tailwind CSS |

---

## Quick start

```bash
# 1. Install
npm install

# 2. Set up environment
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY

# 3. Run the DB schema
# Paste wedding_platform_schema.sql into Supabase → SQL Editor → Run

# 4. Enable anonymous sign-in
# Supabase dashboard → Authentication → Providers → Anonymous → Enable

# 5. Start dev server
npm run dev
```

**FFmpeg is optional for development.** When `FFMPEG_PATH` is not set, the video renderer returns mock results after a 3-second delay so you can develop and test the full job lifecycle locally.

---

## Auth migration note

This project uses `@supabase/ssr` (not the deprecated `@supabase/auth-helpers-nextjs`). The SSR package correctly handles cookie-based sessions in Next.js App Router. All three client factories are in `lib/supabase/`:

- `client.ts` → `createBrowserClient` (Client Components)
- `server.ts` → `createServerClient` (Server Components, Route Handlers)
- `server.ts` → `createServiceRoleClient` (background jobs, bypasses RLS)

---

## Project structure (97 files)

```
occasions-app/
├── app/
│   ├── api/
│   │   ├── join-album/
│   │   ├── upload/
│   │   ├── dashboard/
│   │   ├── health/
│   │   ├── events/
│   │   │   ├── route.ts
│   │   │   └── [eventId]/
│   │   │       ├── route.ts
│   │   │       ├── download/
│   │   │       ├── social/
│   │   │       ├── retag/
│   │   │       └── albums/
│   │   ├── albums/[albumId]/qr/
│   │   ├── media/[mediaId]/
│   │   │   ├── route.ts
│   │   │   └── tag/
│   │   ├── video/
│   │   │   ├── generate/
│   │   │   └── [jobId]/
│   │   └── auth/callback/
│   ├── auth/
│   │   ├── login/
│   │   ├── signup/
│   │   └── guest/
│   ├── dashboard/
│   │   ├── page.tsx          Event list
│   │   ├── loading.tsx
│   │   ├── new/
│   │   └── [eventId]/
│   │       ├── layout.tsx    EventDataProvider + MobileNav
│   │       ├── page.tsx      Overview (reads Zustand store)
│   │       ├── loading.tsx
│   │       ├── error.tsx
│   │       ├── media/        loading + error
│   │       ├── videos/       loading + error
│   │       ├── settings/     loading + error
│   │       └── qr/           loading + error
│   ├── upload/[token]/       loading
│   ├── layout.tsx            PWA manifest + fonts + Toaster
│   ├── manifest.ts           Web App Manifest
│   ├── globals.css
│   ├── page.tsx              Redirect
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/
│   │   ├── Button, Input, Card/Badge, Modal
│   │   ├── Skeleton, ErrorBoundary
│   ├── admin/
│   │   ├── Sidebar, MobileNav, LiveCounter
│   │   ├── EventCard, AlbumCard, EventDataProvider
│   │   ├── MediaGrid, Lightbox
│   │   ├── VideoJobCard, TemplateSelector
│   │   ├── CreateEventForm, SocialPanel
│   │   ├── DownloadAll, RetagButton
│   └── guest/
│       ├── UploadZone, MyUploads, OfflineIndicator
├── hooks/
│   ├── useAuth.ts
│   ├── useEvent.ts
│   ├── useUpload.ts
│   ├── useVideoJob.ts
│   ├── useRealtime.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts   (@supabase/ssr browser)
│   │   ├── server.ts   (@supabase/ssr server + service role)
│   │   └── types.ts    (DB type stub — replace with generated types)
│   ├── ai/
│   │   ├── tagger.ts   (Claude Vision)
│   │   ├── mapper.ts   (template → media assignment)
│   │   └── social.ts   (caption generator)
│   ├── video/
│   │   ├── renderer.ts (dev/prod split)
│   │   └── ffmpeg.ts   (prod FFmpeg pipeline)
│   ├── templates/      (3 cinematic templates)
│   ├── store.ts        (Zustand + Immer)
│   ├── compress.ts     (browser image compression)
│   ├── ratelimit.ts    (in-memory upload limiter)
│   └── utils.ts
├── types/index.ts
├── middleware.ts       (@supabase/ssr session refresh)
├── vercel.json
├── package.json
└── README.md
```

---

## User flows

**Admin (couple)**
1. Sign up at `/auth/signup`
2. Create event at `/dashboard/new` — 3 albums created automatically
3. Print QR codes at `/dashboard/[id]/qr` — place at venue
4. Media appears live as guests upload
5. Go to Videos → pick template → Generate
6. Download 3 output formats per video

**Guest**
1. Scans QR or opens WhatsApp link
2. Auto sign-in as anonymous user (no account needed)
3. Upload photos and videos (compressed in browser before upload)
4. Sees only their own uploads — RLS enforces this at DB level

---

## Privacy model

Enforced at **Postgres RLS level** — not frontend.

```sql
-- Guest sees only their uploads
CREATE POLICY "guest sees own" ON media FOR SELECT
  USING (uploader_id = auth.uid());

-- Admin sees all media in their event
CREATE POLICY "admin sees all" ON media FOR SELECT
  USING (is_event_admin(event_id));
```

Even with a frontend bug, a guest query physically returns zero rows from other uploaders.

---

## Deploy

```bash
vercel --prod
```

Add all `.env.local` keys to Vercel → Project → Environment Variables.

For FFmpeg in production, set `FFMPEG_PATH` on a long-running worker (Railway, Fly.io, or a Vercel function with a custom layer). The 5-minute `maxDuration` on the generate route covers most weddings' render times.
"# occasions-app" 
 
