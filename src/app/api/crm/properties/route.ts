import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { propertyInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'properties', 'read');
  if (guard.error) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const items = await prisma.property.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
            { city: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'properties', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = propertyInputSchema.parse(await request.json());
    const item = await prisma.property.create({
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
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}
