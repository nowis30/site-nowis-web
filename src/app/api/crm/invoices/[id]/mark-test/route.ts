import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { logCleanupActivity, checkInvoiceDeletable } from '@/lib/cleanup-actions';
import { z } from 'zod';

const bodySchema = z.object({ reason: z.string().optional() });

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'invoices', 'update');
  if (guard.error) return guard.error;

  const body = bodySchema.safeParse(await request.json().catch(() => ({})));

  const item = await prisma.invoice.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      number: true,
      status: true,
      paypalStatus: true,
      paypalInvoiceId: true,
      paypalPaidAt: true,
      deletedAt: true,
      contactId: true,
    },
  });
  if (!item) return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 });
  if (item.deletedAt) return NextResponse.json({ error: 'Facture déjà supprimée.' }, { status: 409 });

  // On ne peut pas marquer "test" une facture payée en production
  const safety = checkInvoiceDeletable(item);
  if (!safety.canDelete) {
    return NextResponse.json({ error: safety.reason }, { status: 409 });
  }

  const updated = await prisma.invoice.update({
    where: { id: params.id },
    data: {
      isTest: true,
      testReason: body.success ? (body.data.reason ?? null) : null,
      archivedAt: null,
      restoredAt: null,
    },
  });

  await logCleanupActivity({
    action: 'MARK_TEST',
    module: 'INVOICE',
    itemId: item.id,
    itemLabel: `Facture ${item.number}`,
    userId: guard.session.sub,
    reason: body.success ? body.data.reason : undefined,
    contactId: item.contactId,
  });

  return NextResponse.json({ item: updated });
}
