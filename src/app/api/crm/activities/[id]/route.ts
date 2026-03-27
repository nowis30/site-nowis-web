import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'activities', 'delete');
  if (guard.error) return guard.error;

  await prisma.activity.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
