ALTER TABLE "public"."users"
ADD COLUMN "contactId" UUID;

CREATE UNIQUE INDEX "users_contactId_key" ON "public"."users"("contactId");

ALTER TABLE "public"."users"
ADD CONSTRAINT "users_contactId_fkey"
FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
