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
  const view = request.nextUrl.searchParams.get('view')?.trim().toLowerCase() || 'active';
  try {
    const items = await prisma.organization.findMany({
      where: {
        ...(view === 'deleted'
          ? { crmStatus: 'DELETED' }
          : view === 'archived'
            ? { crmStatus: 'ARCHIVED' }
            : { crmStatus: { not: 'DELETED' } }),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
                {
                  contacts: {
                    some: {
                      OR: [
                        { fullName: { contains: q, mode: 'insensitive' } },
                        { email: { contains: q, mode: 'insensitive' } },
                        { phone: { contains: q, mode: 'insensitive' } },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        contacts: { take: 1, orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
        workshopRequests: { select: { id: true } },
        workshopAppointments: {
          where: { startAt: { gte: new Date() } },
          select: { startAt: true },
          orderBy: { startAt: 'asc' },
          take: 1,
        },
        linkedCalendarExternalEvents: {
          where: { startAt: { gte: new Date() }, status: { not: 'DELETED' } },
          select: { startAt: true },
          orderBy: { startAt: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            contacts: true,
            workshopRequests: true,
          },
        },
      },
    });

    return NextResponse.json({ items: items.map((item) => ({
      ...item,
      primaryContact: item.contacts[0] || null,
      contactCount: item._count.contacts,
      workshopCount: item._count.workshopRequests,
      nextEventAt: item.workshopAppointments[0]?.startAt || item.linkedCalendarExternalEvents[0]?.startAt || null,
      activeCommercialItems: 'À lier via un contact',
      lastActivityAt: item.updatedAt,
    })) });
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
        crmStatus: 'ACTIVE',
        email: normalizeOptionalString(payload.email),
        phone: normalizeOptionalString(payload.phone),
        billingCompanyName: normalizeOptionalString(payload.billingCompanyName),
        billingLegalName: normalizeOptionalString(payload.billingLegalName),
        billingEmail: normalizeOptionalString(payload.billingEmail),
        billingPhone: normalizeOptionalString(payload.billingPhone),
        billingAddressLine1: normalizeOptionalString(payload.billingAddressLine1),
        billingAddressLine2: normalizeOptionalString(payload.billingAddressLine2),
        billingCity: normalizeOptionalString(payload.billingCity),
        billingState: normalizeOptionalString(payload.billingState),
        billingPostalCode: normalizeOptionalString(payload.billingPostalCode),
        billingCountry: normalizeOptionalString(payload.billingCountry),
        billingTaxId: normalizeOptionalString(payload.billingTaxId),
        billingNotes: normalizeOptionalString(payload.billingNotes),
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
