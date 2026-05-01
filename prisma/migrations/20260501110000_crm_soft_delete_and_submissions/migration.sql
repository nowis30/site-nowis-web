-- Extend enums for soft-delete/archive workflows
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'DELETED';
ALTER TYPE "SongRequestStatus" ADD VALUE IF NOT EXISTS 'DELETED';
ALTER TYPE "WorkshopRequestStatus" ADD VALUE IF NOT EXISTS 'DELETED';

-- New enum dedicated to CRM submissions triage
CREATE TYPE "SubmissionStatus" AS ENUM ('NOUVEAU', 'LU', 'TRAITE', 'ARCHIVE', 'SUPPRIME');

-- Contacts: soft-delete + lifecycle state
ALTER TABLE "contacts"
  ADD COLUMN "crmStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "deletedBy" UUID,
  ADD COLUMN "deleteReason" TEXT;

CREATE INDEX "contacts_crmStatus_idx" ON "contacts"("crmStatus");
CREATE INDEX "contacts_deletedAt_idx" ON "contacts"("deletedAt");

-- Organizations: soft-delete + lifecycle state
ALTER TABLE "organizations"
  ADD COLUMN "crmStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "deletedBy" UUID,
  ADD COLUMN "deleteReason" TEXT;

CREATE INDEX "organizations_crmStatus_idx" ON "organizations"("crmStatus");
CREATE INDEX "organizations_deletedAt_idx" ON "organizations"("deletedAt");

-- Workshop requests: keep status enum and add explicit metadata
ALTER TABLE "workshop_requests"
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "deletedBy" UUID,
  ADD COLUMN "deleteReason" TEXT;

CREATE INDEX "workshop_requests_deletedAt_idx" ON "workshop_requests"("deletedAt");

-- Song requests: add explicit metadata
ALTER TABLE "song_requests"
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "deletedBy" UUID,
  ADD COLUMN "deleteReason" TEXT;

CREATE INDEX "song_requests_deletedAt_idx" ON "song_requests"("deletedAt");

-- Invoices: add explicit metadata
ALTER TABLE "invoices"
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "deletedBy" UUID,
  ADD COLUMN "deleteReason" TEXT;

CREATE INDEX "invoices_deletedAt_idx" ON "invoices"("deletedAt");

-- Inquiries (CRM submissions): dedicated status + soft-delete metadata
ALTER TABLE "inquiries"
  ADD COLUMN "submissionStatus" "SubmissionStatus" NOT NULL DEFAULT 'NOUVEAU',
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "deletedBy" UUID,
  ADD COLUMN "deleteReason" TEXT;

CREATE INDEX "inquiries_submissionStatus_idx" ON "inquiries"("submissionStatus");
CREATE INDEX "inquiries_deletedAt_idx" ON "inquiries"("deletedAt");

-- Activities: explicit links to related resources
ALTER TABLE "activities"
  ADD COLUMN "relatedType" TEXT,
  ADD COLUMN "relatedId" UUID,
  ADD COLUMN "relatedUrl" TEXT;

CREATE INDEX "activities_relatedType_relatedId_idx" ON "activities"("relatedType", "relatedId");
