-- CreateEnum
CREATE TYPE "public"."SongRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "public"."ActivityType" ADD VALUE 'FORM_SUBMISSION';

-- AlterEnum
ALTER TYPE "public"."LinkedType" ADD VALUE 'SONG_REQUEST';

-- AlterTable
ALTER TABLE "public"."activities" ADD COLUMN     "songRequestId" UUID;

-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "songRequestId" UUID;

-- CreateTable
CREATE TABLE "public"."song_requests" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "songType" TEXT NOT NULL,
    "occasion" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "budget" DECIMAL(10,2),
    "desiredDeadline" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'website',
    "status" "public"."SongRequestStatus" NOT NULL DEFAULT 'NEW',
    "convertedAppointmentId" UUID,
    "convertedInvoiceId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "song_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "song_requests_contactId_idx" ON "public"."song_requests"("contactId");

-- CreateIndex
CREATE INDEX "song_requests_email_idx" ON "public"."song_requests"("email");

-- CreateIndex
CREATE INDEX "song_requests_status_idx" ON "public"."song_requests"("status");

-- CreateIndex
CREATE INDEX "song_requests_createdAt_idx" ON "public"."song_requests"("createdAt");

-- CreateIndex
CREATE INDEX "activities_songRequestId_idx" ON "public"."activities"("songRequestId");

-- CreateIndex
CREATE INDEX "tasks_songRequestId_idx" ON "public"."tasks"("songRequestId");

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_songRequestId_fkey" FOREIGN KEY ("songRequestId") REFERENCES "public"."song_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_songRequestId_fkey" FOREIGN KEY ("songRequestId") REFERENCES "public"."song_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."song_requests" ADD CONSTRAINT "song_requests_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
