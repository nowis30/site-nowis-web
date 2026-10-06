ALTER TABLE "users" ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "contacts" ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "password_reset_tokens" ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0;
-- Staff were provisioned by administrators. Portal accounts must prove email
-- ownership at the first login after this migration, including old OAuth users.
UPDATE "users" SET "emailVerifiedAt" = CURRENT_TIMESTAMP WHERE "role" IN ('ADMIN', 'ASSISTANT');
-- Outstanding reset links predate revocation and cannot be carried forward.
DELETE FROM "password_reset_tokens";
CREATE TABLE "auth_grants" (
  "id" UUID NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "identityHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_grants_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "auth_grants_tokenHash_key" ON "auth_grants"("tokenHash");
CREATE INDEX "auth_grants_expiresAt_idx" ON "auth_grants"("expiresAt");
-- Revoke sessions on sensitive changes made by ANY application/admin path.
CREATE FUNCTION nowis_user_auth_epoch() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW."passwordHash", NEW."email", NEW."role", NEW."isActive", NEW."contactId", NEW."emailVerifiedAt")
     IS DISTINCT FROM (OLD."passwordHash", OLD."email", OLD."role", OLD."isActive", OLD."contactId", OLD."emailVerifiedAt") THEN
    NEW."authVersion" := GREATEST(NEW."authVersion", OLD."authVersion" + 1);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER users_auth_epoch BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION nowis_user_auth_epoch();
CREATE FUNCTION nowis_contact_auth_epoch() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW."email", NEW."deletedAt") IS DISTINCT FROM (OLD."email", OLD."deletedAt") THEN
    NEW."authVersion" := GREATEST(NEW."authVersion", OLD."authVersion" + 1);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER contacts_auth_epoch BEFORE UPDATE ON "contacts" FOR EACH ROW EXECUTE FUNCTION nowis_contact_auth_epoch();
