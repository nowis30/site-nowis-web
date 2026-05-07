import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { ensureCrmTask } from '@/features/crm/server/task-automation';
import { prisma } from '@/lib/prisma';

const respondSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

const RESPONDABLE_STATUSES = new Set(['DRAFT', 'SENT'] as const);

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) {
    return NextResponse.json({ error: 'Session client invalide.' }, { status: 401 });
  }

  const parsed = respondSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Action invalide.' }, { status: 400 });
  }

  const quote = await prisma.commercialQuote.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      quoteNumber: true,
      contactId: true,
      songRequestId: true,
      workshopRequestId: true,
      status: true,
      convertedToInvoiceId: true,
    },
  });

  if (!quote) {
    return NextResponse.json({ error: 'Soumission introuvable.' }, { status: 404 });
  }

  if (!quote.contactId || quote.contactId !== session.contactId) {
    return NextResponse.json({ error: 'Acces refuse a cette soumission.' }, { status: 403 });
  }

  if (quote.convertedToInvoiceId || quote.status === 'CONVERTED') {
    return NextResponse.json({ error: 'Cette soumission est deja convertie en facture.' }, { status: 409 });
  }

  if (!RESPONDABLE_STATUSES.has(quote.status as 'DRAFT' | 'SENT')) {
    return NextResponse.json({ error: 'Cette soumission ne peut plus etre modifiee.' }, { status: 409 });
  }

  const action = parsed.data.action;
  const nextStatus = action === 'accept' ? 'ACCEPTED' : 'DECLINED';

  const updated = await prisma.commercialQuote.update({
    where: { id: quote.id },
    data: action === 'accept'
      ? { status: 'ACCEPTED', acceptedAt: new Date(), declinedAt: null }
      : { status: 'DECLINED', acceptedAt: null, declinedAt: new Date() },
    select: { id: true, status: true },
  });

  await prisma.activity.create({
    data: {
      type: 'NOTE',
      title: action === 'accept' ? 'Soumission acceptee par le client' : 'Soumission refusee par le client',
      description: `Devis ${quote.quoteNumber} -> ${nextStatus}`,
      contactId: quote.contactId,
      relatedType: 'COMMERCIAL_QUOTE',
      relatedId: quote.id,
      relatedUrl: `/crm/commercial-quotes/${quote.id}`,
    },
  }).catch(() => undefined);

  if (action === 'accept') {
    await ensureCrmTask({
      type: 'CREATE_INVOICE',
      title: 'Creer la facture',
      description: `Soumission acceptee par le client: ${quote.quoteNumber}. Creer la facture associee.`,
      priority: 'HIGH',
      linkedType: quote.songRequestId
        ? 'SONG_REQUEST'
        : quote.workshopRequestId
          ? 'WORKSHOP_REQUEST'
          : 'CONTACT',
      linkedId: quote.songRequestId ?? quote.workshopRequestId ?? quote.contactId,
      contactId: quote.contactId,
      songRequestId: quote.songRequestId,
      workshopRequestId: quote.workshopRequestId,
      commercialQuoteId: quote.id,
      isAutoCreated: true,
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true, status: updated.status });
}
