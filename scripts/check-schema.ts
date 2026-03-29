import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Vérifier les valeurs de UserRole
  const roles = await prisma.$queryRaw<Array<{enumlabel: string}>>`
    SELECT enumlabel FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE pg_type.typname = 'UserRole' 
    ORDER BY enumsortorder
  `;
  console.log('=== UserRole enum values ===');
  console.log(roles.map(r => r.enumlabel).join(', '));

  // Vérifier les utilisateurs legacy encore stockés avec la valeur DB TENANT
  const tenantUsers = await prisma.$queryRaw<Array<{email: string, role: string, isActive: boolean, contactId: string | null}>>`
    SELECT email, role::text, "isActive", "contactId" FROM users WHERE role::text = 'TENANT' LIMIT 10
  `;
  console.log('\n=== legacy TENANT users (mapped to PORTAL_USER) ===');
  if (tenantUsers.length === 0) {
    console.log('(aucun utilisateur legacy TENANT trouvé)');
  } else {
    tenantUsers.forEach(u => console.log(`  ${u.email} | isActive=${u.isActive} | contactId=${u.contactId}`));
  }

  // Vérifier l'index unique sur contactId
  const indexes = await prisma.$queryRaw<Array<{indexname: string}>>`
    SELECT indexname FROM pg_indexes WHERE tablename='users' AND indexname LIKE '%contactId%'
  `;
  console.log('\n=== contactId indexes ===');
  console.log(indexes.map(r => r.indexname).join(', ') || '(aucun)');

  // Contrainte FK
  const fks = await prisma.$queryRaw<Array<{constraint_name: string}>>`
    SELECT constraint_name FROM information_schema.table_constraints 
    WHERE table_name='users' AND constraint_type='FOREIGN KEY' AND constraint_name LIKE '%contact%'
  `;
  console.log('\n=== contactId FK constraints ===');
  console.log(fks.map(r => r.constraint_name).join(', ') || '(aucune)');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
