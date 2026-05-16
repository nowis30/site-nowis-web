import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { workshopRequestInputSchema } from '@/features/workshops/schemas';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'workshopRequests', 'read');
  if (guard.error) return guard.error;

  try {
    const item = await prisma.workshopRequest.findUnique({
      where: { id: params.id },
      include: {
        organization: { select: { id: true, name: true } },
        contact: { select: { id: true, fullName: true, email: true, phone: true } },
        client: { select: { id: true, fullName: true, email: true, phone: true } },
        appointments: { select: { id: true, title: true, startAt: true, endAt: true, status: true, location: true }, orderBy: { startAt: 'asc' } },
        crmAppointments: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
            status: true,
            type: true,
            location: true,
            contactId: true,
            organizationId: true,
            songRequestId: true,
          },
          orderBy: { startAt: 'asc' },
        },
        commercialQuotes: {
          select: {
            id: true,
            quoteNumber: true,
            title: true,
            status: true,
            totalAmount: true,
            currency: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
      },
    });

    if (!item) return NextResponse.json({ error: 'Atelier introuvable' }, { status: 404 });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Lecture impossible' }, { status: 400 });
  }
}

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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'workshopRequests', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = workshopRequestInputSchema.parse(await request.json());
    const finalPrice = computeFinalPrice(payload);
    const existing = await prisma.workshopRequest.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        bookingProvider: true,
        bookingEventUri: true,
        bookingInviteeUri: true,
        bookingUrl: true,
        bookingSource: true,
        bookingSyncedAt: true,
        calendlyEventUri: true,
        calendlyInviteeUri: true,
        calendlyUrl: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Atelier introuvable' }, { status: 404 });
    }

    const bookingUrl = normalizeOptionalString(payload.bookingUrl) || normalizeOptionalString(payload.calendlyUrl) || existing.bookingUrl || existing.calendlyUrl;
    const bookingProvider = inferBookingProvider({
      explicitProvider: payload.bookingProvider || existing.bookingProvider || undefined,
      bookingUrl,
      legacyUrl: payload.calendlyUrl || existing.calendlyUrl,
    }) || existing.bookingProvider;

    const bookingEventUri = normalizeOptionalString(payload.bookingEventUri)
      || normalizeOptionalString(payload.calendlyEventUri)
      || existing.bookingEventUri
      || existing.calendlyEventUri;
    const bookingInviteeUri = normalizeOptionalString(payload.bookingInviteeUri)
      || normalizeOptionalString(payload.calendlyInviteeUri)
      || existing.bookingInviteeUri
      || existing.calendlyInviteeUri;
    const bookingSource = normalizeOptionalString(payload.bookingSource) || existing.bookingSource || 'CRM_MANUAL';
    const bookingSyncedAt = payload.bookingSyncedAt
      ? new Date(payload.bookingSyncedAt)
      : (bookingEventUri || bookingInviteeUri || bookingUrl ? new Date() : existing.bookingSyncedAt);

    const explicitLegacyProvided = Boolean(payload.calendlyEventUri || payload.calendlyInviteeUri || payload.calendlyUrl);
    const shouldWriteLegacyCalendly = bookingProvider === 'CALENDLY' || explicitLegacyProvided;
    const item = await prisma.workshopRequest.update({
      where: { id: params.id },
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
        calendlyEventUri: shouldWriteLegacyCalendly
          ? (normalizeOptionalString(payload.calendlyEventUri) || bookingEventUri || existing.calendlyEventUri)
          : existing.calendlyEventUri,
        calendlyInviteeUri: shouldWriteLegacyCalendly
          ? (normalizeOptionalString(payload.calendlyInviteeUri) || bookingInviteeUri || existing.calendlyInviteeUri)
          : existing.calendlyInviteeUri,
        calendlyUrl: shouldWriteLegacyCalendly
          ? (normalizeOptionalString(payload.calendlyUrl) || bookingUrl || existing.calendlyUrl)
          : existing.calendlyUrl,
        scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,
        startAt: payload.startAt ? new Date(payload.startAt) : null,
        endAt: payload.endAt ? new Date(payload.endAt) : null,
        durationMinutes: payload.durationMinutes ?? null,
        meetingType: normalizeOptionalString(payload.meetingType),
        audienceType: payload.audienceType,
        ageRange: normalizeOptionalString(payload.ageRange),
        estimatedParticipants: payload.estimatedParticipants ?? payload.participantEstimate ?? null,
        requestedDate: payload.requestedDate ? new Date(payload.requestedDate) : null,
        requestedTime: normalizeOptionalString(payload.requestedTime),
        preferredDays: payload.preferredDays,
        format: payload.format || toLegacyFormat(payload.deliveryFormat),
        location: normalizeOptionalString(payload.location) || normalizeOptionalString(payload.addressOrLocation),
        workshopTheme: payload.workshopTheme || payload.title,
        objectives: payload.objectives || payload.clientNotes || 'Atelier mis à jour depuis le CRM.',
        notes: normalizeOptionalString(payload.notes),
        status: payload.status || 'EN_ATTENTE_RDV',
      },
    });

    await prisma.activity.create({
      data: {
        type: 'NOTE',
        title: 'Atelier modifié',
        description: `Atelier ${item.title} mis à jour depuis la fiche atelier.`,
        contactId: item.contactId || item.clientId || null,
        relatedType: 'WORKSHOP_REQUEST',
        relatedId: item.id,
        relatedUrl: `/crm/workshop-requests/${item.id}`,
        userId: guard.session.sub,
      },
    }).catch(() => undefined);

    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module ateliers n’est pas encore disponible sur cette base de données.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'workshopRequests', 'delete');
  if (guard.error) return guard.error;

  if (guard.session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Action réservée à un administrateur' }, { status: 403 });
  }

  try {
    await prisma.workshopRequest.update({
      where: { id: params.id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        deletedBy: guard.session.sub,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module ateliers n’est pas encore disponible sur cette base de données.' }, { status: 503 });
    }

    throw error;
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'workshopRequests', 'update');
  if (guard.error) return guard.error;

  if (guard.session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Action réservée à un administrateur' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    reason?: string;
    status?: string;
    organizationId?: string | null;
    contactId?: string | null;
    organizationContactId?: string | null;
    clientId?: string | null;
    contactPerson?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    location?: string | null;
    requestedDate?: string | null;
    requestedTime?: string | null;
    scheduledAt?: string | null;
    startAt?: string | null;
    endAt?: string | null;
    durationMinutes?: number | null;
    meetingType?: string | null;
    internalNotes?: string | null;
    clientNotes?: string | null;
    finalPrice?: number | null;
    linkedAppointmentId?: string | null;
    groupType?: string | null;
    residenceName?: string | null;
    residenceUnit?: string | null;
    seniorsProfile?: string | null;
    coordinatorName?: string | null;
    coordinatorRole?: string | null;
    coordinatorEmail?: string | null;
    coordinatorPhone?: string | null;
  };
  const action = body.action;
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : null;
  const statusValues = ['BROUILLON', 'EN_ATTENTE_RDV', 'RDV_PLANIFIE', 'CONFIRME', 'TERMINE', 'ANNULE', 'DELETED', 'NEW', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const;
  const nextStatus = typeof body.status === 'string' && (statusValues as readonly string[]).includes(body.status)
    ? body.status as (typeof statusValues)[number]
    : undefined;

  if (!action) {
    try {
      const item = await prisma.workshopRequest.update({
        where: { id: params.id },
        data: {
          status: nextStatus,
          organizationId: body.organizationId || null,
          contactId: body.contactId || null,
          organizationContactId: body.organizationContactId || null,
          clientId: body.clientId || null,
          groupType: normalizeOptionalString(body.groupType || undefined),
          contactPerson: normalizeOptionalString(body.contactPerson || undefined),
          contactEmail: normalizeOptionalString(body.contactEmail || undefined),
          contactPhone: normalizeOptionalString(body.contactPhone || undefined),
          residenceName: normalizeOptionalString(body.residenceName || undefined),
          residenceUnit: normalizeOptionalString(body.residenceUnit || undefined),
          seniorsProfile: normalizeOptionalString(body.seniorsProfile || undefined),
          coordinatorName: normalizeOptionalString(body.coordinatorName || undefined),
          coordinatorRole: normalizeOptionalString(body.coordinatorRole || undefined),
          coordinatorEmail: normalizeOptionalString(body.coordinatorEmail || undefined),
          coordinatorPhone: normalizeOptionalString(body.coordinatorPhone || undefined),
          location: normalizeOptionalString(body.location || undefined),
          requestedDate: body.requestedDate ? new Date(body.requestedDate) : null,
          requestedTime: normalizeOptionalString(body.requestedTime || undefined),
          scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
          startAt: body.startAt ? new Date(body.startAt) : null,
          endAt: body.endAt ? new Date(body.endAt) : null,
          durationMinutes: typeof body.durationMinutes === 'number' ? body.durationMinutes : null,
          meetingType: normalizeOptionalString(body.meetingType || undefined),
          internalNotes: normalizeOptionalString(body.internalNotes || undefined),
          clientNotes: normalizeOptionalString(body.clientNotes || undefined),
          finalPrice: typeof body.finalPrice === 'number' ? body.finalPrice : undefined,
        },
      });

      if (body.linkedAppointmentId) {
        await prisma.appointment.update({
          where: { id: body.linkedAppointmentId },
          data: {
            workshopRequestId: item.id,
            contactId: item.contactId || item.clientId || null,
            organizationId: item.organizationId || null,
          },
        }).catch(() => undefined);
      }

      await prisma.activity.create({
        data: {
          type: 'APPOINTMENT',
          title: 'Demande d’atelier modifiée par l’admin',
          description: `Atelier ${item.title} mis à jour depuis le CRM.`,
          contactId: item.contactId || item.clientId || null,
          relatedType: 'WORKSHOP_REQUEST',
          relatedId: item.id,
          relatedUrl: `/crm/workshop-requests/${item.id}`,
          userId: guard.session.sub,
        },
      }).catch(() => undefined);

      return NextResponse.json({ item });
    } catch {
      return NextResponse.json({ error: 'Modification impossible' }, { status: 400 });
    }
  }

  if (!['archive', 'restore', 'delete'].includes(action)) {
    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  }

  const data =
    action === 'restore'
      ? { status: 'EN_ATTENTE_RDV' as const, deletedAt: null, deletedBy: null, deleteReason: null }
      : action === 'archive'
        ? { status: 'TERMINE' as const, deletedAt: null, deletedBy: null, deleteReason: null }
        : { status: 'DELETED' as const, deletedAt: new Date(), deletedBy: guard.session.sub, deleteReason: reason };

  try {
    const item = await prisma.workshopRequest.update({ where: { id: params.id }, data });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Action impossible' }, { status: 400 });
  }
}
