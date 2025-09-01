-- Add Spotify track cache to minimize API calls
-- Stores successful track searches to avoid repeated lookups
create table if not exists public.spotify_track_cache (
  id bigserial primary key,
  -- Search criteria (normalized for consistency)
  artist text not null,
  title text not null,
  -- Spotify result
  spotify_uri text not null,
  -- Metadata
  first_searched_at timestamptz default now(),
  last_accessed_at timestamptz default now(),
  access_count bigint default 1,
  -- Performance optimization
  constraint unique_artist_title unique (artist, title)
);

-- Indexes for fast lookups
create index if not exists idx_spotify_cache_artist_title on public.spotify_track_cache(artist, title);
create index if not exists idx_spotify_cache_last_accessed on public.spotify_track_cache(last_accessed_at);

-- RPC function to increment access count atomically
create or replace function increment_cache_access(p_artist text, p_title text)
returns void as $$
begin
  update public.spotify_track_cache
  set access_count = access_count + 1
  where artist = p_artist and title = p_title;
end;
$$ language plpgsql;

-- Cleanup function to remove old cache entries (keep only last 90 days)
create or replace function cleanup_spotify_cache()
returns void as $$
begin
  delete from public.spotify_track_cache
  where last_accessed_at < now() - interval '90 days';
end;
$$ language plpgsql;

-- Optional: Schedule periodic cleanup (uncomment if you want automated cleanup)
-- select cron.schedule('cleanup-spotify-cache', '0 2 * * 0', 'select cleanup_spotify_cache();');

-- Add comment for documentation
comment on table public.spotify_track_cache is 'Cache for Spotify track searches to minimize API calls and improve sync performance';
