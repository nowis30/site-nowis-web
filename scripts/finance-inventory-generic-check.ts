import dotenv from 'dotenv';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signCrmToken } from '@/features/crm/auth/session';
import { POST as postInventory, PATCH as patchInventory } from '@/app/api/crm/finance/inventory/route';
import { POST as postEntry } from '@/app/api/crm/finance/entries/route';

dotenv.config({ path: '.env.local' });
dotenv.config();

type HandlerResult<T = unknown> = {
  status: number;
  body: T;
};

function makeRequest(url: string, token: string, payload: Record<string, unknown>, method: 'POST' | 'PATCH') {
  return new NextRequest(url, {
    method,
    headers: {
      'content-type': 'application/json',
      cookie: `crm_session=${token}`,
    },
    body: JSON.stringify(payload),
  });
}

async function callHandler<T = unknown>(
  handler: (request: NextRequest) => Promise<Response>,
  request: NextRequest,
): Promise<HandlerResult<T>> {
  const response = await handler(request);
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body: body as T };
}

async function run() {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true, role: true, email: true, fullName: true },
  });

  if (!admin) {
    throw new Error('Aucun admin actif trouvé pour les tests API finance.');
  }

  const token = signCrmToken({
    sub: admin.id,
    role: admin.role,
    email: admin.email,
    fullName: admin.fullName,
  });

  const runId = Date.now();
  const tshirtLabel = `T-shirt test ${runId}`;
  const speakerLabel = `Speaker test ${runId}`;

  const createTshirt = await callHandler<{ item?: { id: string } }>(
    postInventory,
    makeRequest('http://localhost/api/crm/finance/inventory', token, {
      label: tshirtLabel,
      category: 'TSHIRT',
      description: 'Produit test automatique',
      salePrice: 25,
      purchaseUnitCost: 10,
      quantityPurchased: 12,
      quantityRemaining: 12,
      lowStockThreshold: 3,
      active: true,
    }, 'POST'),
  );

  const createSpeaker = await callHandler<{ item?: { id: string } }>(
    postInventory,
    makeRequest('http://localhost/api/crm/finance/inventory', token, {
      label: speakerLabel,
      category: 'AUDIO_SPEAKER',
      description: 'Produit test automatique',
      salePrice: 89.99,
      purchaseUnitCost: 55,
      quantityPurchased: 5,
      quantityRemaining: 5,
      lowStockThreshold: 2,
      active: true,
    }, 'POST'),
  );

  if (!createTshirt.body.item?.id || !createSpeaker.body.item?.id) {
    throw new Error(`Creation produits de test échouée: ${JSON.stringify({ createTshirt, createSpeaker })}`);
  }

  const restockTshirt = await callHandler(
    patchInventory,
    makeRequest('http://localhost/api/crm/finance/inventory', token, {
      id: createTshirt.body.item.id,
      restockQuantity: 4,
      quantityRemaining: 16,
      salePrice: 25,
      purchaseUnitCost: 10,
      lowStockThreshold: 3,
      active: true,
    }, 'PATCH'),
  );

  const tshirtSale = await callHandler(
    postEntry,
    makeRequest('http://localhost/api/crm/finance/entries', token, {
      kind: 'SALE',
      inventoryItemId: createTshirt.body.item.id,
      quantity: 3,
      amountBeforeTax: 0,
      taxAmount: 0,
      paymentMethod: 'DEBIT',
      status: 'PAID',
      category: 'TSHIRT',
      counterpartyName: 'Client test',
    }, 'POST'),
  );

  const restockAfterSale = await callHandler(
    patchInventory,
    makeRequest('http://localhost/api/crm/finance/inventory', token, {
      id: createTshirt.body.item.id,
      restockQuantity: 2,
    }, 'PATCH'),
  );

  const tooHighSale = await callHandler(
    postEntry,
    makeRequest('http://localhost/api/crm/finance/entries', token, {
      kind: 'SALE',
      inventoryItemId: createSpeaker.body.item.id,
      quantity: 999,
      amountBeforeTax: 0,
      taxAmount: 0,
      paymentMethod: 'DEBIT',
      status: 'PAID',
      category: 'AUDIO_SPEAKER',
      counterpartyName: 'Client test',
    }, 'POST'),
  );

  const tshirtAfter = await prisma.financeInventoryItem.findUnique({
    where: { id: createTshirt.body.item.id },
    select: {
      label: true,
      category: true,
      quantityPurchased: true,
      quantitySold: true,
      quantityRemaining: true,
      lowStockThreshold: true,
      active: true,
    },
  });

  if (!tshirtAfter) {
    throw new Error('Produit T-shirt introuvable après scénario de test.');
  }

  if (tshirtAfter.quantitySold !== 3) {
    throw new Error(`quantitySold inattendu après réapprovisionnement: ${tshirtAfter.quantitySold} (attendu: 3)`);
  }

  if (!tshirtAfter.active) {
    throw new Error('Le produit ne doit pas devenir inactif après réapprovisionnement.');
  }

  if (tshirtAfter.quantityPurchased !== 18) {
    throw new Error(`quantityPurchased inattendu: ${tshirtAfter.quantityPurchased} (attendu: 18)`);
  }

  if (tshirtAfter.quantityRemaining !== 15) {
    throw new Error(`quantityRemaining inattendu: ${tshirtAfter.quantityRemaining} (attendu: 15)`);
  }

  const speakerAfter = await prisma.financeInventoryItem.findUnique({
    where: { id: createSpeaker.body.item.id },
    select: {
      label: true,
      quantityRemaining: true,
      active: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        createTshirtStatus: createTshirt.status,
        createSpeakerStatus: createSpeaker.status,
        restockTshirtStatus: restockTshirt.status,
        tshirtSaleStatus: tshirtSale.status,
        restockAfterSaleStatus: restockAfterSale.status,
        tooHighSaleStatus: tooHighSale.status,
        tooHighSaleBody: tooHighSale.body,
        tshirtAfter,
        speakerAfter,
      },
      null,
      2,
    ),
  );
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
