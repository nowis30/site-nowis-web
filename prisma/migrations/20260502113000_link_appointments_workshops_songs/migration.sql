-- Non-destructive migration: link CRM appointments with workshops and song requests

ALTER TYPE "AppointmentType" ADD VALUE IF NOT EXISTS 'WORKSHOP';
ALTER TYPE "AppointmentType" ADD VALUE IF NOT EXISTS 'SONG_MEETING';
ALTER TYPE "AppointmentType" ADD VALUE IF NOT EXISTS 'OTHER';

ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "appointmentType" "AppointmentType",
  ADD COLUMN IF NOT EXISTS "organizationId" UUID,
  ADD COLUMN IF NOT EXISTS "workshopRequestId" UUID,
  ADD COLUMN IF NOT EXISTS "songRequestId" UUID,
  ADD COLUMN IF NOT EXISTS "location" TEXT,
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "workshop_requests"
  ADD COLUMN IF NOT EXISTS "startAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "endAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "durationMinutes" INTEGER,
  ADD COLUMN IF NOT EXISTS "meetingType" TEXT;

ALTER TABLE "song_requests"
  ADD COLUMN IF NOT EXISTS "organizationId" UUID,
  ADD COLUMN IF NOT EXISTS "meetingDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "startAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "endAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "durationMinutes" INTEGER,
  ADD COLUMN IF NOT EXISTS "meetingType" TEXT,
  ADD COLUMN IF NOT EXISTS "location" TEXT,
  ADD COLUMN IF NOT EXISTS "meetingNotes" TEXT;

CREATE INDEX IF NOT EXISTS "appointments_organizationId_idx" ON "appointments"("organizationId");
CREATE INDEX IF NOT EXISTS "appointments_workshopRequestId_idx" ON "appointments"("workshopRequestId");
CREATE INDEX IF NOT EXISTS "appointments_songRequestId_idx" ON "appointments"("songRequestId");
CREATE INDEX IF NOT EXISTS "song_requests_organizationId_idx" ON "song_requests"("organizationId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_organizationId_fkey'
  ) THEN
    ALTER TABLE "appointments"
      ADD CONSTRAINT "appointments_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_workshopRequestId_fkey'
  ) THEN
    ALTER TABLE "appointments"
      ADD CONSTRAINT "appointments_workshopRequestId_fkey"
      FOREIGN KEY ("workshopRequestId") REFERENCES "workshop_requests"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_songRequestId_fkey'
  ) THEN
    ALTER TABLE "appointments"
      ADD CONSTRAINT "appointments_songRequestId_fkey"
      FOREIGN KEY ("songRequestId") REFERENCES "song_requests"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'song_requests_organizationId_fkey'
  ) THEN
    ALTER TABLE "song_requests"
      ADD CONSTRAINT "song_requests_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
