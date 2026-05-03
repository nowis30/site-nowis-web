import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPublicQuoteToken } from '@/lib/public-links';

const ALLOWED = new Set(['accept', 'decline']);

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const decoded = verifyPublicQuoteToken(params.token);
  if (!decoded) {
    return NextResponse.json({ error: 'Lien invalide ou expire.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { action?: string };
  const action = (body.action || '').toLowerCase();
  if (!ALLOWED.has(action)) {
    return NextResponse.json({ error: 'Action invalide.' }, { status: 400 });
  }

  const quote = await prisma.commercialQuote.findUnique({
    where: { id: decoded.quoteId },
    select: {
      id: true,
      quoteNumber: true,
      contactId: true,
      status: true,
      convertedToInvoiceId: true,
    },
  });

  if (!quote) {
    return NextResponse.json({ error: 'Soumission introuvable.' }, { status: 404 });
  }

  if (decoded.contactId && quote.contactId && decoded.contactId !== quote.contactId) {
    return NextResponse.json({ error: 'Lien non autorise pour cette soumission.' }, { status: 403 });
  }

  if (quote.status === 'CONVERTED' || quote.convertedToInvoiceId) {
    return NextResponse.json({ error: 'Cette soumission est deja convertie en facture.' }, { status: 409 });
  }

  const nextStatus = action === 'accept' ? 'ACCEPTED' : 'DECLINED';

  const item = await prisma.commercialQuote.update({
    where: { id: quote.id },
    data:
      action === 'accept'
        ? { status: 'ACCEPTED', acceptedAt: new Date(), declinedAt: null }
        : { status: 'DECLINED', acceptedAt: null, declinedAt: new Date() },
  });

  await prisma.activity
    .create({
      data: {
        type: 'NOTE',
        title: action === 'accept' ? 'Soumission acceptee par lien public' : 'Soumission refusee par lien public',
        description: `Devis ${quote.quoteNumber} -> ${nextStatus}`,
        contactId: quote.contactId,
        relatedType: 'COMMERCIAL_QUOTE',
        relatedId: quote.id,
        relatedUrl: `/crm/commercial-quotes/${quote.id}`,
      },
    })
    .catch(() => undefined);

  return NextResponse.json({ ok: true, status: item.status });
}
