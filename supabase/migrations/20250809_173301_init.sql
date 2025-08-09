-- tabela simples para smoke test
create table if not exists public.health_check (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now()
);
