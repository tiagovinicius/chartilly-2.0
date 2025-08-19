-- Fix legacy FK name on charts_top50 that might still be fk_magic_user
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
