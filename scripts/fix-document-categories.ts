/**
 * fix-document-categories.ts
 *
 * Corrige les catégories legacy confirmées dans la table file_documents.
 *
 * Utilisation:
 *   npm run fix:document-categories           → dry-run (aucune écriture)
 *   npm run fix:document-categories:apply     → applique les corrections
 *
 * Mapping legacy applique:
 *   song → song-audio ou song-video (selon mimeType/extension)
 *
 * Le script est idempotent: relancer après correction ne modifie rien.
 */

import { resolveDocumentCategory, type DocumentCategory } from '@/features/documents/document-categories';
import { prisma } from '@/lib/prisma';

// ─── Mappings legacy confirmés ──────────────────────────────────────────────

const TARGET_LEGACY_VALUES = ['song'] as const;

function isTargetLegacyCategory(category: string): category is (typeof TARGET_LEGACY_VALUES)[number] {
  return TARGET_LEGACY_VALUES.includes(category as (typeof TARGET_LEGACY_VALUES)[number]);
}

// ─── Types ───────────────────────────────────────────────────────────────────

type DocToFix = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  createdAt: Date;
  oldCategory: string;
  newCategory: DocumentCategory;
};

// ─── Arguments ───────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    apply: args.includes('--apply'),
  };
}

// ─── Lecture schema-drift-tolerant ──────────────────────────────────────────

function selectColumn(columnSet: Set<string>, name: string, cast = 'text') {
  return columnSet.has(name) ? `"${name}"` : `NULL::${cast}`;
}

async function fetchDocsToFix(): Promise<DocToFix[]> {
  const legacyValues = [...TARGET_LEGACY_VALUES];
  if (legacyValues.length === 0) return [];

  const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'file_documents'
  `;
  const columnSet = new Set(columns.map((c) => c.column_name));

  const createdAtExpr = columnSet.has('createdAt')
    ? '"createdAt"'
    : columnSet.has('created_at')
      ? '"created_at"'
      : 'NOW()';

  const placeholders = legacyValues.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
    SELECT
      ${selectColumn(columnSet, 'id')} AS "id",
      ${selectColumn(columnSet, 'filename')} AS "filename",
      ${selectColumn(columnSet, 'originalName')} AS "originalName",
      ${selectColumn(columnSet, 'mimeType')} AS "mimeType",
      ${createdAtExpr} AS "createdAt",
      ${selectColumn(columnSet, 'category')} AS "category"
    FROM "file_documents"
    WHERE "category" IN (${placeholders})
    ORDER BY ${columnSet.has('createdAt') ? '"createdAt"' : columnSet.has('created_at') ? '"created_at"' : 'NOW()'} DESC
  `;

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    query,
    ...legacyValues,
  );

  return rows.map((row) => {
    const oldCategory = String(row.category ?? '');
    const filename = String(row.filename ?? '');
    const originalName = String(row.originalName ?? '');
    const mimeType = String(row.mimeType ?? '');
    const resolution = resolveDocumentCategory({
      category: oldCategory,
      mimeType,
      filename,
      originalName,
    });

    return {
      id: String(row.id ?? ''),
      filename,
      originalName,
      mimeType,
      createdAt:
        row.createdAt instanceof Date
          ? row.createdAt
          : new Date(String(row.createdAt ?? new Date().toISOString())),
      oldCategory,
      newCategory: resolution.category,
    };
  });
}

// ─── Affichage ────────────────────────────────────────────────────────────────

function printHeader(apply: boolean) {
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  if (apply) {
    console.log('  fix-document-categories  —  MODE: APPLYING');
  } else {
    console.log('  fix-document-categories  —  MODE: DRY RUN (aucune écriture)');
    console.log('  Passez --apply pour appliquer les corrections.');
  }
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
}

function printDocTable(docs: DocToFix[]) {
  console.log(`Documents concernés: ${docs.length}`);
  console.log('');
  for (const doc of docs) {
    const name = doc.originalName || doc.filename || doc.id;
    const date = doc.createdAt.toISOString().split('T')[0];
    console.log(`  id:          ${doc.id}`);
    console.log(`  fichier:     ${name}`);
    console.log(`  mimeType:    ${doc.mimeType}`);
    console.log(`  createdAt:   ${date}`);
    console.log(`  catégorie:   ${doc.oldCategory}  →  ${doc.newCategory}`);
    console.log('  ─────────────────────────────────────────────────────');
  }
  console.log('');
}

function printFooter(apply: boolean, applied: number) {
  console.log('════════════════════════════════════════════════════════════');
  if (apply) {
    console.log(`  Terminé. ${applied} document(s) mis à jour.`);
  } else {
    console.log(`  DRY RUN — ${applied} document(s) seraient corrigés.`);
    console.log('  Aucune écriture effectuée.');
  }
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
}

// ─── Correction ──────────────────────────────────────────────────────────────

async function applyCorrection(
  docs: DocToFix[],
): Promise<number> {
  let updated = 0;

  for (const doc of docs) {
    if (!isTargetLegacyCategory(doc.oldCategory)) {
      console.warn(`  ⚠ Mapping absent pour "${doc.oldCategory}", document ${doc.id} ignoré.`);
      continue;
    }

    await prisma.$executeRaw`
      UPDATE "file_documents"
      SET "category" = ${doc.newCategory}
      WHERE "id" = ${doc.id}
        AND "category" = ${doc.oldCategory}
    `;
    console.log(`  ✓ ${doc.id}  ${doc.oldCategory} → ${doc.newCategory}`);
    updated += 1;
  }

  return updated;
}

// ─── Point d'entrée ──────────────────────────────────────────────────────────

async function main() {
  const { apply } = parseArgs();

  printHeader(apply);

  const docs = await fetchDocsToFix();

  if (docs.length === 0) {
    console.log('  Aucun document legacy à corriger. La base est déjà homogène.');
    console.log('');
    await prisma.$disconnect();
    return;
  }

  printDocTable(docs);

  let applied = 0;

  if (apply) {
    applied = await applyCorrection(docs);
  } else {
    applied = docs.length;
  }

  printFooter(apply, applied);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Erreur fatale:', err);
  prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
