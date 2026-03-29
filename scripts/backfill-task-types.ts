import { prisma } from '../src/lib/prisma';

async function main() {
  const before = await prisma.task.count();

  // Defensive backfill for legacy databases where the column could temporarily contain NULL.
  const nullTypeUpdates = await prisma.$executeRawUnsafe(
    'UPDATE "tasks" SET "type" = \'FOLLOW_UP\' WHERE "type" IS NULL'
  );

  // Keep song tasks actionable even when payload was created before payload support.
  const missingSongPayloadUpdates = await prisma.$executeRawUnsafe(
    'UPDATE "tasks" SET "payload" = jsonb_build_object(\'songRequestId\', "songRequestId"::text) WHERE "type" = \'SONG\' AND "songRequestId" IS NOT NULL AND "payload" IS NULL'
  );

  const malformedPayloadUpdates = await prisma.$executeRawUnsafe(
    'UPDATE "tasks" SET "payload" = NULL WHERE "payload" IS NOT NULL AND jsonb_typeof("payload") <> \'object\''
  );

  const after = await prisma.task.count();

  console.log('[tasks:backfill] total_tasks=', before);
  console.log('[tasks:backfill] null_type_fixed=', Number(nullTypeUpdates));
  console.log('[tasks:backfill] missing_song_payload_fixed=', Number(missingSongPayloadUpdates));
  console.log('[tasks:backfill] malformed_payload_reset=', Number(malformedPayloadUpdates));
  console.log('[tasks:backfill] total_tasks_after=', after);
}

main()
  .catch((error) => {
    console.error('[tasks:backfill] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
