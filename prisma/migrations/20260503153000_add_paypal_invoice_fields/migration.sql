ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "paypalInvoiceId" TEXT;
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "paypalInvoiceUrl" TEXT;
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "paypalStatus" TEXT;
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "paypalSentAt" TIMESTAMP(3);
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "paypalPaidAt" TIMESTAMP(3);
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "paypalLastWebhookAt" TIMESTAMP(3);
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "paymentProvider" TEXT;
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT;
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "paymentAmount" DECIMAL(10,2);
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "paymentCurrency" TEXT DEFAULT 'CAD';

CREATE INDEX IF NOT EXISTS "invoices_paypalInvoiceId_idx" ON "public"."invoices"("paypalInvoiceId");
CREATE INDEX IF NOT EXISTS "invoices_paymentStatus_idx" ON "public"."invoices"("paymentStatus");
