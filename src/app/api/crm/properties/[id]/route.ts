import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { propertyInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'properties', 'read');
  if (guard.error) return guard.error;
  const item = await prisma.property.findUnique({
    where: { id: params.id },
    include: { units: { select: { id: true, unitNumber: true, status: true, monthlyRent: true } } },
  });
  if (!item) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'properties', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = propertyInputSchema.parse(await request.json());
    const item = await prisma.property.update({
      where: { id: params.id },
      data: {
        code: payload.code.trim(),
        name: payload.name.trim(),
        type: payload.type,
        addressLine1: payload.addressLine1.trim(),
        addressLine2: normalizeOptionalString(payload.addressLine2),
        city: payload.city.trim(),
        province: payload.province.trim(),
        postalCode: payload.postalCode.trim(),
        totalUnits: payload.totalUnits,
      },
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'properties', 'delete');
  if (guard.error) return guard.error;

  try {
    await prisma.property.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Suppression impossible' }, { status: 400 });
  }
}
