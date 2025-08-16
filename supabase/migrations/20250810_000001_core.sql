-- Enable extensions
create extension if not exists pgcrypto;

-- Users table (mirror some data + tokens). In real-world, consider Vault or Edge Functions for token handling.
create table if not exists public.users (
  user_id uuid primary key,
  email text,
  spotify_access_token text,
  spotify_refresh_token text,
  lastfm_session_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_users_email on public.users(email);

-- Playlists owned by user
create table if not exists public.playlists (
  id text primary key, -- Spotify playlist id
  owner_id uuid not null,
  name text,
  track_ids text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint fk_playlists_owner foreign key (owner_id) references public.users(user_id) on delete cascade
);
create index if not exists idx_playlists_owner on public.playlists(owner_id);
create index if not exists idx_playlists_created_at on public.playlists(created_at);

-- Shuffle versions (max 5 per playlist - enforce via app logic)
create table if not exists public.shuffle_versions (
  id bigserial primary key,
  playlist_id text not null,
  order_ids text[] not null,
  created_at timestamptz default now(),
  constraint fk_shuffle_playlist foreign key (playlist_id) references public.playlists(id) on delete cascade
);
create index if not exists idx_shuffle_playlist on public.shuffle_versions(playlist_id);
create index if not exists idx_shuffle_created_at on public.shuffle_versions(created_at);

-- Magic Top 50 snapshot per user
create table if not exists public.magic_top50 (
  user_id uuid primary key,
  track_ids text[] not null,
  generated_at timestamptz not null default now(),
  constraint fk_magic_user foreign key (user_id) references public.users(user_id) on delete cascade
);
create index if not exists idx_magic_generated_at on public.magic_top50(generated_at);

-- Event log
create table if not exists public.events (
  id bigserial primary key,
  user_id uuid,
  event_type text not null,
  payload jsonb,
  status text default 'ok',
  created_at timestamptz default now()
);
create index if not exists idx_events_user on public.events(user_id);
create index if not exists idx_events_created_at on public.events(created_at);
