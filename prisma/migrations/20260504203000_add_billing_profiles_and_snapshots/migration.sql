CREATE TABLE IF NOT EXISTS "public"."billing_profiles" (
  "id" UUID NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "displayName" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "legalLabel" TEXT,
  "tradeName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "website" TEXT,
  "addressLine1" TEXT,
  "addressLine2" TEXT,
  "city" TEXT,
  "state" TEXT,
  "postalCode" TEXT,
  "country" TEXT DEFAULT 'Canada',
  "taxId" TEXT,
  "paymentTerms" TEXT,
  "footerNote" TEXT,
  "taxesEnabled" BOOLEAN NOT NULL DEFAULT true,
  "taxRateGst" DECIMAL(6,5) DEFAULT 0.05,
  "taxRateQst" DECIMAL(6,5) DEFAULT 0.09975,
  "currency" TEXT NOT NULL DEFAULT 'CAD',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "billing_profiles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "billing_profiles_isActive_updatedAt_idx"
  ON "public"."billing_profiles"("isActive", "updatedAt");

ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "billingCompanyName" TEXT;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "billingLegalName" TEXT;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "billingEmail" TEXT;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "billingPhone" TEXT;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "billingAddressLine1" TEXT;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "billingAddressLine2" TEXT;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "billingCity" TEXT;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "billingState" TEXT;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "billingPostalCode" TEXT;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "billingCountry" TEXT;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "billingTaxId" TEXT;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "billingNotes" TEXT;

ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "billingCompanyName" TEXT;
ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "billingLegalName" TEXT;
ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "billingEmail" TEXT;
ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "billingPhone" TEXT;
ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "billingAddressLine1" TEXT;
ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "billingAddressLine2" TEXT;
ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "billingCity" TEXT;
ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "billingState" TEXT;
ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "billingPostalCode" TEXT;
ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "billingCountry" TEXT;
ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "billingTaxId" TEXT;
ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "billingNotes" TEXT;

ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(10,2);
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(10,2);
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "totalAmount" DECIMAL(10,2);
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "issuerSnapshot" JSONB;
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "customerSnapshot" JSONB;
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "taxesEnabled" BOOLEAN DEFAULT true;
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "taxRateGst" DECIMAL(6,5);
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "taxRateQst" DECIMAL(6,5);

ALTER TABLE "public"."commercial_quotes" ADD COLUMN IF NOT EXISTS "issuerSnapshot" JSONB;
ALTER TABLE "public"."commercial_quotes" ADD COLUMN IF NOT EXISTS "customerSnapshot" JSONB;
ALTER TABLE "public"."commercial_quotes" ADD COLUMN IF NOT EXISTS "taxesEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "public"."commercial_quotes" ADD COLUMN IF NOT EXISTS "taxRateGst" DECIMAL(6,5);
ALTER TABLE "public"."commercial_quotes" ADD COLUMN IF NOT EXISTS "taxRateQst" DECIMAL(6,5);
