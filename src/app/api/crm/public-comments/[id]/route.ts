import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

const ALLOWED_STATUS = ['APPROVED', 'REJECTED', 'ARCHIVED'] as const;
type AllowedStatus = (typeof ALLOWED_STATUS)[number];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = requireApiPermission(request, 'reviews', 'update');
  if (error) return error;

  const body = await request.json().catch(() => null) as { status?: string } | null;
  const status = body?.status;

  if (!status || !ALLOWED_STATUS.includes(status as AllowedStatus)) {
    return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 });
  }

  const now = new Date();
  const updated = await prisma.publicComment.update({
    where: { id: params.id },
    data: {
      status: status as AllowedStatus,
      approvedAt: status === 'APPROVED' ? now : null,
      rejectedAt: status === 'REJECTED' ? now : null,
    },
    select: {
      id: true,
      status: true,
      approvedAt: true,
      rejectedAt: true,
      updatedAt: true,
    },
  }).catch(() => null);

  if (!updated) {
    return NextResponse.json({ error: 'Commentaire introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ comment: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = requireApiPermission(request, 'reviews', 'delete');
  if (error) return error;

  if (session?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Action réservée à un administrateur.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { confirm?: boolean } | null;
  if (!body?.confirm) {
    return NextResponse.json({ error: 'Confirmation requise.' }, { status: 400 });
  }

  const deleted = await prisma.publicComment.delete({
    where: { id: params.id },
    select: { id: true },
  }).catch(() => null);

  if (!deleted) {
    return NextResponse.json({ error: 'Commentaire introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
