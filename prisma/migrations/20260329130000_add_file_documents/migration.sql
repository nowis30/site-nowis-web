-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "FileVisibility" AS ENUM ('ADMIN_ONLY', 'CLIENT_VISIBLE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "file_documents" (
    "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
    "contactId"        UUID,
    "songRequestId"    UUID,
    "uploadedByUserId" UUID,
    "filename"         TEXT NOT NULL,
    "originalName"     TEXT NOT NULL,
    "mimeType"         TEXT NOT NULL,
    "size"             INTEGER NOT NULL,
    "storageKey"       TEXT NOT NULL,
    "url"              TEXT NOT NULL,
    "category"         TEXT NOT NULL,
    "visibility"       "FileVisibility" NOT NULL DEFAULT 'CLIENT_VISIBLE',
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "file_documents_storageKey_key" ON "file_documents"("storageKey");
CREATE INDEX IF NOT EXISTS "file_documents_contactId_idx" ON "file_documents"("contactId");
CREATE INDEX IF NOT EXISTS "file_documents_songRequestId_idx" ON "file_documents"("songRequestId");
CREATE INDEX IF NOT EXISTS "file_documents_visibility_idx" ON "file_documents"("visibility");
CREATE INDEX IF NOT EXISTS "file_documents_createdAt_idx" ON "file_documents"("createdAt");

-- AddForeignKey
ALTER TABLE "file_documents" ADD CONSTRAINT "file_documents_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "file_documents" ADD CONSTRAINT "file_documents_songRequestId_fkey"
  FOREIGN KEY ("songRequestId") REFERENCES "song_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "file_documents" ADD CONSTRAINT "file_documents_uploadedByUserId_fkey"
  FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
