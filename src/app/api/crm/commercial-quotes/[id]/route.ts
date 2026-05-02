import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { canDeleteCommercialQuote, computeQuoteTotals } from '@/features/crm/commercial-quotes/quote-utils';
import { commercialQuotePatchSchema, normalizeOptionalString } from '@/features/crm/server/validators';

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

    const totals = payload.lines ? computeQuoteTotals(payload.lines) : null;

    const item = await prisma.$transaction(async (tx) => {
      if (payload.lines) {
        await tx.commercialQuoteLine.deleteMany({ where: { quoteId: params.id } });
      }

      const updated = await tx.commercialQuote.update({
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
        include: {
          lines: { orderBy: { sortOrder: 'asc' } },
          convertedToInvoice: { select: { id: true, number: true, status: true } },
        },
      });

      return updated;
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
