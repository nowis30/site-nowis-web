import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { logCleanupActivity } from '@/lib/cleanup-actions';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'activities', 'update');
  if (guard.error) return guard.error;

  const item = await prisma.inquiry.findUnique({
    where: { id: params.id },
    select: { id: true, subject: true, deletedAt: true, contactId: true },
  });
  if (!item) return NextResponse.json({ error: 'Soumission introuvable.' }, { status: 404 });
  if (item.deletedAt) return NextResponse.json({ error: 'Soumission déjà supprimée.' }, { status: 409 });

  const updated = await prisma.inquiry.update({
    where: { id: params.id },
    data: {
      archivedAt: new Date(),
      archivedById: guard.session.sub,
      restoredAt: null,
      restoredById: null,
    },
  });

  await logCleanupActivity({
    action: 'ARCHIVE',
    module: 'SUBMISSION',
    itemId: item.id,
    itemLabel: item.subject,
    userId: guard.session.sub,
    contactId: item.contactId,
  });

  return NextResponse.json({ item: updated });
}
