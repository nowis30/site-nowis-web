DO $$ BEGIN
  CREATE TYPE "public"."CalendarProvider" AS ENUM ('GOOGLE', 'MICROSOFT', 'CALENDLY', 'ICLOUD');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."CalendarConnectionStatus" AS ENUM ('CONNECTED', 'EXPIRED', 'ERROR', 'DISCONNECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."CalendarEventStatus" AS ENUM ('CONFIRMED', 'TENTATIVE', 'CANCELLED', 'DELETED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "public"."appointments"
  ADD COLUMN IF NOT EXISTS "calendarConnectionId" UUID,
  ADD COLUMN IF NOT EXISTS "externalProvider" "public"."CalendarProvider",
  ADD COLUMN IF NOT EXISTS "externalEventId" TEXT,
  ADD COLUMN IF NOT EXISTS "meetingUrl" TEXT;

CREATE TABLE IF NOT EXISTS "public"."calendar_connections" (
  "id" UUID NOT NULL,
  "provider" "public"."CalendarProvider" NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "accountEmail" TEXT,
  "accountName" TEXT,
  "accessTokenEncrypted" TEXT,
  "refreshTokenEncrypted" TEXT,
  "expiresAt" TIMESTAMP(3),
  "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "public"."CalendarConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
  "lastSyncedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "calendar_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."calendar_external_events" (
  "id" UUID NOT NULL,
  "connectionId" UUID NOT NULL,
  "provider" "public"."CalendarProvider" NOT NULL,
  "externalEventId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT,
  "location" TEXT,
  "meetingUrl" TEXT,
  "status" "public"."CalendarEventStatus" NOT NULL DEFAULT 'CONFIRMED',
  "rawPayload" JSONB,
  "linkedCrmAppointmentId" UUID,
  "linkedWorkshopRequestId" UUID,
  "linkedClientId" UUID,
  "linkedOrganizationId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "calendar_external_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "calendar_connections_provider_providerAccountId_key"
  ON "public"."calendar_connections"("provider", "providerAccountId");

CREATE INDEX IF NOT EXISTS "calendar_connections_provider_status_idx"
  ON "public"."calendar_connections"("provider", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "calendar_external_events_connectionId_externalEventId_key"
  ON "public"."calendar_external_events"("connectionId", "externalEventId");

CREATE INDEX IF NOT EXISTS "calendar_external_events_startAt_idx"
  ON "public"."calendar_external_events"("startAt");

CREATE INDEX IF NOT EXISTS "calendar_external_events_linkedClientId_idx"
  ON "public"."calendar_external_events"("linkedClientId");

CREATE INDEX IF NOT EXISTS "calendar_external_events_linkedOrganizationId_idx"
  ON "public"."calendar_external_events"("linkedOrganizationId");

CREATE INDEX IF NOT EXISTS "calendar_external_events_linkedCrmAppointmentId_idx"
  ON "public"."calendar_external_events"("linkedCrmAppointmentId");

CREATE INDEX IF NOT EXISTS "calendar_external_events_linkedWorkshopRequestId_idx"
  ON "public"."calendar_external_events"("linkedWorkshopRequestId");

CREATE INDEX IF NOT EXISTS "appointments_calendarConnectionId_idx"
  ON "public"."appointments"("calendarConnectionId");

CREATE INDEX IF NOT EXISTS "appointments_externalProvider_externalEventId_idx"
  ON "public"."appointments"("externalProvider", "externalEventId");

DO $$ BEGIN
  ALTER TABLE "public"."appointments"
    ADD CONSTRAINT "appointments_calendarConnectionId_fkey"
    FOREIGN KEY ("calendarConnectionId") REFERENCES "public"."calendar_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "public"."calendar_connections"
    ADD CONSTRAINT "calendar_connections_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "public"."calendar_external_events"
    ADD CONSTRAINT "calendar_external_events_connectionId_fkey"
    FOREIGN KEY ("connectionId") REFERENCES "public"."calendar_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "public"."calendar_external_events"
    ADD CONSTRAINT "calendar_external_events_linkedCrmAppointmentId_fkey"
    FOREIGN KEY ("linkedCrmAppointmentId") REFERENCES "public"."appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "public"."calendar_external_events"
    ADD CONSTRAINT "calendar_external_events_linkedWorkshopRequestId_fkey"
    FOREIGN KEY ("linkedWorkshopRequestId") REFERENCES "public"."workshop_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "public"."calendar_external_events"
    ADD CONSTRAINT "calendar_external_events_linkedClientId_fkey"
    FOREIGN KEY ("linkedClientId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "public"."calendar_external_events"
    ADD CONSTRAINT "calendar_external_events_linkedOrganizationId_fkey"
    FOREIGN KEY ("linkedOrganizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;