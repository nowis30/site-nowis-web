import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { workshopRequestInputSchema } from '@/features/workshops/schemas';

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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'workshopRequests', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = workshopRequestInputSchema.parse(await request.json());
    const finalPrice = computeFinalPrice(payload);
    const item = await prisma.workshopRequest.update({
      where: { id: params.id },
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
        calendlyUrl: normalizeOptionalString(payload.calendlyUrl),
        scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,
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

  const body = (await request.json().catch(() => ({}))) as { action?: string; reason?: string };
  const action = body.action;
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : null;

  if (!action || !['archive', 'restore', 'delete'].includes(action)) {
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
