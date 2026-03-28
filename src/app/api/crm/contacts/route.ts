import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { contactInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'contacts', 'read');
  if (guard.error) return guard.error;

  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    const items = await prisma.contact.findMany({
      where: q
        ? {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('[CRM_CONTACTS_GET]', error);
    if (error instanceof Prisma.PrismaClientInitializationError) {
      // Fallback lisible pour eviter les boucles d'erreurs frontend quand la DB est indisponible.
      return NextResponse.json({ items: [], dbUnavailable: true }, { status: 200 });
    }
    return NextResponse.json({ error: 'Impossible de charger les contacts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'contacts', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = contactInputSchema.parse(await request.json());
    const item = await prisma.contact.create({
      data: {
        type: payload.type,
        fullName: payload.fullName.trim(),
        email: normalizeOptionalString(payload.email),
        phone: normalizeOptionalString(payload.phone),
        source: normalizeOptionalString(payload.source),
        tags: payload.tags,
        notes: normalizeOptionalString(payload.notes),
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}
