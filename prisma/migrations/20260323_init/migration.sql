-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'ASSISTANT', 'TENANT');

-- CreateEnum
CREATE TYPE "public"."ContactType" AS ENUM ('PROSPECT', 'CLIENT', 'PARTENAIRE', 'PROPRIETAIRE', 'LOCATAIRE_PROSPECT');

-- CreateEnum
CREATE TYPE "public"."InquiryStatus" AS ENUM ('NEW', 'QUALIFIED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."CaseType" AS ENUM ('CLIENT', 'LOCATION', 'SUPPORT', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "public"."CaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'ON_HOLD', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "public"."TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "public"."PropertyType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'MIXED');

-- CreateEnum
CREATE TYPE "public"."UnitStatus" AS ENUM ('VACANT', 'OCCUPIED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "public"."LeaseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'LATE', 'PARTIAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."MaintenanceStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."CommunicationDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "public"."LinkedType" AS ENUM ('CONTACT', 'INQUIRY', 'CASE', 'PROPERTY', 'UNIT', 'TENANT', 'LEASE', 'PAYMENT', 'MAINTENANCE_TICKET');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'ASSISTANT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contacts" (
    "id" UUID NOT NULL,
    "type" "public"."ContactType" NOT NULL,
    "fullName" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "preferredLocale" TEXT DEFAULT 'fr-CA',
    "source" TEXT,
    "tags" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inquiries" (
    "id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT,
    "status" "public"."InquiryStatus" NOT NULL DEFAULT 'NEW',
    "contactId" UUID,
    "caseId" UUID,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cases" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."CaseType" NOT NULL,
    "status" "public"."CaseStatus" NOT NULL DEFAULT 'OPEN',
    "contactId" UUID,
    "ownerUserId" UUID,
    "referenceCode" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."case_notes" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "authorUserId" UUID,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tasks" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "public"."TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "caseId" UUID,
    "assignedToId" UUID,
    "createdById" UUID,
    "linkedType" "public"."LinkedType",
    "linkedId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "linkedType" "public"."LinkedType" NOT NULL,
    "linkedId" UUID NOT NULL,
    "uploadedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."properties" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."PropertyType" NOT NULL DEFAULT 'RESIDENTIAL',
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'CA',
    "totalUnits" INTEGER NOT NULL DEFAULT 0,
    "yearBuilt" INTEGER,
    "managerName" TEXT,
    "managerPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."units" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "floor" TEXT,
    "bedrooms" INTEGER NOT NULL DEFAULT 1,
    "bathrooms" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "areaSqft" INTEGER,
    "monthlyRent" DECIMAL(10,2),
    "status" "public"."UnitStatus" NOT NULL DEFAULT 'VACANT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tenants" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "unitId" UUID,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "moveInDate" TIMESTAMP(3),
    "moveOutDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leases" (
    "id" UUID NOT NULL,
    "leaseNumber" TEXT NOT NULL,
    "tenantId" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "rentAmount" DECIMAL(10,2) NOT NULL,
    "securityDeposit" DECIMAL(10,2),
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "status" "public"."LeaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" UUID NOT NULL,
    "leaseId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "method" TEXT,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maintenance_tickets" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "unitId" UUID,
    "tenantId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "public"."MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."MaintenanceStatus" NOT NULL DEFAULT 'OPEN',
    "reportedByUserId" UUID,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maintenance_updates" (
    "id" UUID NOT NULL,
    "maintenanceTicketId" UUID NOT NULL,
    "authorUserId" UUID,
    "message" TEXT NOT NULL,
    "status" "public"."MaintenanceStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."communications" (
    "id" UUID NOT NULL,
    "contactId" UUID,
    "tenantId" UUID,
    "userId" UUID,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "direction" "public"."CommunicationDirection" NOT NULL,
    "linkedType" "public"."LinkedType" NOT NULL,
    "linkedId" UUID NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "contacts_type_idx" ON "public"."contacts"("type");

-- CreateIndex
CREATE INDEX "contacts_fullName_idx" ON "public"."contacts"("fullName");

-- CreateIndex
CREATE INDEX "inquiries_contactId_idx" ON "public"."inquiries"("contactId");

-- CreateIndex
CREATE INDEX "inquiries_caseId_idx" ON "public"."inquiries"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "cases_referenceCode_key" ON "public"."cases"("referenceCode");

-- CreateIndex
CREATE INDEX "cases_type_status_idx" ON "public"."cases"("type", "status");

-- CreateIndex
CREATE INDEX "cases_contactId_idx" ON "public"."cases"("contactId");

-- CreateIndex
CREATE INDEX "case_notes_caseId_idx" ON "public"."case_notes"("caseId");

-- CreateIndex
CREATE INDEX "tasks_caseId_idx" ON "public"."tasks"("caseId");

-- CreateIndex
CREATE INDEX "tasks_linkedType_linkedId_idx" ON "public"."tasks"("linkedType", "linkedId");

-- CreateIndex
CREATE INDEX "documents_linkedType_linkedId_idx" ON "public"."documents"("linkedType", "linkedId");

-- CreateIndex
CREATE UNIQUE INDEX "properties_code_key" ON "public"."properties"("code");

-- CreateIndex
CREATE INDEX "properties_name_idx" ON "public"."properties"("name");

-- CreateIndex
CREATE INDEX "units_propertyId_idx" ON "public"."units"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "units_propertyId_unitNumber_key" ON "public"."units"("propertyId", "unitNumber");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_contactId_key" ON "public"."tenants"("contactId");

-- CreateIndex
CREATE INDEX "tenants_unitId_idx" ON "public"."tenants"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "leases_leaseNumber_key" ON "public"."leases"("leaseNumber");

-- CreateIndex
CREATE INDEX "leases_tenantId_idx" ON "public"."leases"("tenantId");

-- CreateIndex
CREATE INDEX "leases_unitId_idx" ON "public"."leases"("unitId");

-- CreateIndex
CREATE INDEX "payments_leaseId_idx" ON "public"."payments"("leaseId");

-- CreateIndex
CREATE INDEX "payments_tenantId_idx" ON "public"."payments"("tenantId");

-- CreateIndex
CREATE INDEX "payments_unitId_idx" ON "public"."payments"("unitId");

-- CreateIndex
CREATE INDEX "maintenance_tickets_propertyId_idx" ON "public"."maintenance_tickets"("propertyId");

-- CreateIndex
CREATE INDEX "maintenance_tickets_unitId_idx" ON "public"."maintenance_tickets"("unitId");

-- CreateIndex
CREATE INDEX "maintenance_tickets_tenantId_idx" ON "public"."maintenance_tickets"("tenantId");

-- CreateIndex
CREATE INDEX "maintenance_updates_maintenanceTicketId_idx" ON "public"."maintenance_updates"("maintenanceTicketId");

-- CreateIndex
CREATE INDEX "communications_contactId_idx" ON "public"."communications"("contactId");

-- CreateIndex
CREATE INDEX "communications_tenantId_idx" ON "public"."communications"("tenantId");

-- CreateIndex
CREATE INDEX "communications_linkedType_linkedId_idx" ON "public"."communications"("linkedType", "linkedId");

-- AddForeignKey
ALTER TABLE "public"."inquiries" ADD CONSTRAINT "inquiries_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inquiries" ADD CONSTRAINT "inquiries_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."case_notes" ADD CONSTRAINT "case_notes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."case_notes" ADD CONSTRAINT "case_notes_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."units" ADD CONSTRAINT "units_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tenants" ADD CONSTRAINT "tenants_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tenants" ADD CONSTRAINT "tenants_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leases" ADD CONSTRAINT "leases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leases" ADD CONSTRAINT "leases_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "public"."leases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_updates" ADD CONSTRAINT "maintenance_updates_maintenanceTicketId_fkey" FOREIGN KEY ("maintenanceTicketId") REFERENCES "public"."maintenance_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_updates" ADD CONSTRAINT "maintenance_updates_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communications" ADD CONSTRAINT "communications_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communications" ADD CONSTRAINT "communications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communications" ADD CONSTRAINT "communications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

