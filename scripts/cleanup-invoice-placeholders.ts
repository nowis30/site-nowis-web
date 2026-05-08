import { prisma } from '../src/lib/prisma';

type PlaceholderRow = {
  id: string;
  invoiceId: string | null;
  storageKey: string;
};

function isApplyMode() {
  return process.argv.includes('--apply');
}

function groupByInvoiceId(rows: PlaceholderRow[]) {
  const counters = new Map<string, number>();
  for (const row of rows) {
    if (!row.invoiceId) continue;
    counters.set(row.invoiceId, (counters.get(row.invoiceId) || 0) + 1);
  }
  return Array.from(counters.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([invoiceId, count]) => ({ invoiceId, count }));
}

async function main() {
  const apply = isApplyMode();

  const placeholders = await prisma.fileDocument.findMany({
    where: {
      invoiceId: { not: null },
      size: 0,
      storageKey: { startsWith: 'invoices/' },
    },
    select: {
      id: true,
      invoiceId: true,
      storageKey: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const grouped = groupByInvoiceId(placeholders);

  console.log('[cleanup-invoice-placeholders] mode=', apply ? 'apply' : 'dry-run');
  console.log('[cleanup-invoice-placeholders] found=', placeholders.length);
  console.log('[cleanup-invoice-placeholders] byInvoiceId=', grouped.length);

  for (const entry of grouped) {
    console.log(`[cleanup-invoice-placeholders] invoice=${entry.invoiceId} count=${entry.count}`);
  }

  let deleted = 0;
  if (apply && placeholders.length > 0) {
    const result = await prisma.fileDocument.deleteMany({
      where: {
        id: { in: placeholders.map((item) => item.id) },
      },
    });
    deleted = result.count;
  }

  console.log('[cleanup-invoice-placeholders] deleted=', deleted);
}

main()
  .catch((error) => {
    console.error('[cleanup-invoice-placeholders] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
