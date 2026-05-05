import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { canDeleteCommercialQuote, computeQuoteTotals } from '@/features/crm/commercial-quotes/quote-utils';
import { commercialQuotePatchSchema, normalizeOptionalString } from '@/features/crm/server/validators';
import { assertCanCreateQuoteForSongRequest, SongRequestQuoteGuardError } from '@/features/crm/server/song-request-quote-guards';
import { buildCustomerSnapshotFromContact, buildCustomerSnapshotFromOrganization } from '@/lib/billing-profile';
import { ensureQuoteFileDocument } from '@/features/crm/server/file-document-links';

async function resolveCustomerSnapshot(contactId?: string | null, organizationId?: string | null) {
  if (contactId) {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: {
        fullName: true,
        companyName: true,
        email: true,
        phone: true,
        billingCompanyName: true,
        billingLegalName: true,
        billingEmail: true,
        billingPhone: true,
        billingAddressLine1: true,
        billingAddressLine2: true,
        billingCity: true,
        billingState: true,
        billingPostalCode: true,
        billingCountry: true,
        billingTaxId: true,
        billingNotes: true,
      },
    });
    if (contact) return buildCustomerSnapshotFromContact(contact);
  }

  if (organizationId) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        billingCompanyName: true,
        billingLegalName: true,
        billingEmail: true,
        billingPhone: true,
        billingAddressLine1: true,
        billingAddressLine2: true,
        billingCity: true,
        billingState: true,
        billingPostalCode: true,
        billingCountry: true,
        billingTaxId: true,
        billingNotes: true,
      },
    });
    if (organization) return buildCustomerSnapshotFromOrganization(organization);
  }

  return null;
}

