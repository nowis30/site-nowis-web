import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  // Colonnes de la table users
  const cols = await prisma.$queryRaw<Array<{column_name: string}>>`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='users' 
    ORDER BY ordinal_position
  `;
  console.log('=== users columns ===');
  console.log(cols.map(r => r.column_name).join(', '));

  // Toutes les tables
  const tables = await prisma.$queryRaw<Array<{table_name: string}>>`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema='public' ORDER BY table_name
  `;
  console.log('\n=== all tables ===');
  console.log(tables.map(r => r.table_name).join(', '));

  // État des migrations
  const migrations = await prisma.$queryRaw<Array<{migration_name: string, finished_at: Date | null, rolled_back_at: Date | null}>>`
    SELECT migration_name, finished_at, rolled_back_at 
    FROM "_prisma_migrations" ORDER BY started_at
  `;
  console.log('\n=== prisma_migrations ===');
  migrations.forEach(r => {
    const status = r.rolled_back_at ? 'ROLLED_BACK' : r.finished_at ? 'APPLIED' : 'FAILED';
    console.log(`  [${status}] ${r.migration_name}`);
  });
}

main().catch(e => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
