import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { commercialQuoteCreateSchema, normalizeOptionalString } from '@/features/crm/server/validators';
import { computeQuoteTotals, nextCommercialQuoteNumber } from '@/features/crm/commercial-quotes/quote-utils';
import { buildCustomerSnapshotFromContact, buildCustomerSnapshotFromOrganization, getBillingIssuerSnapshot } from '@/lib/billing-profile';

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
    if (contact) {
      return buildCustomerSnapshotFromContact(contact);
    }
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
    if (organization) {
      return buildCustomerSnapshotFromOrganization(organization);
    }
  }

  return null;
}

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

    // Blocage : impossible de créer une nouvelle soumission si une soumission acceptée
    // existe déjà pour la même demande de chanson.
    if (payload.songRequestId) {
      const alreadyAccepted = await prisma.commercialQuote.findFirst({
        where: {
          songRequestId: payload.songRequestId,
          status: { in: ['ACCEPTED', 'CONVERTED'] },
        },
        select: { id: true, quoteNumber: true },
      });
      if (alreadyAccepted) {
        return NextResponse.json(
          { error: `Une soumission acceptée (${alreadyAccepted.quoteNumber}) existe déjà pour cette demande de chanson.` },
          { status: 409 },
        );
      }
    }

    const issuerSnapshot = await getBillingIssuerSnapshot();
    const quoteNumber = await nextCommercialQuoteNumber();
    const totals = computeQuoteTotals(payload.lines, {
      taxesEnabled: issuerSnapshot.taxesEnabled,
      gst: issuerSnapshot.taxRateGst,
      qst: issuerSnapshot.taxRateQst,
    });
    const customerSnapshot = await resolveCustomerSnapshot(payload.contactId || null, payload.organizationId || null);

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
        issuerSnapshot: issuerSnapshot as unknown as Prisma.InputJsonValue,
        customerSnapshot: customerSnapshot
          ? (customerSnapshot as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        taxesEnabled: issuerSnapshot.taxesEnabled,
        taxRateGst: issuerSnapshot.taxRateGst,
        taxRateQst: issuerSnapshot.taxRateQst,
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

    // Créer automatiquement un FileDocument pour le devis dans les documents client
    if (item.contactId) {
      try {
        await prisma.fileDocument.create({
          data: {
            contactId: item.contactId,
            commercialQuoteId: item.id,
            filename: `${item.quoteNumber}.pdf`,
            originalName: `Devis ${item.quoteNumber}`,
            mimeType: 'application/pdf',
            size: 0,
            storageKey: `quotes/${item.id}`,
            url: `/api/crm/commercial-quotes/${item.id}/pdf`,
            category: 'quote',
            visibility: 'CLIENT_VISIBLE',
          },
        });
      } catch (error) {
        // Ne pas bloquer si le FileDocument échoue
        console.error('Erreur création FileDocument pour devis:', error);
      }
    }

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
