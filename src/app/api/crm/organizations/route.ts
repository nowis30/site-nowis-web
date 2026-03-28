import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { organizationInputSchema } from '@/features/workshops/schemas';

function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'organizations', 'read');
  if (guard.error) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  try {
    const items = await prisma.organization.findMany({
      where: q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { city: { contains: q, mode: 'insensitive' } }] } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        contacts: { take: 1, orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
        workshopRequests: { select: { id: true } },
      },
    });

    return NextResponse.json({ items: items.map((item) => ({ ...item, primaryContact: item.contacts[0] || null, requestCount: item.workshopRequests.length })) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ items: [], unavailable: true });
    }

    throw error;
  }
}

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'organizations', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = organizationInputSchema.parse(await request.json());
    const item = await prisma.organization.create({
      data: {
        name: payload.name,
        type: payload.type,
        email: normalizeOptionalString(payload.email),
        phone: normalizeOptionalString(payload.phone),
        address: normalizeOptionalString(payload.address),
        city: normalizeOptionalString(payload.city),
        notes: normalizeOptionalString(payload.notes),
        status: payload.status,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module organisations n’est pas encore disponible sur cette base de données.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}
