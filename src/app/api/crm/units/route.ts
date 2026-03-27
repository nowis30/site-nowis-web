import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { unitInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'units', 'read');
  if (guard.error) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const items = await prisma.unit.findMany({
    where: q
      ? {
          OR: [
            { unitNumber: { contains: q, mode: 'insensitive' } },
            { property: { name: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : undefined,
    include: {
      property: { select: { id: true, name: true, code: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'units', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = unitInputSchema.parse(await request.json());
    const item = await prisma.unit.create({
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
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}
