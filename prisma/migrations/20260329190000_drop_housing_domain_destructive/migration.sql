-- Destructive cleanup of retired housing domain
-- This migration removes legacy housing tables, legacy FK columns, and shrinks enums.

BEGIN;

-- 1) Normalize user role enum values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'UserRole' AND e.enumlabel = 'TENANT'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'UserRole' AND e.enumlabel = 'PORTAL_USER'
  ) THEN
    ALTER TYPE "UserRole" RENAME VALUE 'TENANT' TO 'PORTAL_USER';
  END IF;
END
$$;

-- 2) Normalize contact type enum values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'ContactType' AND e.enumlabel = 'PROPRIETAIRE'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'ContactType' AND e.enumlabel = 'ORGANIZATION'
  ) THEN
    ALTER TYPE "ContactType" RENAME VALUE 'PROPRIETAIRE' TO 'ORGANIZATION';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'ContactType' AND e.enumlabel = 'LOCATAIRE_PROSPECT'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'ContactType' AND e.enumlabel = 'PARTICIPANT'
  ) THEN
    ALTER TYPE "ContactType" RENAME VALUE 'LOCATAIRE_PROSPECT' TO 'PARTICIPANT';
  END IF;
END
$$;

-- 3) Collapse case types to active domain
UPDATE "cases"
SET "type" = 'SUPPORT'
WHERE "type"::text IN ('LOCATION', 'MAINTENANCE', 'LEGACY_HOUSING', 'LEGACY_MAINTENANCE');

CREATE TYPE "CaseType_new" AS ENUM ('CLIENT', 'SUPPORT');
ALTER TABLE "cases" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "cases"
  ALTER COLUMN "type" TYPE "CaseType_new"
  USING (
    CASE
      WHEN "type"::text = 'CLIENT' THEN 'CLIENT'::"CaseType_new"
      ELSE 'SUPPORT'::"CaseType_new"
    END
  );
DROP TYPE "CaseType";
ALTER TYPE "CaseType_new" RENAME TO "CaseType";
ALTER TABLE "cases" ALTER COLUMN "type" SET DEFAULT 'CLIENT';

-- 4) Collapse linked types to active domain
UPDATE "documents"
SET "linkedType" = 'CASE'
WHERE "linkedType"::text IN ('PROPERTY', 'UNIT', 'TENANT', 'LEASE', 'PAYMENT', 'MAINTENANCE_TICKET', 'LEGACY_PROPERTY', 'LEGACY_UNIT', 'LEGACY_TENANT', 'LEGACY_LEASE', 'LEGACY_PAYMENT', 'LEGACY_MAINTENANCE_TICKET');

UPDATE "tasks"
SET "linkedType" = 'CASE'
WHERE "linkedType"::text IN ('PROPERTY', 'UNIT', 'TENANT', 'LEASE', 'PAYMENT', 'MAINTENANCE_TICKET', 'LEGACY_PROPERTY', 'LEGACY_UNIT', 'LEGACY_TENANT', 'LEGACY_LEASE', 'LEGACY_PAYMENT', 'LEGACY_MAINTENANCE_TICKET');

UPDATE "communications"
SET "linkedType" = 'CASE'
WHERE "linkedType"::text IN ('PROPERTY', 'UNIT', 'TENANT', 'LEASE', 'PAYMENT', 'MAINTENANCE_TICKET', 'LEGACY_PROPERTY', 'LEGACY_UNIT', 'LEGACY_TENANT', 'LEGACY_LEASE', 'LEGACY_PAYMENT', 'LEGACY_MAINTENANCE_TICKET');

CREATE TYPE "LinkedType_new" AS ENUM (
  'CONTACT',
  'ORGANIZATION',
  'INQUIRY',
  'CASE',
  'APPOINTMENT',
  'INVOICE',
  'ACTIVITY',
  'SONG_REQUEST',
  'WORKSHOP_REQUEST',
  'WORKSHOP_APPOINTMENT'
);

ALTER TABLE "documents"
  ALTER COLUMN "linkedType" TYPE "LinkedType_new"
  USING ("linkedType"::text::"LinkedType_new");

ALTER TABLE "communications"
  ALTER COLUMN "linkedType" TYPE "LinkedType_new"
  USING ("linkedType"::text::"LinkedType_new");

ALTER TABLE "tasks"
  ALTER COLUMN "linkedType" TYPE "LinkedType_new"
  USING (
    CASE
      WHEN "linkedType" IS NULL THEN NULL
      ELSE "linkedType"::text::"LinkedType_new"
    END
  );

DROP TYPE "LinkedType";
ALTER TYPE "LinkedType_new" RENAME TO "LinkedType";

-- 5) Drop legacy foreign keys/indexes/columns from active tables
ALTER TABLE "communications" DROP CONSTRAINT IF EXISTS "communications_tenantId_fkey";
ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_propertyId_fkey";

DROP INDEX IF EXISTS "communications_tenantId_idx";

ALTER TABLE "communications" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "propertyId";
ALTER TABLE "activities" DROP COLUMN IF EXISTS "propertyId";

-- 6) Drop retired housing tables
DROP TABLE IF EXISTS "maintenance_updates";
DROP TABLE IF EXISTS "maintenance_tickets";
DROP TABLE IF EXISTS "payments";
DROP TABLE IF EXISTS "leases";
DROP TABLE IF EXISTS "tenants";
DROP TABLE IF EXISTS "units";
DROP TABLE IF EXISTS "properties";

-- 7) Drop retired enums
DROP TYPE IF EXISTS "MaintenanceStatus";
DROP TYPE IF EXISTS "MaintenancePriority";
DROP TYPE IF EXISTS "PaymentStatus";
DROP TYPE IF EXISTS "LeaseStatus";
DROP TYPE IF EXISTS "UnitStatus";
DROP TYPE IF EXISTS "PropertyType";

COMMIT;