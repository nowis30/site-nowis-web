import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { normalizeIsoDate, normalizeOptionalString, tenantInputSchema } from '@/features/crm/server/validators';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'tenants', 'read');
  if (guard.error) return guard.error;
  const item = await prisma.tenant.findUnique({
    where: { id: params.id },
    include: {
      contact: { select: { id: true, fullName: true, email: true, phone: true } },
      unit: { select: { id: true, unitNumber: true, property: { select: { name: true, code: true } } } },
    },
  });
  if (!item) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'tenants', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = tenantInputSchema.parse(await request.json());
    const item = await prisma.tenant.update({
      where: { id: params.id },
      data: {
        contactId: payload.contactId,
        unitId: normalizeOptionalString(payload.unitId),
        emergencyContact: normalizeOptionalString(payload.emergencyContact),
        emergencyPhone: normalizeOptionalString(payload.emergencyPhone),
        moveInDate: normalizeIsoDate(payload.moveInDate),
        moveOutDate: normalizeIsoDate(payload.moveOutDate),
        isActive: payload.isActive,
      },
      include: {
        contact: { select: { id: true, fullName: true, email: true } },
        unit: { select: { id: true, unitNumber: true, property: { select: { name: true } } } },
      },
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'tenants', 'delete');
  if (guard.error) return guard.error;

  try {
    await prisma.tenant.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Suppression impossible' }, { status: 400 });
  }
}
