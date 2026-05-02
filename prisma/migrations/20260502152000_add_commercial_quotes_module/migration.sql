-- Non-destructive migration: add dedicated CRM commercial quotes module.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommercialQuoteStatus') THEN
    CREATE TYPE "CommercialQuoteStatus" AS ENUM (
      'DRAFT',
      'SENT',
      'ACCEPTED',
      'DECLINED',
      'EXPIRED',
      'CONVERTED',
      'ARCHIVED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "commercial_quotes" (
  "id" UUID NOT NULL,
  "quoteNumber" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "contactId" UUID,
  "organizationId" UUID,
  "workshopRequestId" UUID,
  "songRequestId" UUID,
  "appointmentId" UUID,
  "status" "CommercialQuoteStatus" NOT NULL DEFAULT 'DRAFT',
  "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'CAD',
  "validUntil" TIMESTAMP(3),
  "notes" TEXT,
  "internalNotes" TEXT,
  "acceptedAt" TIMESTAMP(3),
  "declinedAt" TIMESTAMP(3),
  "convertedToInvoiceId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commercial_quotes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "commercial_quote_lines" (
  "id" UUID NOT NULL,
  "quoteId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "taxable" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commercial_quote_lines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "commercial_quotes_quoteNumber_key" ON "commercial_quotes"("quoteNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "commercial_quotes_convertedToInvoiceId_key" ON "commercial_quotes"("convertedToInvoiceId");
CREATE INDEX IF NOT EXISTS "commercial_quotes_contactId_idx" ON "commercial_quotes"("contactId");
CREATE INDEX IF NOT EXISTS "commercial_quotes_organizationId_idx" ON "commercial_quotes"("organizationId");
CREATE INDEX IF NOT EXISTS "commercial_quotes_workshopRequestId_idx" ON "commercial_quotes"("workshopRequestId");
CREATE INDEX IF NOT EXISTS "commercial_quotes_songRequestId_idx" ON "commercial_quotes"("songRequestId");
CREATE INDEX IF NOT EXISTS "commercial_quotes_appointmentId_idx" ON "commercial_quotes"("appointmentId");
CREATE INDEX IF NOT EXISTS "commercial_quotes_status_idx" ON "commercial_quotes"("status");
CREATE INDEX IF NOT EXISTS "commercial_quotes_createdAt_idx" ON "commercial_quotes"("createdAt");
CREATE INDEX IF NOT EXISTS "commercial_quote_lines_quoteId_sortOrder_idx" ON "commercial_quote_lines"("quoteId", "sortOrder");

DO $$ BEGIN
  ALTER TABLE "commercial_quotes"
    ADD CONSTRAINT "commercial_quotes_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "contacts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "commercial_quotes"
    ADD CONSTRAINT "commercial_quotes_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "commercial_quotes"
    ADD CONSTRAINT "commercial_quotes_workshopRequestId_fkey"
    FOREIGN KEY ("workshopRequestId") REFERENCES "workshop_requests"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "commercial_quotes"
    ADD CONSTRAINT "commercial_quotes_songRequestId_fkey"
    FOREIGN KEY ("songRequestId") REFERENCES "song_requests"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "commercial_quotes"
    ADD CONSTRAINT "commercial_quotes_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "commercial_quotes"
    ADD CONSTRAINT "commercial_quotes_convertedToInvoiceId_fkey"
    FOREIGN KEY ("convertedToInvoiceId") REFERENCES "invoices"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "commercial_quote_lines"
    ADD CONSTRAINT "commercial_quote_lines_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "commercial_quotes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
