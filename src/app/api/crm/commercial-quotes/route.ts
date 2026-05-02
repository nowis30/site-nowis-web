import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { commercialQuoteCreateSchema, normalizeOptionalString } from '@/features/crm/server/validators';
import { computeQuoteTotals, nextCommercialQuoteNumber } from '@/features/crm/commercial-quotes/quote-utils';

function ensureAdmin(request: NextRequest, action: 'read' | 'create') {
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

export async function GET(request: NextRequest) {
  const admin = ensureAdmin(request, 'read');
  if (admin.error) return admin.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const status = request.nextUrl.searchParams.get('status')?.trim().toUpperCase();

  const items = await prisma.commercialQuote.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { quoteNumber: { contains: q, mode: 'insensitive' } },
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { contact: { fullName: { contains: q, mode: 'insensitive' } } },
              { organization: { name: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
      ...(status
        ? {
            status: status as
              | 'DRAFT'
              | 'SENT'
              | 'ACCEPTED'
              | 'DECLINED'
              | 'EXPIRED'
              | 'CONVERTED'
              | 'ARCHIVED',
          }
        : {}),
    },
    include: {
      contact: { select: { id: true, fullName: true, email: true, phone: true } },
      organization: { select: { id: true, name: true, city: true } },
      workshopRequest: { select: { id: true, title: true } },
      songRequest: { select: { id: true, title: true } },
      appointment: { select: { id: true, title: true, startAt: true } },
      convertedToInvoice: { select: { id: true, number: true, status: true } },
      lines: { select: { id: true }, take: 1 },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      subtotal: item.subtotal.toString(),
      taxAmount: item.taxAmount.toString(),
      totalAmount: item.totalAmount.toString(),
      hasLines: item.lines.length > 0,
    })),
  });
}

export async function POST(request: NextRequest) {
  const admin = ensureAdmin(request, 'create');
  if (admin.error) return admin.error;

  try {
    const payload = commercialQuoteCreateSchema.parse(await request.json());
    const quoteNumber = await nextCommercialQuoteNumber();
    const totals = computeQuoteTotals(payload.lines);

    const item = await prisma.commercialQuote.create({
      data: {
        quoteNumber,
        title: payload.title.trim(),
        description: normalizeOptionalString(payload.description),
        contactId: payload.contactId || null,
        organizationId: payload.organizationId || null,
        workshopRequestId: payload.workshopRequestId || null,
        songRequestId: payload.songRequestId || null,
        appointmentId: payload.appointmentId || null,
        status: payload.status ?? 'DRAFT',
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        currency: payload.currency.toUpperCase(),
        validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
        notes: normalizeOptionalString(payload.notes),
        internalNotes: normalizeOptionalString(payload.internalNotes),
        lines: {
          create: totals.lines.map((line) => ({
            title: line.title.trim(),
            description: normalizeOptionalString(line.description ?? undefined),
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            subtotal: line.subtotal,
            taxable: line.taxable,
            sortOrder: line.sortOrder,
          })),
        },
      },
      include: {
        contact: { select: { id: true, fullName: true } },
        organization: { select: { id: true, name: true } },
        lines: { orderBy: { sortOrder: 'asc' } },
      },
    });

    await prisma.activity.create({
      data: {
        type: 'NOTE',
        title: 'Soumission commerciale créée',
        description: `Devis ${item.quoteNumber} créé (${item.title}). Total: ${totals.totalAmount.toFixed(2)} ${item.currency}.`,
        contactId: item.contactId,
        relatedType: 'COMMERCIAL_QUOTE',
        relatedId: item.id,
        relatedUrl: `/crm/commercial-quotes/${item.id}`,
        userId: admin.session.sub,
      },
    }).catch(() => undefined);

    return NextResponse.json(
      {
        item: {
          ...item,
          subtotal: item.subtotal.toString(),
          taxAmount: item.taxAmount.toString(),
          totalAmount: item.totalAmount.toString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Données invalides';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
