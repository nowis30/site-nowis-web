-- Migration: add cleanup fields (isTest, testReason, archivedAt, archivedById, restoredAt, restoredById)
-- to song_requests, workshop_requests, inquiries, invoices

-- song_requests
ALTER TABLE "song_requests"
  ADD COLUMN IF NOT EXISTS "isTest"       BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "testReason"   TEXT,
  ADD COLUMN IF NOT EXISTS "archivedAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "archivedById" UUID,
  ADD COLUMN IF NOT EXISTS "restoredAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "restoredById" UUID;

CREATE INDEX IF NOT EXISTS "song_requests_isTest_idx"    ON "song_requests" ("isTest");
CREATE INDEX IF NOT EXISTS "song_requests_archivedAt_idx" ON "song_requests" ("archivedAt");

-- workshop_requests
ALTER TABLE "workshop_requests"
  ADD COLUMN IF NOT EXISTS "isTest"       BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "testReason"   TEXT,
  ADD COLUMN IF NOT EXISTS "archivedAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "archivedById" UUID,
  ADD COLUMN IF NOT EXISTS "restoredAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "restoredById" UUID;

CREATE INDEX IF NOT EXISTS "workshop_requests_isTest_idx"    ON "workshop_requests" ("isTest");
CREATE INDEX IF NOT EXISTS "workshop_requests_archivedAt_idx" ON "workshop_requests" ("archivedAt");

-- inquiries (submissions)
ALTER TABLE "inquiries"
  ADD COLUMN IF NOT EXISTS "isTest"       BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "testReason"   TEXT,
  ADD COLUMN IF NOT EXISTS "archivedAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "archivedById" UUID,
  ADD COLUMN IF NOT EXISTS "restoredAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "restoredById" UUID;

CREATE INDEX IF NOT EXISTS "inquiries_isTest_idx"    ON "inquiries" ("isTest");
CREATE INDEX IF NOT EXISTS "inquiries_archivedAt_idx" ON "inquiries" ("archivedAt");

-- invoices
ALTER TABLE "invoices"
  ADD COLUMN IF NOT EXISTS "isTest"       BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "testReason"   TEXT,
  ADD COLUMN IF NOT EXISTS "archivedAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "archivedById" UUID,
  ADD COLUMN IF NOT EXISTS "restoredAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "restoredById" UUID;

CREATE INDEX IF NOT EXISTS "invoices_isTest_idx"    ON "invoices" ("isTest");
CREATE INDEX IF NOT EXISTS "invoices_archivedAt_idx" ON "invoices" ("archivedAt");
