ALTER TABLE "workshop_requests"
  ADD COLUMN IF NOT EXISTS "groupType" TEXT,
  ADD COLUMN IF NOT EXISTS "residenceName" TEXT,
  ADD COLUMN IF NOT EXISTS "residenceUnit" TEXT,
  ADD COLUMN IF NOT EXISTS "seniorsProfile" TEXT,
  ADD COLUMN IF NOT EXISTS "coordinatorName" TEXT,
  ADD COLUMN IF NOT EXISTS "coordinatorRole" TEXT,
  ADD COLUMN IF NOT EXISTS "coordinatorEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "coordinatorPhone" TEXT;
