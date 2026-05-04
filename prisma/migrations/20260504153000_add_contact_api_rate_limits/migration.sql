CREATE TABLE IF NOT EXISTS "api_rate_limits" (
  "id" UUID NOT NULL,
  "scope" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "windowSeconds" INTEGER NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "api_rate_limits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "api_rate_limits_scope_identifier_windowStart_key"
  ON "api_rate_limits"("scope", "identifier", "windowStart");

CREATE INDEX IF NOT EXISTS "api_rate_limits_scope_identifier_resetAt_idx"
  ON "api_rate_limits"("scope", "identifier", "resetAt");
