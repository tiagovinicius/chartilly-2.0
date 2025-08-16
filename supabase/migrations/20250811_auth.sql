-- Add spotify_user_id to users for mapping
alter table public.users add column if not exists spotify_user_id text unique;
create index if not exists idx_users_spotify_id on public.users(spotify_user_id);
