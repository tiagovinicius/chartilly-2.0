alter table public.users add column if not exists lastfm_username text;
create index if not exists idx_users_lastfm_username on public.users(lastfm_username);
