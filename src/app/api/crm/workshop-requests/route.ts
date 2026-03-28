import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { workshopRequestInputSchema } from '@/features/workshops/schemas';

function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'workshopRequests', 'read');
  if (guard.error) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  try {
    const items = await prisma.workshopRequest.findMany({
      where: q ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { workshopTheme: { contains: q, mode: 'insensitive' } },
          { organization: { name: { contains: q, mode: 'insensitive' } } },
        ],
      } : {},
      include: {
        organization: { select: { name: true } },
        contact: { select: { fullName: true } },
        organizationContact: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ items: [], unavailable: true });
    }

    throw error;
  }
}

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'workshopRequests', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = workshopRequestInputSchema.parse(await request.json());
    const item = await prisma.workshopRequest.create({
      data: {
        organizationId: payload.organizationId,
        contactId: payload.contactId || null,
        organizationContactId: payload.organizationContactId || null,
        title: payload.title,
        audienceType: payload.audienceType,
        ageRange: normalizeOptionalString(payload.ageRange),
        estimatedParticipants: payload.estimatedParticipants ?? null,
        requestedDate: payload.requestedDate ? new Date(payload.requestedDate) : null,
        requestedTime: normalizeOptionalString(payload.requestedTime),
        preferredDays: payload.preferredDays,
        format: payload.format,
        location: normalizeOptionalString(payload.location),
        workshopTheme: payload.workshopTheme,
        objectives: payload.objectives,
        notes: normalizeOptionalString(payload.notes),
        status: payload.status,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module ateliers n’est pas encore disponible sur cette base de données.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}
