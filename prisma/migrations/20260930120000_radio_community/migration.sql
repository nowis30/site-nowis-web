ALTER TABLE "public_comments" ADD COLUMN "radioTrackId" TEXT;
CREATE INDEX "public_comments_sourcePage_status_createdAt_id_idx" ON "public_comments"("sourcePage", "status", "createdAt", "id");
CREATE TABLE "radio_favorites" (
  "userId" UUID NOT NULL,
  "trackId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "radio_favorites_pkey" PRIMARY KEY ("userId", "trackId"),
  CONSTRAINT "radio_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "radio_favorites_userId_createdAt_idx" ON "radio_favorites"("userId", "createdAt");
