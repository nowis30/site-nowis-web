-- Phase 1: ajout non destructif des champs booking* (Google-first)
ALTER TABLE "workshop_requests"
  ADD COLUMN "bookingProvider" "CalendarProvider",
  ADD COLUMN "bookingEventUri" TEXT,
  ADD COLUMN "bookingInviteeUri" TEXT,
  ADD COLUMN "bookingUrl" TEXT,
  ADD COLUMN "bookingSource" TEXT,
  ADD COLUMN "bookingSyncedAt" TIMESTAMP(3),
  ADD COLUMN "bookingRawPayload" JSONB;

-- Backfill sécuritaire depuis les champs legacy Calendly
UPDATE "workshop_requests"
SET
  "bookingProvider" = COALESCE(
    "bookingProvider",
    CASE
      WHEN "calendlyEventUri" IS NOT NULL OR "calendlyInviteeUri" IS NOT NULL OR "calendlyUrl" IS NOT NULL
        THEN 'CALENDLY'::"CalendarProvider"
      ELSE NULL
    END
  ),
  "bookingEventUri" = COALESCE("bookingEventUri", "calendlyEventUri"),
  "bookingInviteeUri" = COALESCE("bookingInviteeUri", "calendlyInviteeUri"),
  "bookingUrl" = COALESCE("bookingUrl", "calendlyUrl"),
  "bookingSource" = COALESCE(
    "bookingSource",
    CASE
      WHEN "calendlyEventUri" IS NOT NULL OR "calendlyInviteeUri" IS NOT NULL OR "calendlyUrl" IS NOT NULL
        THEN 'LEGACY_CALENDLY'
      ELSE NULL
    END
  ),
  "bookingSyncedAt" = COALESCE(
    "bookingSyncedAt",
    CASE
      WHEN "calendlyEventUri" IS NOT NULL OR "calendlyInviteeUri" IS NOT NULL OR "calendlyUrl" IS NOT NULL
        THEN NOW()
      ELSE NULL
    END
  );
