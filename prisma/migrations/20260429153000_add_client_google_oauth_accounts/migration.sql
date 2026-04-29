CREATE TABLE "public"."client_oauth_accounts" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "email" TEXT,
  "name" TEXT,
  "image" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "client_oauth_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_oauth_accounts_provider_providerAccountId_key"
  ON "public"."client_oauth_accounts"("provider", "providerAccountId");

CREATE UNIQUE INDEX "client_oauth_accounts_userId_provider_key"
  ON "public"."client_oauth_accounts"("userId", "provider");

CREATE INDEX "client_oauth_accounts_email_idx"
  ON "public"."client_oauth_accounts"("email");

ALTER TABLE "public"."client_oauth_accounts"
  ADD CONSTRAINT "client_oauth_accounts_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
