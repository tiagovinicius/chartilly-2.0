-- Rename magic_top50 to charts_top50 (idempotent-safe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'magic_top50'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'charts_top50'
  ) THEN
    EXECUTE 'ALTER TABLE public.magic_top50 RENAME TO charts_top50';
  END IF;
END $$;

-- Rename index if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND n.nspname = 'public'
      AND c.relname = 'idx_magic_generated_at'
  ) THEN
    EXECUTE 'ALTER INDEX public.idx_magic_generated_at RENAME TO idx_charts_generated_at';
  END IF;
END $$;

-- Rename foreign key constraint if it still uses the old name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public'
      AND rel.relname = 'charts_top50'
      AND con.conname = 'fk_magic_user'
  ) THEN
    EXECUTE 'ALTER TABLE public.charts_top50 RENAME CONSTRAINT fk_magic_user TO fk_charts_user';
  END IF;
END $$;
