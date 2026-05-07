import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  OFFICIAL_DOCUMENT_CATEGORIES,
  resolveDocumentCategory,
} from '@/features/documents/document-categories';
import { prisma } from '@/lib/prisma';

type RawCategoryKind = 'official' | 'legacy' | 'invalid' | 'empty' | 'null';

type DocRow = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  createdAt: Date;
  category: string | null;
  contactId: string | null;
  clientId: string | null;
  songRequestId: string | null;
  workshopRequestId: string | null;
  commercialQuoteId: string | null;
  invoiceId: string | null;
  uploadedByUserId: string | null;
  visibility: 'ADMIN_ONLY' | 'CLIENT_VISIBLE' | null;
};

type GroupStats = {
  rawCategory: string | null;
  rawCategoryDisplay: string;
  rawKind: RawCategoryKind;
  suggestedCategories: Record<string, number>;
  documents: number;
  fallbackDocuments: number;
  examples: Array<{
    id: string;
    filename: string;
    mimeType: string;
    createdAt: string;
    songRequestId: string | null;
    workshopRequestId: string | null;
    commercialQuoteId: string | null;
    invoiceId: string | null;
    contactId: string | null;
    clientId: null;
  }>;
};

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    writeJson: args.includes('--json') || process.env.AUDIT_DOCUMENT_CATEGORIES_JSON === '1',
    maxExamples: 5,
  };
}

function isEmptyCategory(value: string | null) {
  return value !== null && value.trim().length === 0;
}

function getRawKind(document: DocRow): RawCategoryKind {
  if (document.category === null) return 'null';
  if (isEmptyCategory(document.category)) return 'empty';

  const resolution = resolveDocumentCategory(document);
  if (resolution.source === 'explicit') return 'official';
  if (resolution.source === 'legacy-normalized') return 'legacy';
  return 'invalid';
}

function getRawCategoryDisplay(rawCategory: string | null) {
  if (rawCategory === null) return '<NULL>';
  if (rawCategory.trim() === '') return '<EMPTY>';
  return rawCategory;
}

function formatDate(date: Date) {
  return date.toISOString();
}

function selectColumn(columnSet: Set<string>, name: string, cast = 'text') {
  return columnSet.has(name)
    ? `"${name}"`
    : `NULL::${cast}`;
}

