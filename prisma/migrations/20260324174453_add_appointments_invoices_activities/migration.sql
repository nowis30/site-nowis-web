-- CreateEnum
CREATE TYPE "public"."AppointmentType" AS ENUM ('VISIT', 'CALL', 'FOLLOWUP', 'MEETING', 'INSPECTION', 'DEADLINE', 'REMINDER');

-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'DONE');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('NOTE', 'CALL', 'MESSAGE', 'EMAIL', 'APPOINTMENT', 'INVOICE', 'PAYMENT', 'FORM', 'FILE', 'TASK');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."LinkedType" ADD VALUE 'APPOINTMENT';
ALTER TYPE "public"."LinkedType" ADD VALUE 'INVOICE';
ALTER TYPE "public"."LinkedType" ADD VALUE 'ACTIVITY';

-- CreateTable
CREATE TABLE "public"."appointments" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "type" "public"."AppointmentType" NOT NULL DEFAULT 'MEETING',
    "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "contactId" UUID,
    "propertyId" UUID,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "contactId" UUID NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activities" (
    "id" UUID NOT NULL,
    "type" "public"."ActivityType" NOT NULL DEFAULT 'NOTE',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contactId" UUID,
    "propertyId" UUID,
    "appointmentId" UUID,
    "invoiceId" UUID,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointments_contactId_idx" ON "public"."appointments"("contactId");

-- CreateIndex
CREATE INDEX "appointments_startAt_idx" ON "public"."appointments"("startAt");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "public"."invoices"("number");

-- CreateIndex
CREATE INDEX "invoices_contactId_idx" ON "public"."invoices"("contactId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "public"."invoices"("status");

-- CreateIndex
CREATE INDEX "activities_contactId_idx" ON "public"."activities"("contactId");

-- CreateIndex
CREATE INDEX "activities_createdAt_idx" ON "public"."activities"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
