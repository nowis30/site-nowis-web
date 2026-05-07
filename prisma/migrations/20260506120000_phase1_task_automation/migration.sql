-- Phase 1: CRM task automation engine + workshop-linked document field

-- Extend task status enum
ALTER TYPE "public"."TaskStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- Extend task type enum (legacy values kept)
ALTER TYPE "public"."TaskType" ADD VALUE IF NOT EXISTS 'CALLBACK';
ALTER TYPE "public"."TaskType" ADD VALUE IF NOT EXISTS 'CREATE_QUOTE';
ALTER TYPE "public"."TaskType" ADD VALUE IF NOT EXISTS 'CREATE_INVOICE';
ALTER TYPE "public"."TaskType" ADD VALUE IF NOT EXISTS 'CREATE_SONG';
ALTER TYPE "public"."TaskType" ADD VALUE IF NOT EXISTS 'UPLOAD_SONG_FILE';
ALTER TYPE "public"."TaskType" ADD VALUE IF NOT EXISTS 'SCHEDULE_WORKSHOP';
ALTER TYPE "public"."TaskType" ADD VALUE IF NOT EXISTS 'DOCUMENT_REVIEW';
ALTER TYPE "public"."TaskType" ADD VALUE IF NOT EXISTS 'CUSTOM';

-- Extend task model
ALTER TABLE "public"."tasks"
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "isAutoCreated" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "organizationId" UUID,
  ADD COLUMN IF NOT EXISTS "workshopRequestId" UUID,
  ADD COLUMN IF NOT EXISTS "commercialQuoteId" UUID,
  ADD COLUMN IF NOT EXISTS "invoiceId" UUID,
  ADD COLUMN IF NOT EXISTS "appointmentId" UUID;

-- Extend file documents to support workshop-scoped files
ALTER TABLE "public"."file_documents"
  ADD COLUMN IF NOT EXISTS "workshopRequestId" UUID;

-- Indexes for task lookup and idempotent checks
CREATE INDEX IF NOT EXISTS "tasks_organizationId_idx" ON "public"."tasks"("organizationId");
CREATE INDEX IF NOT EXISTS "tasks_workshopRequestId_idx" ON "public"."tasks"("workshopRequestId");
CREATE INDEX IF NOT EXISTS "tasks_commercialQuoteId_idx" ON "public"."tasks"("commercialQuoteId");
CREATE INDEX IF NOT EXISTS "tasks_invoiceId_idx" ON "public"."tasks"("invoiceId");
CREATE INDEX IF NOT EXISTS "tasks_appointmentId_idx" ON "public"."tasks"("appointmentId");
CREATE INDEX IF NOT EXISTS "tasks_status_type_idx" ON "public"."tasks"("status", "type");
CREATE INDEX IF NOT EXISTS "file_documents_workshopRequestId_idx" ON "public"."file_documents"("workshopRequestId");

-- Foreign keys
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_organizationId_fkey') THEN
    ALTER TABLE "public"."tasks"
      ADD CONSTRAINT "tasks_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_workshopRequestId_fkey') THEN
    ALTER TABLE "public"."tasks"
      ADD CONSTRAINT "tasks_workshopRequestId_fkey"
      FOREIGN KEY ("workshopRequestId") REFERENCES "public"."workshop_requests"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_commercialQuoteId_fkey') THEN
    ALTER TABLE "public"."tasks"
      ADD CONSTRAINT "tasks_commercialQuoteId_fkey"
      FOREIGN KEY ("commercialQuoteId") REFERENCES "public"."commercial_quotes"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_invoiceId_fkey') THEN
    ALTER TABLE "public"."tasks"
      ADD CONSTRAINT "tasks_invoiceId_fkey"
      FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_appointmentId_fkey') THEN
    ALTER TABLE "public"."tasks"
      ADD CONSTRAINT "tasks_appointmentId_fkey"
      FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'file_documents_workshopRequestId_fkey') THEN
    ALTER TABLE "public"."file_documents"
      ADD CONSTRAINT "file_documents_workshopRequestId_fkey"
      FOREIGN KEY ("workshopRequestId") REFERENCES "public"."workshop_requests"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
