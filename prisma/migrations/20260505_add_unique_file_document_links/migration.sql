-- Add unique partial indexes to prevent duplicate FileDocuments for quotes and invoices
-- Only enforces uniqueness for non-null values to allow multiple orphaned records if needed

CREATE UNIQUE INDEX IF NOT EXISTS "file_documents_commercialQuoteId_key" 
ON "public"."file_documents"("commercialQuoteId") 
WHERE "commercialQuoteId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "file_documents_invoiceId_key" 
ON "public"."file_documents"("invoiceId") 
WHERE "invoiceId" IS NOT NULL;

-- Optional: Clean up any accidental duplicates (keep first created, delete others)
-- This is non-destructive: only affects documents with multiple entries for same quote/invoice
DELETE FROM "public"."file_documents" fd1
WHERE EXISTS (
  SELECT 1 FROM "public"."file_documents" fd2
  WHERE fd2.id < fd1.id
  AND (
    (fd1."commercialQuoteId" IS NOT NULL AND fd2."commercialQuoteId" = fd1."commercialQuoteId")
    OR
    (fd1."invoiceId" IS NOT NULL AND fd2."invoiceId" = fd1."invoiceId")
  )
);
