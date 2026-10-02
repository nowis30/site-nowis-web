CREATE TABLE "ai_music_shares" (
    "id" UUID NOT NULL,
    "artistName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "aiTool" TEXT NOT NULL,
    "genre" TEXT,
    "listenUrl" TEXT NOT NULL,
    "description" TEXT,
    "rightsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_music_shares_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_music_shares_isPublished_createdAt_idx"
    ON "ai_music_shares"("isPublished", "createdAt");

CREATE INDEX "ai_music_shares_aiTool_idx"
    ON "ai_music_shares"("aiTool");
