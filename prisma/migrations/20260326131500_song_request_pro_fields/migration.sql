DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'SongRequestStatus' AND e.enumlabel = 'IN_PRODUCTION'
  ) THEN
    ALTER TYPE "public"."SongRequestStatus" ADD VALUE 'IN_PRODUCTION';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'SongRequestStatus' AND e.enumlabel = 'DELIVERED'
  ) THEN
    ALTER TYPE "public"."SongRequestStatus" ADD VALUE 'DELIVERED';
  END IF;
END $$;

ALTER TABLE "public"."song_requests"
  ADD COLUMN IF NOT EXISTS "title" TEXT,
  ADD COLUMN IF NOT EXISTS "language" TEXT,
  ADD COLUMN IF NOT EXISTS "eventType" TEXT,
  ADD COLUMN IF NOT EXISTS "specialMessage" TEXT,
  ADD COLUMN IF NOT EXISTS "tempo" TEXT,
  ADD COLUMN IF NOT EXISTS "theme" TEXT,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "inspirations" TEXT,
  ADD COLUMN IF NOT EXISTS "lyrics" TEXT,
  ADD COLUMN IF NOT EXISTS "structureVerse" TEXT,
  ADD COLUMN IF NOT EXISTS "structureChorus" TEXT,
  ADD COLUMN IF NOT EXISTS "structureBridge" TEXT,
  ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;
