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

  try {
    await prisma.workshopRequest.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module ateliers n’est pas encore disponible sur cette base de données.' }, { status: 503 });
    }

    throw error;
  }
}
