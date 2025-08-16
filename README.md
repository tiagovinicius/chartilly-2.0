# chartilly — Next.js + Supabase + PWA

Mobile-first app (PWA) to smart-shuffle your Spotify playlists and keep a weekly Top 50 (Last.fm).

## Stack
- Next.js 15 App Router + TypeScript
- Supabase Cloud (migrations in `supabase/migrations`)
- Vercel deploy
- DevContainer (Node 20 bookworm + Supabase CLI)

## Getting started
1. Copy `.env.example` to `.env` and fill required vars:
   - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI
   - LASTFM_API_KEY, LASTFM_SHARED_SECRET
2. Open in VS Code and Reopen in Container.
3. Install deps and run:
   - `pnpm install` (or `npm i`)
   - `pnpm dev` (or `npm run dev`) → http://localhost:3000

## Supabase migrations (CI)
On merge to `main`, GitHub Actions logs in to Supabase and runs `supabase db push`.

## API Routes
- GET `/api/playlists`
- POST `/api/playlists/:id/shuffle`
- POST `/api/playlists/:id/rollback`
- GET `/api/magic/top50`
- POST `/api/magic/top50/sync`
- POST `/api/auth/spotify`
- POST `/api/auth/lastfm`

## PWA
- `public/manifest.webmanifest`
- `public/sw.js`

## Notes
- OAuth flows and external API calls are placeholders; wire your credentials and complete the integrations.
