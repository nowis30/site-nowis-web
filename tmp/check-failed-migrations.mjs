import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT migration_name, finished_at::text, rolled_back_at::text, logs FROM "_prisma_migrations" ORDER BY started_at DESC LIMIT 20`
  );
  for (const row of rows) {
    const status = row.rolled_back_at ? 'ROLLED_BACK' : row.finished_at ? 'OK' : 'FAILED/PENDING';
    console.log(`${status} | ${row.migration_name}`);
    if (status !== 'OK' && row.logs) console.log('  logs:', row.logs.substring(0, 300));
  }
} finally {
  await prisma.$disconnect();
}
