import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { logCleanupActivity } from '@/lib/cleanup-actions';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'workshopRequests', 'update');
  if (guard.error) return guard.error;

  const item = await prisma.workshopRequest.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, deletedAt: true, archivedAt: true, isTest: true, contactId: true },
  });
  if (!item) return NextResponse.json({ error: 'Atelier introuvable.' }, { status: 404 });
  if (!item.archivedAt && !item.isTest && !item.deletedAt) {
    return NextResponse.json({ error: 'Atelier déjà actif.' }, { status: 409 });
  }

  const updated = await prisma.workshopRequest.update({
    where: { id: params.id },
    data: {
      isTest: false,
      testReason: null,
      archivedAt: null,
      archivedById: null,
      deletedAt: null,
      deletedBy: null,
      deleteReason: null,
      restoredAt: new Date(),
      restoredById: guard.session.sub,
    },
  });

  await logCleanupActivity({
    action: 'RESTORE',
    module: 'WORKSHOP_REQUEST',
    itemId: item.id,
    itemLabel: item.title,
    userId: guard.session.sub,
    contactId: item.contactId,
  });

  return NextResponse.json({ item: updated });
}
