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
    const view = request.nextUrl.searchParams.get('view')?.trim().toLowerCase() || 'active';

    const lifecycleWhere =
      view === 'deleted'
        ? { crmStatus: 'DELETED' as const }
        : view === 'archived'
          ? { crmStatus: 'ARCHIVED' as const }
          : { crmStatus: { not: 'DELETED' as const } };

    const items = await prisma.contact.findMany({
      where: {
        ...lifecycleWhere,
        ...(q
          ? {
              OR: [
                { fullName: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
                {
                  organizationLinks: {
                    some: {
                      organization: {
                        name: { contains: q, mode: 'insensitive' },
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        organizationLinks: {
          take: 1,
          include: {
            organization: {
              select: { id: true, name: true, city: true, address: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        activities: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        appointments: {
          where: { startAt: { gte: new Date() } },
          select: { startAt: true },
          orderBy: { startAt: 'asc' },
          take: 1,
        },
        workshopRequests: {
          where: { status: { not: 'DELETED' } },
          select: { title: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        workshopClientRequests: {
          where: { status: { not: 'DELETED' } },
          select: { title: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        invoices: {
          where: { status: { in: ['DRAFT', 'SENT', 'OVERDUE'] } },
          select: { id: true },
        },
        inquiries: {
          where: { submissionStatus: { in: ['NOUVEAU', 'LU', 'TRAITE'] } },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      items: items.map((item) => ({
        ...item,
        organizationId: item.organizationLinks[0]?.organization?.id ?? null,
        organizationName: item.organizationLinks[0]?.organization?.name ?? null,
        city: item.organizationLinks[0]?.organization?.city ?? null,
        shortAddress: item.organizationLinks[0]?.organization?.address ?? null,
        lastActivityAt: item.activities[0]?.createdAt ?? null,
        nextAppointmentAt: item.appointments[0]?.startAt ?? null,
        linkedWorkshopTitle: item.workshopRequests[0]?.title ?? item.workshopClientRequests[0]?.title ?? null,
        activeCommercialItems: `${item.invoices.length} facture(s) · ${item.inquiries.length} soumission(s)`,
      })),
    });
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
        crmStatus: 'ACTIVE',
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
