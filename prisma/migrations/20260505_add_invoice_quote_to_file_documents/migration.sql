-- Add invoiceId and commercialQuoteId columns to FileDocument table
ALTER TABLE "public"."file_documents" ADD COLUMN IF NOT EXISTS "invoiceId" UUID;
ALTER TABLE "public"."file_documents" ADD COLUMN IF NOT EXISTS "commercialQuoteId" UUID;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "file_documents_invoiceId_idx" ON "public"."file_documents"("invoiceId");
CREATE INDEX IF NOT EXISTS "file_documents_commercialQuoteId_idx" ON "public"."file_documents"("commercialQuoteId");

-- Add foreign key constraints (optional but recommended)
-- Note: If the Invoice and CommercialQuote tables don't have CASCADE delete, adjust as needed
ALTER TABLE "public"."file_documents" 
ADD CONSTRAINT "file_documents_invoiceId_fkey" 
FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."file_documents" 
ADD CONSTRAINT "file_documents_commercialQuoteId_fkey" 
FOREIGN KEY ("commercialQuoteId") REFERENCES "public"."commercial_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
