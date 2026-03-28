-- CreateEnum
CREATE TYPE "public"."OrganizationType" AS ENUM ('SCHOOL', 'COMMUNITY_ORG', 'DAYCARE', 'CAMP', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."OrganizationStatus" AS ENUM ('ACTIVE', 'LEAD', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."WorkshopAudienceType" AS ENUM ('PRESCHOOL', 'ELEMENTARY', 'TEENS', 'MIXED');

-- CreateEnum
CREATE TYPE "public"."WorkshopFormat" AS ENUM ('IN_PERSON', 'VIRTUAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "public"."WorkshopRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."WorkshopAppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'DONE');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'LinkedType' AND e.enumlabel = 'ORGANIZATION'
  ) THEN
    ALTER TYPE "public"."LinkedType" ADD VALUE 'ORGANIZATION';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'LinkedType' AND e.enumlabel = 'WORKSHOP_REQUEST'
  ) THEN
    ALTER TYPE "public"."LinkedType" ADD VALUE 'WORKSHOP_REQUEST';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'LinkedType' AND e.enumlabel = 'WORKSHOP_APPOINTMENT'
  ) THEN
    ALTER TYPE "public"."LinkedType" ADD VALUE 'WORKSHOP_APPOINTMENT';
  END IF;
END $$;

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."OrganizationType" NOT NULL DEFAULT 'OTHER',
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "notes" TEXT,
    "status" "public"."OrganizationStatus" NOT NULL DEFAULT 'LEAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organization_contacts" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "contactId" UUID,
    "fullName" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workshop_requests" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "contactId" UUID,
    "organizationContactId" UUID,
    "title" TEXT NOT NULL,
    "audienceType" "public"."WorkshopAudienceType" NOT NULL DEFAULT 'MIXED',
    "ageRange" TEXT,
    "estimatedParticipants" INTEGER,
    "requestedDate" TIMESTAMP(3),
    "requestedTime" TEXT,
    "preferredDays" TEXT[],
    "format" "public"."WorkshopFormat" NOT NULL DEFAULT 'IN_PERSON',
    "location" TEXT,
    "workshopTheme" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "notes" TEXT,
    "status" "public"."WorkshopRequestStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workshop_availabilities" (
    "id" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workshop_appointments" (
    "id" UUID NOT NULL,
    "workshopRequestId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "contactId" UUID,
    "organizationContactId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."WorkshopAppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizations_name_idx" ON "public"."organizations"("name");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "public"."organizations"("status");

-- CreateIndex
CREATE INDEX "organization_contacts_organizationId_idx" ON "public"."organization_contacts"("organizationId");

-- CreateIndex
CREATE INDEX "organization_contacts_contactId_idx" ON "public"."organization_contacts"("contactId");

-- CreateIndex
CREATE INDEX "workshop_requests_organizationId_idx" ON "public"."workshop_requests"("organizationId");

-- CreateIndex
CREATE INDEX "workshop_requests_contactId_idx" ON "public"."workshop_requests"("contactId");

-- CreateIndex
CREATE INDEX "workshop_requests_status_idx" ON "public"."workshop_requests"("status");

-- CreateIndex
CREATE INDEX "workshop_availabilities_weekday_isActive_idx" ON "public"."workshop_availabilities"("weekday", "isActive");

-- CreateIndex
CREATE INDEX "workshop_appointments_workshopRequestId_idx" ON "public"."workshop_appointments"("workshopRequestId");

-- CreateIndex
CREATE INDEX "workshop_appointments_organizationId_idx" ON "public"."workshop_appointments"("organizationId");

-- CreateIndex
CREATE INDEX "workshop_appointments_contactId_idx" ON "public"."workshop_appointments"("contactId");

-- CreateIndex
CREATE INDEX "workshop_appointments_startAt_idx" ON "public"."workshop_appointments"("startAt");

-- AddForeignKey
ALTER TABLE "public"."organization_contacts" ADD CONSTRAINT "organization_contacts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_contacts" ADD CONSTRAINT "organization_contacts_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workshop_requests" ADD CONSTRAINT "workshop_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workshop_requests" ADD CONSTRAINT "workshop_requests_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workshop_requests" ADD CONSTRAINT "workshop_requests_organizationContactId_fkey" FOREIGN KEY ("organizationContactId") REFERENCES "public"."organization_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workshop_appointments" ADD CONSTRAINT "workshop_appointments_workshopRequestId_fkey" FOREIGN KEY ("workshopRequestId") REFERENCES "public"."workshop_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workshop_appointments" ADD CONSTRAINT "workshop_appointments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workshop_appointments" ADD CONSTRAINT "workshop_appointments_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workshop_appointments" ADD CONSTRAINT "workshop_appointments_organizationContactId_fkey" FOREIGN KEY ("organizationContactId") REFERENCES "public"."organization_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;