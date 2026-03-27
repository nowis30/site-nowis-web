import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { normalizeIsoDate, normalizeOptionalString, tenantInputSchema } from '@/features/crm/server/validators';

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'tenants', 'read');
  if (guard.error) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const items = await prisma.tenant.findMany({
    where: q
      ? {
          OR: [
            { contact: { fullName: { contains: q, mode: 'insensitive' } } },
            { unit: { unitNumber: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : undefined,
    include: {
      contact: { select: { id: true, fullName: true, email: true } },
      unit: { select: { id: true, unitNumber: true, property: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'tenants', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = tenantInputSchema.parse(await request.json());
    const item = await prisma.tenant.create({
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
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}
