import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { logCleanupActivity } from '@/lib/cleanup-actions';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'workshopRequests', 'delete');
  if (guard.error) return guard.error;

  if (guard.session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Action réservée à un administrateur.' }, { status: 403 });
  }

  const item = await prisma.workshopRequest.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, isTest: true, archivedAt: true, deletedAt: true, contactId: true },
  });
  if (!item) return NextResponse.json({ error: 'Atelier introuvable.' }, { status: 404 });

  if (!item.isTest && !item.archivedAt && !item.deletedAt) {
    return NextResponse.json(
      { error: 'Seuls les ateliers marqués test, archivés ou supprimés peuvent être supprimés définitivement.' },
      { status: 409 },
    );
  }

  await logCleanupActivity({
    action: 'DELETE_PERMANENT',
    module: 'WORKSHOP_REQUEST',
    itemId: item.id,
    itemLabel: item.title,
    userId: guard.session.sub,
    contactId: item.contactId,
  });

  await prisma.workshopRequest.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
