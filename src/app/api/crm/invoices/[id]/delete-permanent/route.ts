import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { logCleanupActivity, checkInvoiceDeletable } from '@/lib/cleanup-actions';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'invoices', 'delete');
  if (guard.error) return guard.error;

  if (guard.session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Action réservée à un administrateur.' }, { status: 403 });
  }

  const item = await prisma.invoice.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      number: true,
      status: true,
      isTest: true,
      archivedAt: true,
      deletedAt: true,
      paypalStatus: true,
      paypalInvoiceId: true,
      paypalPaidAt: true,
      contactId: true,
    },
  });
  if (!item) return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 });

  // Vérification de sécurité : factures payées ou liées à PayPal live
  const safety = checkInvoiceDeletable(item);
  if (!safety.canDelete) {
    return NextResponse.json({ error: safety.reason }, { status: 409 });
  }

  if (!item.isTest && !item.archivedAt && !item.deletedAt) {
    return NextResponse.json(
      { error: 'Seules les factures marquées test, archivées ou supprimées peuvent être supprimées définitivement.' },
      { status: 409 },
    );
  }

  await logCleanupActivity({
    action: 'DELETE_PERMANENT',
    module: 'INVOICE',
    itemId: item.id,
    itemLabel: `Facture ${item.number}`,
    userId: guard.session.sub,
    contactId: item.contactId,
  });

  await prisma.invoice.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
