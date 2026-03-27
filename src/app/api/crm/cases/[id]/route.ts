import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { caseInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'cases', 'read');
  if (guard.error) return guard.error;
  const item = await prisma.caseRecord.findUnique({
    where: { id: params.id },
    include: { contact: { select: { id: true, fullName: true, email: true } } },
  });
  if (!item) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'cases', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = caseInputSchema.parse(await request.json());
    const item = await prisma.caseRecord.update({
      where: { id: params.id },
      data: {
        title: payload.title.trim(),
        type: payload.type,
        status: payload.status,
        referenceCode: payload.referenceCode.trim(),
        description: normalizeOptionalString(payload.description),
        contactId: normalizeOptionalString(payload.contactId),
      },
      include: {
        contact: { select: { id: true, fullName: true } },
      },
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'cases', 'delete');
  if (guard.error) return guard.error;

  try {
    await prisma.caseRecord.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Suppression impossible' }, { status: 400 });
  }
}
