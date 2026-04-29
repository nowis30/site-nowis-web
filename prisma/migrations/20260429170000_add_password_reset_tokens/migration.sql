CREATE TABLE "public"."password_reset_tokens" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "scope" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key"
  ON "public"."password_reset_tokens"("tokenHash");

CREATE INDEX "password_reset_tokens_userId_scope_idx"
  ON "public"."password_reset_tokens"("userId", "scope");

CREATE INDEX "password_reset_tokens_expiresAt_idx"
  ON "public"."password_reset_tokens"("expiresAt");

ALTER TABLE "public"."password_reset_tokens"
  ADD CONSTRAINT "password_reset_tokens_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
