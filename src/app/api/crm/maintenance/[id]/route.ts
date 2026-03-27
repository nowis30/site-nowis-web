import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { maintenanceInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'maintenance', 'read');
  if (guard.error) return guard.error;
  const item = await prisma.maintenanceTicket.findUnique({
    where: { id: params.id },
    include: {
      property: { select: { id: true, name: true } },
      unit: { select: { id: true, unitNumber: true } },
      tenant: { select: { id: true, contact: { select: { fullName: true, email: true } } } },
    },
  });
  if (!item) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'maintenance', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = maintenanceInputSchema.parse(await request.json());
    const item = await prisma.maintenanceTicket.update({
      where: { id: params.id },
      data: {
        propertyId: payload.propertyId,
        unitId: normalizeOptionalString(payload.unitId),
        tenantId: normalizeOptionalString(payload.tenantId),
        title: payload.title.trim(),
        description: normalizeOptionalString(payload.description),
        priority: payload.priority,
        status: payload.status,
      },
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, unitNumber: true } },
        tenant: { select: { id: true, contact: { select: { fullName: true } } } },
      },
    });

    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'maintenance', 'delete');
  if (guard.error) return guard.error;

  try {
    await prisma.maintenanceTicket.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Suppression impossible' }, { status: 400 });
  }
}
