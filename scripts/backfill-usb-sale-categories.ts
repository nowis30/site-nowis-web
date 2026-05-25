import { prisma } from '@/lib/prisma';

type Candidate = {
  id: string;
  entryDate: Date;
  category: string;
  description: string | null;
  counterpartyName: string | null;
  inventoryMovements: Array<{
    id: string;
    inventoryItem: {
      id: string;
      sku: string;
      label: string;
      category: string;
    };
  }>;
};

type MatchReason =
  | 'inventory_sku_usb'
  | 'inventory_category_usb_key'
  | 'inventory_label_contains_usb';

type MatchedEntry = {
  entry: Candidate;
  reasons: MatchReason[];
};

const USB_SKUS = new Set(['USB-2GB', 'USB-16GB']);

function hasUsbInLabel(label: string) {
  const normalized = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return normalized.includes('usb') || normalized.includes('cle usb') || normalized.includes('cle- usb');
}

function classify(entry: Candidate): MatchedEntry | null {
  const reasons = new Set<MatchReason>();

  for (const movement of entry.inventoryMovements) {
    const item = movement.inventoryItem;
    if (USB_SKUS.has(item.sku)) {
      reasons.add('inventory_sku_usb');
    }
    if (item.category === 'USB_KEY') {
      reasons.add('inventory_category_usb_key');
    }
    if (hasUsbInLabel(item.label)) {
      reasons.add('inventory_label_contains_usb');
    }
  }

  if (reasons.size === 0) return null;
  return {
    entry,
    reasons: Array.from(reasons),
  };
}

function toPreviewRow(match: MatchedEntry) {
  const item = match.entry.inventoryMovements[0]?.inventoryItem;
  return {
    id: match.entry.id,
    date: match.entry.entryDate.toISOString(),
    fromCategory: match.entry.category,
    toCategory: 'USB_KEY',
    reasons: match.reasons,
    inventorySku: item?.sku ?? null,
    inventoryLabel: item?.label ?? null,
    inventoryCategory: item?.category ?? null,
    description: match.entry.description,
  };
}

async function run() {
  const apply = process.argv.includes('--apply');

  const otherSales = await prisma.financeEntry.findMany({
    where: {
      kind: 'SALE',
      category: 'OTHER',
    },
    select: {
      id: true,
      entryDate: true,
      category: true,
      description: true,
      counterpartyName: true,
      inventoryMovements: {
        select: {
          id: true,
          inventoryItem: {
            select: {
              id: true,
              sku: true,
              label: true,
              category: true,
            },
          },
        },
      },
    },
    orderBy: { entryDate: 'desc' },
  });

  const withInventoryLink = otherSales.filter((entry) => entry.inventoryMovements.length > 0);
  const matched = withInventoryLink
    .map((entry) => classify(entry))
    .filter((value): value is MatchedEntry => Boolean(value));

  const idsToUpdate = matched.map((m) => m.entry.id);

  console.log('=== Backfill USB sale categories ===');
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Sales with category OTHER: ${otherSales.length}`);
  console.log(`Sales with inventory link: ${withInventoryLink.length}`);
  console.log(`Sales clearly identified as USB: ${matched.length}`);
  console.log('Criteria used:');
  console.log('- inventory_sku_usb: linked inventory SKU is USB-2GB or USB-16GB');
  console.log('- inventory_category_usb_key: linked inventory category is USB_KEY');
  console.log('- inventory_label_contains_usb: linked inventory label contains USB/cle USB');

  const preview = matched.slice(0, 25).map(toPreviewRow);
  console.log('Preview (max 25 rows):');
  console.log(JSON.stringify(preview, null, 2));

  if (!apply) {
    console.log('Dry-run complete. No data changed.');
    return;
  }

  if (idsToUpdate.length === 0) {
    console.log('No rows to update.');
    return;
  }

  const result = await prisma.financeEntry.updateMany({
    where: {
      id: { in: idsToUpdate },
      kind: 'SALE',
      category: 'OTHER',
    },
    data: {
      category: 'USB_KEY',
    },
  });

  const remainingOtherUsbLike = await prisma.financeEntry.count({
    where: {
      kind: 'SALE',
      category: 'OTHER',
      id: { in: idsToUpdate },
    },
  });

  console.log('Apply complete.');
  console.log(`Rows targeted: ${idsToUpdate.length}`);
  console.log(`Rows updated: ${result.count}`);
  console.log(`Target rows still OTHER after update: ${remainingOtherUsbLike}`);
}

run()
  .catch((error) => {
    console.error('[BACKFILL_USB_SALE_CATEGORIES]', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
