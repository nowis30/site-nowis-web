-- CreateTable
CREATE TABLE "public"."outbound_emails" (
    "id" UUID NOT NULL,
    "trackingToken" TEXT NOT NULL,
    "contactId" UUID NOT NULL,
    "createdById" UUID,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "messagePreview" TEXT NOT NULL,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "sendError" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbound_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "outbound_emails_trackingToken_key" ON "public"."outbound_emails"("trackingToken");

-- CreateIndex
CREATE INDEX "outbound_emails_contactId_idx" ON "public"."outbound_emails"("contactId");

-- CreateIndex
CREATE INDEX "outbound_emails_openedAt_idx" ON "public"."outbound_emails"("openedAt");

-- CreateIndex
CREATE INDEX "outbound_emails_sentAt_idx" ON "public"."outbound_emails"("sentAt");

-- AddForeignKey
ALTER TABLE "public"."outbound_emails" ADD CONSTRAINT "outbound_emails_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."outbound_emails" ADD CONSTRAINT "outbound_emails_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
