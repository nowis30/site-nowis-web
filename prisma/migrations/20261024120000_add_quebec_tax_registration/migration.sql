ALTER TABLE "public"."billing_profiles" ADD COLUMN IF NOT EXISTS "neq" TEXT;
ALTER TABLE "public"."billing_profiles" ADD COLUMN IF NOT EXISTS "gstNumber" TEXT;
ALTER TABLE "public"."billing_profiles" ADD COLUMN IF NOT EXISTS "qstNumber" TEXT;
