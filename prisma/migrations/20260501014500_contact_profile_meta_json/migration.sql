-- Store client profile completion data outside of free-text notes.
ALTER TABLE "contacts"
  ADD COLUMN IF NOT EXISTS "profileMeta" JSONB;
