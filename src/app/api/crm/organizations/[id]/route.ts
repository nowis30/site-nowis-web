import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { organizationInputSchema } from '@/features/workshops/schemas';

function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'organizations', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = organizationInputSchema.parse(await request.json());
    const item = await prisma.organization.update({
      where: { id: params.id },
      data: {
        name: payload.name,
        type: payload.type,
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
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module organisations n’est pas encore disponible sur cette base de données.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'organizations', 'delete');
  if (guard.error) return guard.error;

  if (guard.session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Action réservée à un administrateur' }, { status: 403 });
  }

  try {
    await prisma.organization.update({
      where: { id: params.id },
      data: {
        crmStatus: 'DELETED',
        deletedAt: new Date(),
        deletedBy: guard.session.sub,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module organisations n’est pas encore disponible sur cette base de données.' }, { status: 503 });
    }

    throw error;
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'organizations', 'update');
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
      ? { crmStatus: 'ACTIVE', deletedAt: null, deletedBy: null, deleteReason: null }
      : action === 'archive'
        ? { crmStatus: 'ARCHIVED', deletedAt: null, deletedBy: null, deleteReason: null }
        : { crmStatus: 'DELETED', deletedAt: new Date(), deletedBy: guard.session.sub, deleteReason: reason };

  try {
    const item = await prisma.organization.update({ where: { id: params.id }, data });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Action impossible' }, { status: 400 });
  }
}
