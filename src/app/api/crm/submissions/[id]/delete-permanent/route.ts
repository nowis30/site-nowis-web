import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { logCleanupActivity } from '@/lib/cleanup-actions';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'activities', 'delete');
  if (guard.error) return guard.error;

  if (guard.session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Action réservée à un administrateur.' }, { status: 403 });
  }

  const item = await prisma.inquiry.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      subject: true,
      isTest: true,
      archivedAt: true,
      deletedAt: true,
      submissionStatus: true,
      contactId: true,
    },
  });
  if (!item) return NextResponse.json({ error: 'Soumission introuvable.' }, { status: 404 });

  if (!item.isTest && !item.archivedAt && !item.deletedAt) {
    return NextResponse.json(
      { error: 'Seules les soumissions marquées test, archivées ou supprimées peuvent être supprimées définitivement.' },
      { status: 409 },
    );
  }

  if (item.submissionStatus === 'TRAITE') {
    return NextResponse.json(
      { error: 'Soumission traitée — veuillez d\'abord l\'archiver avant suppression définitive.' },
      { status: 409 },
    );
  }

  await logCleanupActivity({
    action: 'DELETE_PERMANENT',
    module: 'SUBMISSION',
    itemId: item.id,
    itemLabel: item.subject,
    userId: guard.session.sub,
    contactId: item.contactId,
  });

  await prisma.inquiry.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
