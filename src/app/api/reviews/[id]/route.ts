import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = requireApiPermission(request, 'reviews', 'update');
  if (error) return error;

  const { status } = await request.json();
  if (status !== 'approved' && status !== 'rejected') {
    return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 });
  }

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) {
    return NextResponse.json({ error: 'Avis introuvable.' }, { status: 404 });
  }

  const updated = await prisma.review.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = requireApiPermission(request, 'reviews', 'delete');
  if (error) return error;

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) {
    return NextResponse.json({ error: 'Avis introuvable.' }, { status: 404 });
  }

  await prisma.review.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
