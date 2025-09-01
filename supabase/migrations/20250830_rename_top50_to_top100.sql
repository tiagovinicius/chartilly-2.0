-- Rename top50 references to top100 for semantic consistency
-- This migration is idempotent and safe to run multiple times

-- Rename charts_top50 table to charts_top100
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'charts_top50') THEN
    ALTER TABLE public.charts_top50 RENAME TO charts_top100;
  END IF;
END $$;

-- Rename user columns from top50 to top100
DO $$
BEGIN
  -- Rename top50_playlist_id to top100_playlist_id
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public'
             AND table_name = 'users'
             AND column_name = 'top50_playlist_id') THEN
    ALTER TABLE public.users RENAME COLUMN top50_playlist_id TO top100_playlist_id;
  END IF;

  -- Rename top50_playlist_name to top100_playlist_name
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public'
             AND table_name = 'users'
             AND column_name = 'top50_playlist_name') THEN
    ALTER TABLE public.users RENAME COLUMN top50_playlist_name TO top100_playlist_name;
  END IF;
END $$;

-- Update index name if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes
             WHERE schemaname = 'public'
             AND tablename = 'charts_top100'
             AND indexname = 'idx_charts_generated_at') THEN
    -- Index should automatically be renamed with the table, but ensure it exists
    -- No action needed as indexes follow table renames
  END IF;
END $$;

-- Update foreign key constraint name for consistency
DO $$
BEGIN
  -- Check if the constraint exists and rename if needed
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE table_schema = 'public'
             AND table_name = 'charts_top100'
             AND constraint_name = 'fk_charts_user') THEN
    ALTER TABLE public.charts_top100 RENAME CONSTRAINT fk_charts_user TO fk_charts_top100_user;
  END IF;
END $$;
