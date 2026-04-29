-- CreateEnum
CREATE TYPE "public"."WorkshopRequestType" AS ENUM ('ORGANIZATION', 'CLIENT');

-- CreateEnum
CREATE TYPE "public"."WorkshopDeliveryFormat" AS ENUM ('SUR_PLACE', 'EN_LIGNE', 'A_DETERMINER');

-- CreateEnum
CREATE TYPE "public"."WorkshopTargetAudience" AS ENUM ('PERSONNES_AGEES', 'JEUNES', 'ADULTES', 'FAMILLE', 'ORGANISME', 'AUTRE');

-- CreateEnum
CREATE TYPE "public"."WorkshopDurationPreset" AS ENUM ('M60', 'M90', 'M120', 'PERSONNALISE');

-- CreateEnum
CREATE TYPE "public"."WorkshopPricingMode" AS ENUM ('HORAIRE', 'PAR_PERSONNE', 'PERSONNALISE');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'WorkshopRequestStatus' AND e.enumlabel = 'BROUILLON'
  ) THEN
    ALTER TYPE "public"."WorkshopRequestStatus" ADD VALUE 'BROUILLON';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'WorkshopRequestStatus' AND e.enumlabel = 'EN_ATTENTE_RDV'
  ) THEN
    ALTER TYPE "public"."WorkshopRequestStatus" ADD VALUE 'EN_ATTENTE_RDV';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'WorkshopRequestStatus' AND e.enumlabel = 'RDV_PLANIFIE'
  ) THEN
    ALTER TYPE "public"."WorkshopRequestStatus" ADD VALUE 'RDV_PLANIFIE';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'WorkshopRequestStatus' AND e.enumlabel = 'CONFIRME'
  ) THEN
    ALTER TYPE "public"."WorkshopRequestStatus" ADD VALUE 'CONFIRME';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'WorkshopRequestStatus' AND e.enumlabel = 'TERMINE'
  ) THEN
    ALTER TYPE "public"."WorkshopRequestStatus" ADD VALUE 'TERMINE';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'WorkshopRequestStatus' AND e.enumlabel = 'ANNULE'
  ) THEN
    ALTER TYPE "public"."WorkshopRequestStatus" ADD VALUE 'ANNULE';
  END IF;
END $$;

ALTER TABLE "public"."workshop_requests"
  ALTER COLUMN "organizationId" DROP NOT NULL,
  ADD COLUMN "clientId" UUID,
  ADD COLUMN "workshopType" "public"."WorkshopRequestType" NOT NULL DEFAULT 'ORGANIZATION',
  ADD COLUMN "organizationName" TEXT,
  ADD COLUMN "contactPerson" TEXT,
  ADD COLUMN "contactPhone" TEXT,
  ADD COLUMN "contactEmail" TEXT,
  ADD COLUMN "addressOrLocation" TEXT,
  ADD COLUMN "deliveryFormat" "public"."WorkshopDeliveryFormat" NOT NULL DEFAULT 'A_DETERMINER',
  ADD COLUMN "participantEstimate" INTEGER,
  ADD COLUMN "targetAudience" "public"."WorkshopTargetAudience" NOT NULL DEFAULT 'AUTRE',
  ADD COLUMN "durationPreset" "public"."WorkshopDurationPreset" NOT NULL DEFAULT 'M90',
  ADD COLUMN "durationCustomMinutes" INTEGER,
  ADD COLUMN "pricingMode" "public"."WorkshopPricingMode" NOT NULL DEFAULT 'HORAIRE',
  ADD COLUMN "basePrice" DECIMAL(10,2),
  ADD COLUMN "discountPercent" DECIMAL(5,2),
  ADD COLUMN "finalPrice" DECIMAL(10,2),
  ADD COLUMN "internalNotes" TEXT,
  ADD COLUMN "clientNotes" TEXT,
  ADD COLUMN "calendlyEventUri" TEXT,
  ADD COLUMN "calendlyInviteeUri" TEXT,
  ADD COLUMN "calendlyUrl" TEXT,
  ADD COLUMN "scheduledAt" TIMESTAMP(3),
  ADD COLUMN "clientAccessToken" TEXT;

CREATE UNIQUE INDEX "workshop_requests_clientAccessToken_key" ON "public"."workshop_requests"("clientAccessToken");
CREATE INDEX "workshop_requests_clientId_idx" ON "public"."workshop_requests"("clientId");
CREATE INDEX "workshop_requests_clientAccessToken_idx" ON "public"."workshop_requests"("clientAccessToken");

ALTER TABLE "public"."workshop_requests" DROP CONSTRAINT "workshop_requests_organizationId_fkey";
ALTER TABLE "public"."workshop_requests"
  ADD CONSTRAINT "workshop_requests_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."workshop_requests"
  ADD CONSTRAINT "workshop_requests_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