async function readFileDocumentsReadOnly(): Promise<DocRow[]> {
  const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='file_documents'
  `;

  const columnSet = new Set(columns.map((entry) => entry.column_name));
  const createdAtExpr = columnSet.has('createdAt')
    ? '"createdAt"'
    : columnSet.has('created_at')
      ? '"created_at"'
      : 'NOW()';

  const query = `
    SELECT
      ${selectColumn(columnSet, 'id')} AS "id",
      ${selectColumn(columnSet, 'filename')} AS "filename",
      ${selectColumn(columnSet, 'originalName')} AS "originalName",
      ${selectColumn(columnSet, 'mimeType')} AS "mimeType",
      ${createdAtExpr},
      ${selectColumn(columnSet, 'category')} AS "category",
      ${selectColumn(columnSet, 'contactId')} AS "contactId",
      ${selectColumn(columnSet, 'clientId')} AS "clientId",
      ${selectColumn(columnSet, 'songRequestId')} AS "songRequestId",
      ${selectColumn(columnSet, 'workshopRequestId')} AS "workshopRequestId",
      ${selectColumn(columnSet, 'commercialQuoteId')} AS "commercialQuoteId",
      ${selectColumn(columnSet, 'invoiceId')} AS "invoiceId",
      ${selectColumn(columnSet, 'uploadedByUserId')} AS "uploadedByUserId",
      ${selectColumn(columnSet, 'visibility')} AS "visibility"
    FROM "file_documents"
    ORDER BY ${columnSet.has('createdAt') ? '"createdAt"' : columnSet.has('created_at') ? '"created_at"' : 'NOW()'} DESC
  `;

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(query);
  return rows.map((row) => ({
    id: String(row.id || ''),
    filename: String(row.filename || ''),
    originalName: String(row.originalName || ''),
    mimeType: String(row.mimeType || ''),
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt || new Date().toISOString())),
    category: row.category == null ? null : String(row.category),
    contactId: row.contactId == null ? null : String(row.contactId),
    clientId: row.clientId == null ? null : String(row.clientId),
    songRequestId: row.songRequestId == null ? null : String(row.songRequestId),
    workshopRequestId: row.workshopRequestId == null ? null : String(row.workshopRequestId),
    commercialQuoteId: row.commercialQuoteId == null ? null : String(row.commercialQuoteId),
    invoiceId: row.invoiceId == null ? null : String(row.invoiceId),
    uploadedByUserId: row.uploadedByUserId == null ? null : String(row.uploadedByUserId),
    visibility: row.visibility == null
      ? null
      : String(row.visibility) === 'ADMIN_ONLY' || String(row.visibility) === 'CLIENT_VISIBLE'
        ? (String(row.visibility) as 'ADMIN_ONLY' | 'CLIENT_VISIBLE')
        : null,
  }));
}

async function main() {
  const { writeJson, maxExamples } = parseArgs();

  const rows = await readFileDocumentsReadOnly();

  const grouped = new Map<string, GroupStats>();

  let docsOfficial = 0;
  let docsLegacy = 0;
  let docsInvalid = 0;
  let docsEmpty = 0;
  let docsNull = 0;
  let docsFallbackUsed = 0;
  let docsNormalizedToOther = 0;
  const recommendedMappingByRawSuggested = new Map<string, {
    rawCategory: string;
    status: RawCategoryKind;
    recommendedCategory: string;
    documents: number;
    fallbackDocuments: number;
  }>();

  const recommendedDocuments: Array<{
    id: string;
    filename: string;
    mimeType: string;
    rawCategory: string;
    status: RawCategoryKind;
    recommendedCategory: string;
    createdAt: string;
  }> = [];

  for (const row of rows) {
    const rawKind = getRawKind(row);
    const resolution = resolveDocumentCategory({
      ...row,
      filename: row.filename,
      originalName: row.originalName,
    });
    const fallbackUsed = resolution.source === 'fallback';
    const key = `${rawKind}::${row.category ?? '__NULL__'}`;

    if (rawKind === 'official') docsOfficial += 1;
    if (rawKind === 'legacy') docsLegacy += 1;
    if (rawKind === 'invalid') docsInvalid += 1;
    if (rawKind === 'empty') docsEmpty += 1;
    if (rawKind === 'null') docsNull += 1;
    if (fallbackUsed) docsFallbackUsed += 1;
    if (resolution.category === 'other') docsNormalizedToOther += 1;

    if (!grouped.has(key)) {
      grouped.set(key, {
        rawCategory: row.category,
        rawCategoryDisplay: getRawCategoryDisplay(row.category),
        rawKind,
        suggestedCategories: {},
        documents: 0,
        fallbackDocuments: 0,
        examples: [],
      });
    }

    const item = grouped.get(key);
    if (!item) continue;

    item.documents += 1;
    item.suggestedCategories[resolution.category] = (item.suggestedCategories[resolution.category] ?? 0) + 1;
    if (fallbackUsed) item.fallbackDocuments += 1;
    if (item.examples.length < maxExamples) {
      item.examples.push({
        id: row.id,
        filename: row.originalName || row.filename,
        mimeType: row.mimeType,
        createdAt: formatDate(row.createdAt),
        songRequestId: row.songRequestId,
        workshopRequestId: row.workshopRequestId,
        commercialQuoteId: row.commercialQuoteId,
        invoiceId: row.invoiceId,
        contactId: row.contactId,
        clientId: row.clientId,
      });
    }

    if (rawKind !== 'official') {
      const rawCategoryDisplay = getRawCategoryDisplay(row.category);
      const recommendationKey = `${rawCategoryDisplay}::${rawKind}::${resolution.category}`;
      const current = recommendedMappingByRawSuggested.get(recommendationKey);
      if (current) {
        current.documents += 1;
        if (fallbackUsed) current.fallbackDocuments += 1;
      } else {
        recommendedMappingByRawSuggested.set(recommendationKey, {
          rawCategory: rawCategoryDisplay,
          status: rawKind,
          recommendedCategory: resolution.category,
          documents: 1,
          fallbackDocuments: fallbackUsed ? 1 : 0,
        });
      }

      recommendedDocuments.push({
        id: row.id,
        filename: row.originalName || row.filename,
        mimeType: row.mimeType,
        rawCategory: rawCategoryDisplay,
        status: rawKind,
        recommendedCategory: resolution.category,
        createdAt: formatDate(row.createdAt),
      });
    }
  }

  const groupedRows = [...grouped.values()].sort((a, b) => b.documents - a.documents);
  const problematicGroups = groupedRows.filter((entry) => entry.rawKind !== 'official');

  const distinctOfficialRawValues = new Set(groupedRows.filter((entry) => entry.rawKind === 'official').map((entry) => entry.rawCategoryDisplay));
  const distinctLegacyRawValues = new Set(groupedRows.filter((entry) => entry.rawKind === 'legacy').map((entry) => entry.rawCategoryDisplay));
  const distinctInvalidRawValues = new Set(groupedRows.filter((entry) => entry.rawKind === 'invalid' || entry.rawKind === 'empty' || entry.rawKind === 'null').map((entry) => entry.rawCategoryDisplay));

  const recommendedMapping = [...recommendedMappingByRawSuggested.values()]
    .sort((a, b) => b.documents - a.documents);

  function formatSuggestedCategories(categories: Record<string, number>) {
    const entries = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    return entries.map(([category, count]) => `${category}${count > 1 ? `(${count})` : ''}`).join(', ');
  }

  console.log('=== Audit categories FileDocument (lecture seule) ===');
  console.log(`Taxonomie officielle: ${OFFICIAL_DOCUMENT_CATEGORIES.join(', ')}`);
  console.log('');
  console.log('--- Groupement par valeur brute de category ---');
  for (const entry of groupedRows) {
    console.log(
      [
        `category=${entry.rawCategoryDisplay}`,
        `docs=${entry.documents}`,
        `normalize->${formatSuggestedCategories(entry.suggestedCategories)}`,
        `status=${entry.rawKind}`,
        `fallback=${entry.fallbackDocuments}`,
      ].join(' | '),
    );
  }

  if (problematicGroups.length > 0) {
    console.log('');
    console.log('--- Exemples categories problematiques ---');
    for (const entry of problematicGroups) {
      console.log(`\n[${entry.rawCategoryDisplay}] status=${entry.rawKind} normalize->${formatSuggestedCategories(entry.suggestedCategories)} docs=${entry.documents}`);
      for (const sample of entry.examples) {
        console.log(
          `  - id=${sample.id} | filename=${sample.filename} | mimeType=${sample.mimeType} | createdAt=${sample.createdAt} | songRequestId=${sample.songRequestId ?? '-'} | workshopRequestId=${sample.workshopRequestId ?? '-'} | commercialQuoteId=${sample.commercialQuoteId ?? '-'} | invoiceId=${sample.invoiceId ?? '-'} | contactId=${sample.contactId ?? '-'} | clientId=${sample.clientId ?? '-'}`,
        );
      }
    }
  }

  if (recommendedDocuments.length > 0) {
    console.log('');
    console.log('--- Recommandations detaillees par document (non appliquees) ---');
    for (const recommendation of recommendedDocuments) {
      console.log(
        `id=${recommendation.id} | filename=${recommendation.filename} | mimeType=${recommendation.mimeType} | raw=${recommendation.rawCategory} | status=${recommendation.status} | suggested=${recommendation.recommendedCategory} | createdAt=${recommendation.createdAt}`,
      );
    }
  }

  console.log('');
  console.log('--- Resume final ---');
  console.log(`total_documents=${rows.length}`);
  console.log(`total_categories_officielles_distinctes=${distinctOfficialRawValues.size}`);
  console.log(`total_categories_legacy_distinctes=${distinctLegacyRawValues.size}`);
  console.log(`total_categories_invalides_distinctes=${distinctInvalidRawValues.size}`);
  console.log(`total_documents_officiels=${docsOfficial}`);
  console.log(`total_documents_legacy=${docsLegacy}`);
  console.log(`total_documents_invalides=${docsInvalid}`);
  console.log(`total_documents_empty=${docsEmpty}`);
  console.log(`total_documents_null=${docsNull}`);
  console.log(`total_documents_fallback=${docsFallbackUsed}`);
  console.log(`total_documents_normalises_other=${docsNormalizedToOther}`);

  if (recommendedMapping.length > 0) {
    console.log('');
    console.log('--- Recommandation mapping (non appliquee) ---');
    for (const recommendation of recommendedMapping) {
      console.log(
        `raw=${recommendation.rawCategory} | status=${recommendation.status} | suggested=${recommendation.recommendedCategory} | docs=${recommendation.documents} | fallback=${recommendation.fallbackDocuments}`,
      );
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    readonly: true,
    taxonomy: OFFICIAL_DOCUMENT_CATEGORIES,
    totals: {
      totalDocuments: rows.length,
      totalOfficialCategoriesDistinct: distinctOfficialRawValues.size,
      totalLegacyCategoriesDistinct: distinctLegacyRawValues.size,
      totalInvalidCategoriesDistinct: distinctInvalidRawValues.size,
      totalDocumentsOfficial: docsOfficial,
      totalDocumentsLegacy: docsLegacy,
      totalDocumentsInvalid: docsInvalid,
      totalDocumentsEmpty: docsEmpty,
      totalDocumentsNull: docsNull,
      totalDocumentsFallback: docsFallbackUsed,
      totalDocumentsNormalizedToOther: docsNormalizedToOther,
    },
    groupedByRawCategory: groupedRows,
    problematicCategories: problematicGroups,
    recommendedMapping,
  };

  if (writeJson) {
    const outputPath = path.join(process.cwd(), 'tmp', 'document-category-audit.json');
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8');
    console.log('');
    console.log(`Rapport JSON ecrit: ${outputPath}`);
  } else {
    console.log('');
    console.log('JSON non ecrit (utiliser --json pour generer tmp/document-category-audit.json localement).');
  }
}

main()
  .catch((error) => {
    console.error('[audit:document-categories] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
