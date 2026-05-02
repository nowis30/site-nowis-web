-- CreateEnum
CREATE TYPE "PublicCommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public_comments" (
    "id" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "rating" INTEGER,
    "status" "PublicCommentStatus" NOT NULL DEFAULT 'PENDING',
    "sourcePage" TEXT NOT NULL DEFAULT '/',
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_comments_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "public_comments_status_createdAt_idx" ON "public_comments"("status", "createdAt");
CREATE INDEX "public_comments_sourcePage_status_idx" ON "public_comments"("sourcePage", "status");
CREATE INDEX "public_comments_approvedAt_idx" ON "public_comments"("approvedAt");
