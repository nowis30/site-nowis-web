import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPublicQuoteToken } from '@/lib/public-links';
import { assertCanSendQuoteForSongRequest, findExistingInvoiceForSongRequest, SongRequestQuoteGuardError } from '@/features/crm/server/song-request-quote-guards';
import { ensureQuoteFileDocument } from '@/features/crm/server/file-document-links';
import { ensureCrmTask } from '@/features/crm/server/task-automation';

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
      songRequestId: true,
      workshopRequestId: true,
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

  if (action === 'accept' && quote.songRequestId) {
    try {
      await assertCanSendQuoteForSongRequest(quote.songRequestId, quote.id);
    } catch (error) {
      if (error instanceof SongRequestQuoteGuardError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }
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

  // Créer un FileDocument si acceptée et un contact est associé.
  if (action === 'accept' && item.contactId) {
    try {
      await ensureQuoteFileDocument({
        quoteId: item.id,
        quoteNumber: item.quoteNumber,
        contactId: item.contactId,
      });
    } catch (error) {
      console.error('Erreur création FileDocument pour devis (public accept):', error);
    }
  }

  if (action === 'accept') {
    try {
      const existingInvoice = quote.songRequestId
        ? await findExistingInvoiceForSongRequest(quote.songRequestId)
        : quote.convertedToInvoiceId
          ? { id: quote.convertedToInvoiceId }
          : null;

      if (existingInvoice) {
        console.info(`[QUOTE_ACCEPT] Facture déjà existante pour le devis ${quote.id}. Aucune tâche CREATE_INVOICE créée.`);
      } else {
        await ensureCrmTask({
          type: 'CREATE_INVOICE',
          title: 'Créer la facture',
          description: `Soumission acceptée: ${quote.quoteNumber}. Préparer la facture client.`,
          priority: 'HIGH',
          linkedType: quote.songRequestId
            ? 'SONG_REQUEST'
            : quote.workshopRequestId
              ? 'WORKSHOP_REQUEST'
              : 'CONTACT',
          linkedId: quote.songRequestId ?? quote.workshopRequestId ?? quote.contactId ?? null,
          contactId: quote.contactId ?? null,
          songRequestId: quote.songRequestId ?? null,
          workshopRequestId: quote.workshopRequestId ?? null,
          commercialQuoteId: quote.id,
          isAutoCreated: true,
        });
      }
    } catch (error) {
      console.error('Erreur création tâche CREATE_INVOICE:', error);
    }
  }

  return NextResponse.json({ ok: true, status: item.status });
}
