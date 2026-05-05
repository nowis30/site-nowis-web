import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { getBillingIssuerSnapshot, buildCustomerSnapshotFromContact, toCustomerSnapshot, validateCustomerSnapshot, validateIssuerSnapshot } from '@/lib/billing-profile';
import { ensureInvoiceFileDocument } from '@/features/crm/server/file-document-links';

function ensureAdmin(request: NextRequest) {
  const guard = requireApiPermission(request, 'commercialQuotes', 'update');
  if (guard.error) return { error: guard.error, session: null as null };
  if (guard.session.role !== 'ADMIN') {
    return {
      error: NextResponse.json({ error: 'Action réservée à un administrateur.' }, { status: 403 }),
      session: null as null,
    };
  }
  return { error: null, session: guard.session };
}

function nextInvoiceNumber(prefixDate = new Date()) {
  const yyyy = prefixDate.getFullYear();
  const mm = String(prefixDate.getMonth() + 1).padStart(2, '0');
  const dd = String(prefixDate.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `FAC-${yyyy}${mm}${dd}-${rand}`;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = ensureAdmin(request);
  if (admin.error) return admin.error;

  const issuerSnapshot = await getBillingIssuerSnapshot();

  const quote = await prisma.commercialQuote.findUnique({
    where: { id: params.id },
    include: { lines: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!quote) {
    return NextResponse.json({ error: 'Soumission commerciale introuvable.' }, { status: 404 });
  }

  if (quote.convertedToInvoiceId) {
    return NextResponse.json({ error: 'Cette soumission est déjà convertie en facture.' }, { status: 409 });
  }

  if (quote.status !== 'ACCEPTED') {
    return NextResponse.json({ error: 'Seule une soumission acceptée peut être convertie en facture.' }, { status: 422 });
  }

  if (!quote.contactId) {
    return NextResponse.json({ error: 'Impossible de convertir sans contact associé.' }, { status: 409 });
  }

  const customerSnapshot = toCustomerSnapshot(quote.customerSnapshot);
  const missingIssuer = validateIssuerSnapshot(issuerSnapshot);

  // Si le snapshot du devis est incomplet, tenter de le rafraîchir depuis le contact actuel
  let effectiveCustomerSnapshot = customerSnapshot;
  const missingInSnapshot = customerSnapshot ? validateCustomerSnapshot(customerSnapshot) : ['fullName'];
  if (missingInSnapshot.length > 0) {
    const contact = await prisma.contact.findUnique({
      where: { id: quote.contactId },
      select: {
        fullName: true, companyName: true, email: true, phone: true,
        billingCompanyName: true, billingLegalName: true, billingEmail: true, billingPhone: true,
        billingAddressLine1: true, billingAddressLine2: true, billingCity: true,
        billingState: true, billingPostalCode: true, billingCountry: true,
        billingTaxId: true, billingNotes: true,
      },
    });
    if (contact) {
      effectiveCustomerSnapshot = buildCustomerSnapshotFromContact(contact);
    }
  }

  const missingCustomer = effectiveCustomerSnapshot
    ? validateCustomerSnapshot(effectiveCustomerSnapshot)
    : ['fullName', 'email', 'addressLine1', 'city', 'postalCode', 'country'];

  if (missingIssuer.length > 0 || missingCustomer.length > 0) {
    return NextResponse.json(
      {
        error: 'Facturation incomplete. Complete le profil emetteur et les informations client avant conversion en facture.',
        missingIssuer,
        missingCustomer,
      },
      { status: 409 },
    );
  }

  const invoiceNumber = nextInvoiceNumber();
  const linesDescription = quote.lines
    .map((line) => `${line.title} x${line.quantity.toString()} @ ${line.unitPrice.toString()}`)
    .join(' | ');

  const dueDate = quote.validUntil ?? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        number: invoiceNumber,
        contactId: quote.contactId!,
        issueDate: new Date(),
        dueDate,
        amount: quote.totalAmount,
        subtotal: quote.subtotal,
        taxAmount: quote.taxAmount,
        totalAmount: quote.totalAmount,
        issuerSnapshot: issuerSnapshot as unknown as Prisma.InputJsonValue,
        customerSnapshot: effectiveCustomerSnapshot !== null
          ? (effectiveCustomerSnapshot as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        taxesEnabled: quote.taxesEnabled,
        taxRateGst: quote.taxRateGst,
        taxRateQst: quote.taxRateQst,
        status: 'DRAFT',
        description: `${quote.quoteNumber} - ${quote.title}${linesDescription ? ` | ${linesDescription}` : ''}`,
      },
    });

    const updatedQuote = await tx.commercialQuote.update({
      where: { id: quote.id },
      data: {
        status: 'CONVERTED',
        convertedToInvoiceId: invoice.id,
      },
    });

    return { invoice, updatedQuote };
  });

  await prisma.activity.create({
    data: {
      type: 'INVOICE',
      title: 'Soumission convertie en facture',
      description: `Le devis ${quote.quoteNumber} a été converti en facture ${result.invoice.number}.`,
      contactId: quote.contactId,
      invoiceId: result.invoice.id,
      relatedType: 'COMMERCIAL_QUOTE',
      relatedId: quote.id,
      relatedUrl: `/crm/commercial-quotes/${quote.id}`,
      userId: admin.session.sub,
    },
  }).catch(() => undefined);

  // Créer automatiquement un FileDocument pour la facture dans les documents client.
  // Idempotent pour éviter les doublons en cas de retry.
  try {
    await ensureInvoiceFileDocument({
      contactId: quote.contactId,
      invoiceId: result.invoice.id,
      invoiceNumber: result.invoice.number,
    });
  } catch (error) {
    // Ne pas bloquer si le FileDocument échoue
    console.error('Erreur création FileDocument pour facture:', error);
  }

  return NextResponse.json({ ok: true, invoiceId: result.invoice.id, quoteId: result.updatedQuote.id });
}
