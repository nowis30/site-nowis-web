CREATE TYPE "public"."TaskType" AS ENUM ('CALL', 'EMAIL', 'SONG', 'FOLLOW_UP');

ALTER TABLE "public"."tasks"
ADD COLUMN "type" "public"."TaskType" NOT NULL DEFAULT 'FOLLOW_UP',
ADD COLUMN "payload" JSONB;
