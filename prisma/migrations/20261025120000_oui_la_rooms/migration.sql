CREATE TABLE "oui_la_rooms" (
    "code" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oui_la_rooms_pkey" PRIMARY KEY ("code")
);

CREATE INDEX "oui_la_rooms_expires_at_idx" ON "oui_la_rooms"("expires_at");
