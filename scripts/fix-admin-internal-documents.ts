/**
 * Script: fix-admin-internal-documents
 *
 * Recategorise en "client-shared" tous les FileDocument qui sont marqués
 * CLIENT_VISIBLE mais ont atterri dans la catégorie "admin-internal" à cause
 * de l'ancien défaut du panneau ContactFilesPanel.
 *
 * Usage:
 *   npx tsx scripts/fix-admin-internal-documents.ts
 *
 * Le script est idempotent (safe à relancer plusieurs fois).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targets = await prisma.fileDocument.findMany({
    where: {
      category: 'admin-internal',
      visibility: 'CLIENT_VISIBLE',
    },
    select: { id: true, originalName: true, contactId: true, createdAt: true },
  });

  if (targets.length === 0) {
    console.log('Aucun document à corriger.');
    return;
  }

  console.log(`${targets.length} document(s) à corriger :`);
  for (const doc of targets) {
    console.log(`  - ${doc.id} | ${doc.originalName} | contact: ${doc.contactId}`);
  }

  const { count } = await prisma.fileDocument.updateMany({
    where: {
      category: 'admin-internal',
      visibility: 'CLIENT_VISIBLE',
    },
    data: { category: 'client-shared' },
  });

  console.log(`\n✅ ${count} document(s) mis à jour → catégorie "client-shared".`);
}

main()
  .catch((error) => {
    console.error('Erreur:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
