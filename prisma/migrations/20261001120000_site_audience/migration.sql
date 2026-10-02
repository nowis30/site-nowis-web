CREATE TABLE "site_audience_counters" (
    "namespace" TEXT NOT NULL,
    "totalVisits" BIGINT NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "site_audience_counters_pkey" PRIMARY KEY ("namespace"),
    CONSTRAINT "site_audience_counters_totalVisits_nonnegative" CHECK ("totalVisits" >= 0)
);

CREATE TABLE "site_audience_sessions" (
    "namespace" TEXT NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "site_audience_sessions_pkey" PRIMARY KEY ("namespace", "sessionHash"),
    CONSTRAINT "site_audience_sessions_counter_fkey" FOREIGN KEY ("namespace")
        REFERENCES "site_audience_counters"("namespace") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "site_audience_sessions_namespace_lastSeenAt_idx"
    ON "site_audience_sessions"("namespace", "lastSeenAt");
