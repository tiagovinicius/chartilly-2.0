-- Add I Love Mondays preferences to users table
alter table public.users add column if not exists ilovemondays_playlist_id text;
alter table public.users add column if not exists ilovemondays_playlist_name text;

-- Charts I Love Mondays snapshot per user
create table if not exists public.charts_ilovemondays (
  user_id uuid primary key,
  track_ids text[] not null,
  generated_at timestamptz not null default now(),
  week_start_date date not null, -- Monday of the week being tracked
  constraint fk_charts_ilovemondays_user foreign key (user_id) references public.users(user_id) on delete cascade
);
create index if not exists idx_charts_ilovemondays_generated_at on public.charts_ilovemondays(generated_at);
create index if not exists idx_charts_ilovemondays_week_start on public.charts_ilovemondays(week_start_date);
