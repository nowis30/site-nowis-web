import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { workshopRequestInputSchema } from '@/features/workshops/schemas';
import { buildWorkshopBookingUrlWithPrefill } from '@/lib/booking-link';

function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function normalizeOptionalNumber(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toLegacyFormat(value?: string) {
  if (value === 'SUR_PLACE') return 'IN_PERSON';
  if (value === 'EN_LIGNE') return 'VIRTUAL';
  return 'HYBRID';
}

function getSiteBaseUrl(request: NextRequest) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    process.env.APP_URL;

  if (configured) return configured.replace(/\/+$/, '');

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  return host ? `${protocol}://${host}` : 'http://localhost:3000';
}

function computeFinalPrice(payload: {
  pricingMode?: string;
  basePrice?: number;
  discountPercent?: number;
  participantEstimate?: number;
  finalPrice?: number;
}) {
  if (typeof payload.finalPrice === 'number') {
    return Number(payload.finalPrice.toFixed(2));
  }

  const base = typeof payload.basePrice === 'number' ? payload.basePrice : 0;
  const qty = payload.pricingMode === 'PAR_PERSONNE' ? Math.max(1, payload.participantEstimate || 1) : 1;
  const subtotal = base * qty;
  const discount = Math.min(100, Math.max(0, payload.discountPercent || 0));
  const total = subtotal * (1 - discount / 100);
  return Number(total.toFixed(2));
}

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'workshopRequests', 'read');
  if (guard.error) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const status = request.nextUrl.searchParams.get('status')?.trim();
  const workshopStatuses = new Set(['NEW', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'BROUILLON', 'EN_ATTENTE_RDV', 'RDV_PLANIFIE', 'CONFIRME', 'TERMINE', 'ANNULE', 'DELETED']);
  try {
    const items = await prisma.workshopRequest.findMany({
      where: {
        ...(status
          ? status === 'ACTIFS'
            ? { status: { not: 'DELETED' } }
            : workshopStatuses.has(status)
              ? { status: status as 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'BROUILLON' | 'EN_ATTENTE_RDV' | 'RDV_PLANIFIE' | 'CONFIRME' | 'TERMINE' | 'ANNULE' | 'DELETED' }
              : { status: { not: 'DELETED' } }
          : { status: { not: 'DELETED' } }),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { workshopTheme: { contains: q, mode: 'insensitive' } },
                { organizationName: { contains: q, mode: 'insensitive' } },
                { contactPerson: { contains: q, mode: 'insensitive' } },
                { organization: { name: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        organization: { select: { id: true, name: true } },
        contact: { select: { id: true, fullName: true } },
        client: { select: { id: true, fullName: true } },
        organizationContact: { select: { id: true, contactId: true, fullName: true } },
        appointments: {
          select: { startAt: true },
          orderBy: { startAt: 'asc' },
          take: 1,
        },
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
    const finalPrice = computeFinalPrice(payload);
    const clientAccessToken = randomUUID();
    const siteBaseUrl = getSiteBaseUrl(request);
    const workshopPublicUrl = `${siteBaseUrl}/atelier/${clientAccessToken}`;

    const bookingUrl = payload.calendlyUrl || buildWorkshopBookingUrlWithPrefill({
      name: payload.contactPerson,
      email: payload.contactEmail,
      notes: payload.title,
    });

    const item = await prisma.workshopRequest.create({
      data: {
        organizationId: payload.organizationId || null,
        contactId: payload.contactId || null,
        clientId: payload.clientId || null,
        organizationContactId: payload.organizationContactId || null,
        title: payload.title,
        workshopType: payload.workshopType,
        organizationName: normalizeOptionalString(payload.organizationName),
        contactPerson: normalizeOptionalString(payload.contactPerson),
        contactPhone: normalizeOptionalString(payload.contactPhone),
        contactEmail: normalizeOptionalString(payload.contactEmail),
        addressOrLocation: normalizeOptionalString(payload.addressOrLocation),
        deliveryFormat: payload.deliveryFormat,
        participantEstimate: payload.participantEstimate ?? null,
        targetAudience: payload.targetAudience,
        durationPreset: payload.durationPreset,
        durationCustomMinutes: payload.durationCustomMinutes ?? null,
        pricingMode: payload.pricingMode,
        basePrice: normalizeOptionalNumber(payload.basePrice),
        discountPercent: normalizeOptionalNumber(payload.discountPercent),
        finalPrice,
        internalNotes: normalizeOptionalString(payload.internalNotes),
        clientNotes: normalizeOptionalString(payload.clientNotes),
        calendlyEventUri: normalizeOptionalString(payload.calendlyEventUri),
        calendlyInviteeUri: normalizeOptionalString(payload.calendlyInviteeUri),
        calendlyUrl: bookingUrl,
        scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,
        clientAccessToken,
        audienceType: payload.audienceType,
        ageRange: normalizeOptionalString(payload.ageRange),
        estimatedParticipants: payload.estimatedParticipants ?? payload.participantEstimate ?? null,
        requestedDate: payload.requestedDate ? new Date(payload.requestedDate) : null,
        requestedTime: normalizeOptionalString(payload.requestedTime),
        preferredDays: payload.preferredDays,
        format: payload.format || toLegacyFormat(payload.deliveryFormat),
        location: normalizeOptionalString(payload.location) || normalizeOptionalString(payload.addressOrLocation),
        workshopTheme: payload.workshopTheme || payload.title,
        objectives: payload.objectives || payload.clientNotes || 'Atelier créé depuis le CRM.',
        notes: normalizeOptionalString(payload.notes),
        status: payload.status || 'EN_ATTENTE_RDV',
      },
    });

    return NextResponse.json(
      {
        item,
        bookingUrl,
        workshopPublicUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module ateliers n’est pas encore disponible sur cette base de données.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}
