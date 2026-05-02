import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

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

  if (!quote.contactId) {
    return NextResponse.json({ error: 'Impossible de convertir sans contact associé.' }, { status: 409 });
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

  return NextResponse.json({ ok: true, invoiceId: result.invoice.id, quoteId: result.updatedQuote.id });
}
