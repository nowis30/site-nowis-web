ALTER TABLE "communications"
ADD COLUMN "handledAt" TIMESTAMP(3),
ADD COLUMN "handledById" UUID;

ALTER TABLE "communications"
ADD CONSTRAINT "communications_handledById_fkey"
FOREIGN KEY ("handledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "communications_handledAt_idx" ON "communications"("handledAt");
CREATE INDEX "communications_handledById_idx" ON "communications"("handledById");