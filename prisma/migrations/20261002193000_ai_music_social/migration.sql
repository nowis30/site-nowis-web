ALTER TABLE "ai_music_shares"
  ADD COLUMN "artistProfileId" UUID,
  ADD COLUMN "coverUrl" TEXT;

CREATE TABLE "ai_artist_profiles" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "bio" TEXT,
  "avatarUrl" TEXT,
  "bannerUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_artist_profiles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_artist_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ai_artist_profiles_userId_key" ON "ai_artist_profiles"("userId");
CREATE UNIQUE INDEX "ai_artist_profiles_slug_key" ON "ai_artist_profiles"("slug");
CREATE INDEX "ai_artist_profiles_displayName_idx" ON "ai_artist_profiles"("displayName");

ALTER TABLE "ai_music_shares"
  ADD CONSTRAINT "ai_music_shares_artistProfileId_fkey"
  FOREIGN KEY ("artistProfileId") REFERENCES "ai_artist_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ai_music_shares_artistProfileId_createdAt_idx" ON "ai_music_shares"("artistProfileId", "createdAt");

CREATE TABLE "ai_music_likes" (
  "shareId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_music_likes_pkey" PRIMARY KEY ("shareId","userId"),
  CONSTRAINT "ai_music_likes_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "ai_music_shares"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ai_music_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ai_music_likes_userId_createdAt_idx" ON "ai_music_likes"("userId", "createdAt");

CREATE TABLE "ai_music_comments" (
  "id" UUID NOT NULL,
  "shareId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "displayName" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_music_comments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_music_comments_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "ai_music_shares"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ai_music_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ai_music_comments_shareId_createdAt_idx" ON "ai_music_comments"("shareId", "createdAt");
CREATE INDEX "ai_music_comments_userId_createdAt_idx" ON "ai_music_comments"("userId", "createdAt");
