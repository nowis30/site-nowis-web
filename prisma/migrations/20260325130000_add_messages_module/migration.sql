CREATE TYPE "MessageSenderType" AS ENUM ('ADMIN', 'CLIENT');

CREATE TABLE "messages" (
  "id" UUID NOT NULL,
  "contactId" UUID NOT NULL,
  "senderType" "MessageSenderType" NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isRead" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "messages"
ADD CONSTRAINT "messages_contactId_fkey"
FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "messages_contactId_createdAt_idx" ON "messages"("contactId", "createdAt");
CREATE INDEX "messages_contactId_senderType_isRead_idx" ON "messages"("contactId", "senderType", "isRead");
