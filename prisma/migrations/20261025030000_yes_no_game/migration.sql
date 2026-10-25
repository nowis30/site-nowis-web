-- Jeu « Combien de Oui? » : salles de jeu temporaires (aucune donnée personnelle durable).
-- IF NOT EXISTS : le site crée aussi cette table tout seul au premier lancement du jeu.
CREATE TABLE IF NOT EXISTS "yes_no_rooms" (
    "code" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "yes_no_rooms_pkey" PRIMARY KEY ("code")
);

CREATE INDEX IF NOT EXISTS "yes_no_rooms_expiresAt_idx" ON "yes_no_rooms"("expiresAt");
