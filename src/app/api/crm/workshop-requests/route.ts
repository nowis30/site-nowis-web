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

function normalizeWorkshopGroupType(item: {
  groupType: string | null;
  targetAudience: string;
  workshopType: string;
  organizationName: string | null;
}) {
  if (item.groupType) return item.groupType;
  if (item.targetAudience === 'PERSONNES_AGEES') return 'AINES_RESIDENCE';
  if (item.workshopType === 'CLIENT') return 'PRIVE';
  const name = (item.organizationName || '').toLowerCase();
  if (name.includes('ecole') || name.includes('école')) return 'ECOLE';
  if (name.includes('residence') || name.includes('résidence')) return 'AINES_RESIDENCE';
  return 'COMMUNAUTAIRE';
}

function inferBookingProvider(input: { explicitProvider?: string; bookingUrl?: string | null; legacyUrl?: string | null }) {
  const explicit = input.explicitProvider?.trim().toUpperCase();
  if (explicit === 'GOOGLE' || explicit === 'MICROSOFT' || explicit === 'CALENDLY' || explicit === 'ICLOUD') {
    return explicit as 'GOOGLE' | 'MICROSOFT' | 'CALENDLY' | 'ICLOUD';
  }

  const url = (input.bookingUrl || input.legacyUrl || '').toLowerCase();
  if (url.includes('calendly.com')) return 'CALENDLY';
  if (url.includes('calendar.google.com')) return 'GOOGLE';
  return null;
}

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'workshopRequests', 'read');
  if (guard.error) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const status = request.nextUrl.searchParams.get('status')?.trim();
  const category = request.nextUrl.searchParams.get('category')?.trim();
  const allowedCategories = new Set(['AINES_RESIDENCE', 'ECOLE', 'ENTREPRISE', 'COMMUNAUTAIRE', 'PRIVE', 'AUTRE']);
  const workshopStatuses = new Set(['NEW', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'BROUILLON', 'EN_ATTENTE_RDV', 'RDV_PLANIFIE', 'CONFIRME', 'TERMINE', 'ANNULE', 'DELETED']);
  try {
    const rawItems = await prisma.workshopRequest.findMany({
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

    const items = rawItems.map((item) => ({
      ...item,
      groupType: normalizeWorkshopGroupType({
        groupType: item.groupType,
        targetAudience: item.targetAudience,
        workshopType: item.workshopType,
        organizationName: item.organizationName,
      }),
    }));

    const filteredItems = category && allowedCategories.has(category)
      ? items.filter((item) => item.groupType === category)
      : items;
    return NextResponse.json({ items: filteredItems });
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

    const bookingUrl = payload.bookingUrl || payload.calendlyUrl || buildWorkshopBookingUrlWithPrefill({
      name: payload.contactPerson,
      email: payload.contactEmail,
      notes: payload.title,
    });

    const bookingProvider = inferBookingProvider({
      explicitProvider: payload.bookingProvider,
      bookingUrl,
      legacyUrl: payload.calendlyUrl,
    });

    const bookingEventUri = normalizeOptionalString(payload.bookingEventUri) || normalizeOptionalString(payload.calendlyEventUri);
    const bookingInviteeUri = normalizeOptionalString(payload.bookingInviteeUri) || normalizeOptionalString(payload.calendlyInviteeUri);
    const bookingSource = normalizeOptionalString(payload.bookingSource) || 'CRM_MANUAL';
    const bookingSyncedAt = payload.bookingSyncedAt ? new Date(payload.bookingSyncedAt) : (bookingEventUri || bookingInviteeUri || bookingUrl ? new Date() : null);
    const shouldWriteLegacyCalendly = bookingProvider === 'CALENDLY' || Boolean(payload.calendlyEventUri || payload.calendlyInviteeUri || payload.calendlyUrl);

    const item = await prisma.workshopRequest.create({
      data: {
        organizationId: payload.organizationId || null,
        contactId: payload.contactId || null,
        clientId: payload.clientId || null,
        organizationContactId: payload.organizationContactId || null,
        title: payload.title,
        workshopType: payload.workshopType,
        groupType: payload.groupType || null,
        organizationName: normalizeOptionalString(payload.organizationName),
        contactPerson: normalizeOptionalString(payload.contactPerson),
        contactPhone: normalizeOptionalString(payload.contactPhone),
        contactEmail: normalizeOptionalString(payload.contactEmail),
        residenceName: normalizeOptionalString(payload.residenceName),
        residenceUnit: normalizeOptionalString(payload.residenceUnit),
        seniorsProfile: normalizeOptionalString(payload.seniorsProfile),
        coordinatorName: normalizeOptionalString(payload.coordinatorName),
        coordinatorRole: normalizeOptionalString(payload.coordinatorRole),
        coordinatorEmail: normalizeOptionalString(payload.coordinatorEmail),
        coordinatorPhone: normalizeOptionalString(payload.coordinatorPhone),
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
        bookingProvider,
        bookingEventUri,
        bookingInviteeUri,
        bookingUrl,
        bookingSource,
        bookingSyncedAt,
        bookingRawPayload: Prisma.JsonNull,
        calendlyEventUri: shouldWriteLegacyCalendly ? (normalizeOptionalString(payload.calendlyEventUri) || bookingEventUri) : null,
        calendlyInviteeUri: shouldWriteLegacyCalendly ? (normalizeOptionalString(payload.calendlyInviteeUri) || bookingInviteeUri) : null,
        calendlyUrl: shouldWriteLegacyCalendly ? (normalizeOptionalString(payload.calendlyUrl) || bookingUrl) : null,
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
          startAt: payload.startAt ? new Date(payload.startAt) : null,
          endAt: payload.endAt ? new Date(payload.endAt) : null,
          durationMinutes: payload.durationMinutes ?? null,
          meetingType: normalizeOptionalString(payload.meetingType),
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
