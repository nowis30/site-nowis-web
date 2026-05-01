import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'activities', 'update');
  if (guard.error) return guard.error;

  if (guard.session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Action réservée à un administrateur' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { action?: string; reason?: string };
  const action = body.action;
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : null;

  if (!action || !['mark_read', 'process', 'archive', 'delete', 'restore'].includes(action)) {
    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  }

  const data =
    action === 'mark_read'
      ? { submissionStatus: 'LU' as const }
      : action === 'process'
        ? { submissionStatus: 'TRAITE' as const }
        : action === 'archive'
          ? { submissionStatus: 'ARCHIVE' as const }
          : action === 'restore'
            ? { submissionStatus: 'NOUVEAU' as const, deletedAt: null, deletedBy: null, deleteReason: null }
            : { submissionStatus: 'SUPPRIME' as const, deletedAt: new Date(), deletedBy: guard.session.sub, deleteReason: reason };

  const item = await prisma.inquiry.update({
    where: { id: params.id },
    data,
    include: {
      contact: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });

  return NextResponse.json({ item });
}
