import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { unitInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'units', 'read');
  if (guard.error) return guard.error;
  const item = await prisma.unit.findUnique({
    where: { id: params.id },
    include: { property: { select: { id: true, name: true, code: true } } },
  });
  if (!item) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'units', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = unitInputSchema.parse(await request.json());
    const item = await prisma.unit.update({
      where: { id: params.id },
      data: {
        propertyId: payload.propertyId,
        unitNumber: payload.unitNumber.trim(),
        floor: normalizeOptionalString(payload.floor),
        bedrooms: payload.bedrooms,
        bathrooms: payload.bathrooms,
        areaSqft: payload.areaSqft ?? null,
        monthlyRent: payload.monthlyRent,
        status: payload.status,
      },
      include: {
        property: { select: { id: true, name: true, code: true } },
      },
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'units', 'delete');
  if (guard.error) return guard.error;

  try {
    await prisma.unit.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Suppression impossible' }, { status: 400 });
  }
}