function ensureAdmin(request: NextRequest, action: 'read' | 'update' | 'delete') {
  const guard = requireApiPermission(request, 'commercialQuotes', action);
  if (guard.error) return { error: guard.error, session: null as null };
  if (guard.session.role !== 'ADMIN') {
    return {
      error: NextResponse.json({ error: 'Action réservée à un administrateur.' }, { status: 403 }),
      session: null as null,
    };
  }
  return { error: null, session: guard.session };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = ensureAdmin(request, 'read');
  if (admin.error) return admin.error;

  const item = await prisma.commercialQuote.findUnique({
    where: { id: params.id },
    include: {
      contact: { select: { id: true, fullName: true, email: true, phone: true } },
      organization: { select: { id: true, name: true, city: true, type: true } },
      workshopRequest: { select: { id: true, title: true, workshopTheme: true, finalPrice: true, requestedDate: true } },
      songRequest: { select: { id: true, title: true, songType: true, budget: true, desiredDeadline: true } },
      appointment: { select: { id: true, title: true, startAt: true, endAt: true, status: true } },
      convertedToInvoice: { select: { id: true, number: true, status: true } },
      lines: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!item) {
    return NextResponse.json({ error: 'Soumission commerciale introuvable.' }, { status: 404 });
  }

  return NextResponse.json({
    item: {
      ...item,
      subtotal: item.subtotal.toString(),
      taxAmount: item.taxAmount.toString(),
      totalAmount: item.totalAmount.toString(),
      lines: item.lines.map((line) => ({
        ...line,
        quantity: line.quantity.toString(),
        unitPrice: line.unitPrice.toString(),
        subtotal: line.subtotal.toString(),
      })),
    },
  });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = ensureAdmin(request, 'update');
  if (admin.error) return admin.error;

  try {
    const payload = commercialQuotePatchSchema.parse(await request.json());

    const current = await prisma.commercialQuote.findUnique({ where: { id: params.id } });
    if (!current) {
      return NextResponse.json({ error: 'Soumission commerciale introuvable.' }, { status: 404 });
    }

    const nextSongRequestId = payload.songRequestId !== undefined ? (payload.songRequestId || null) : current.songRequestId;
    if (nextSongRequestId) {
      await assertCanCreateQuoteForSongRequest(nextSongRequestId, current.id);
    }

    const nextContactId = payload.contactId !== undefined ? (payload.contactId || null) : current.contactId;
    const nextOrganizationId = payload.organizationId !== undefined ? (payload.organizationId || null) : current.organizationId;
    const customerSnapshot = await resolveCustomerSnapshot(nextContactId, nextOrganizationId);
    const taxesEnabled = current.taxesEnabled;
    const taxRateGst = current.taxRateGst ? Number(current.taxRateGst) : undefined;
    const taxRateQst = current.taxRateQst ? Number(current.taxRateQst) : undefined;
    const totals = payload.lines
      ? computeQuoteTotals(payload.lines, { taxesEnabled, gst: taxRateGst, qst: taxRateQst })
      : null;

    const item = await prisma.$transaction(async (tx) => {
      if (payload.lines) {
        await tx.commercialQuoteLine.deleteMany({ where: { quoteId: params.id } });
      }

      await tx.commercialQuote.update({
        where: { id: params.id },
        data: {
          title: payload.title ? payload.title.trim() : undefined,
          description: payload.description !== undefined ? normalizeOptionalString(payload.description) : undefined,
          contactId: payload.contactId !== undefined ? (payload.contactId || null) : undefined,
          organizationId: payload.organizationId !== undefined ? (payload.organizationId || null) : undefined,
          workshopRequestId: payload.workshopRequestId !== undefined ? (payload.workshopRequestId || null) : undefined,
          songRequestId: payload.songRequestId !== undefined ? (payload.songRequestId || null) : undefined,
          appointmentId: payload.appointmentId !== undefined ? (payload.appointmentId || null) : undefined,
          status: payload.status,
          subtotal: totals?.subtotal,
          taxAmount: totals?.taxAmount,
          totalAmount: totals?.totalAmount,
          customerSnapshot: customerSnapshot
            ? (customerSnapshot as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          currency: payload.currency ? payload.currency.toUpperCase() : undefined,
          validUntil: payload.validUntil !== undefined ? (payload.validUntil ? new Date(payload.validUntil) : null) : undefined,
          notes: payload.notes !== undefined ? normalizeOptionalString(payload.notes) : undefined,
          internalNotes: payload.internalNotes !== undefined ? normalizeOptionalString(payload.internalNotes) : undefined,
          lines: payload.lines
            ? {
                create: totals?.lines.map((line) => ({
                  title: line.title.trim(),
                  description: normalizeOptionalString(line.description ?? undefined),
                  quantity: line.quantity,
                  unitPrice: line.unitPrice,
                  subtotal: line.subtotal,
                  taxable: line.taxable,
                  sortOrder: line.sortOrder,
                })),
              }
            : undefined,
        },
      });

      return tx.commercialQuote.findUniqueOrThrow({
        where: { id: params.id },
        include: {
          lines: { orderBy: { sortOrder: 'asc' } },
          convertedToInvoice: { select: { id: true, number: true, status: true } },
        },
      });
    });

    await prisma.activity.create({
      data: {
        type: 'NOTE',
        title: 'Soumission commerciale modifiée',
        description: `Devis ${item.quoteNumber} mis à jour.`,
        contactId: item.contactId,
        relatedType: 'COMMERCIAL_QUOTE',
        relatedId: item.id,
        relatedUrl: `/crm/commercial-quotes/${item.id}`,
        userId: admin.session.sub,
      },
    }).catch(() => undefined);

    // Créer un FileDocument si un contact est associé et n'en existe pas déjà.
    if (item.contactId) {
      try {
        await ensureQuoteFileDocument({
          quoteId: item.id,
          quoteNumber: item.quoteNumber,
          contactId: item.contactId,
        });
      } catch (error) {
        console.error('Erreur création FileDocument pour devis (PATCH):', error);
      }
    }

    return NextResponse.json({
      item: {
        ...item,
        subtotal: item.subtotal.toString(),
        taxAmount: item.taxAmount.toString(),
        totalAmount: item.totalAmount.toString(),
        lines: item.lines.map((line) => ({
          ...line,
          quantity: line.quantity.toString(),
          unitPrice: line.unitPrice.toString(),
          subtotal: line.subtotal.toString(),
        })),
      },
    });
  } catch (error) {
    if (error instanceof SongRequestQuoteGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'Données invalides';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = ensureAdmin(request, 'delete');
  if (admin.error) return admin.error;

  const item = await prisma.commercialQuote.findUnique({ where: { id: params.id } });
  if (!item) {
    return NextResponse.json({ error: 'Soumission commerciale introuvable.' }, { status: 404 });
  }

  if (!canDeleteCommercialQuote(item.status)) {
    return NextResponse.json({ error: 'Seules les soumissions au statut DRAFT peuvent être supprimées.' }, { status: 409 });
  }

  await prisma.commercialQuote.delete({ where: { id: params.id } });

  await prisma.activity.create({
    data: {
      type: 'NOTE',
      title: 'Soumission commerciale supprimée',
      description: `Devis ${item.quoteNumber} supprimé (brouillon uniquement).`,
      contactId: item.contactId,
      relatedType: 'COMMERCIAL_QUOTE_DELETED',
      relatedId: item.id,
      relatedUrl: null,
      userId: admin.session.sub,
    },
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
