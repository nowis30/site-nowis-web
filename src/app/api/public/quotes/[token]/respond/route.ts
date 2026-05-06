import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPublicQuoteToken } from '@/lib/public-links';
import { assertCanSendQuoteForSongRequest, SongRequestQuoteGuardError } from '@/features/crm/server/song-request-quote-guards';
import { ensureQuoteFileDocument } from '@/features/crm/server/file-document-links';

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

    // Créer une tâche si la soumission est acceptée et liée à une demande de chanson
    if (action === 'accept' && quote.songRequestId) {
      try {
        const songRequest = await prisma.songRequest.findUnique({
          where: { id: quote.songRequestId },
          select: {
            id: true,
            title: true,
            fullName: true,
          },
        });

        if (songRequest) {
          const taskTitle = songRequest.title
            ? `Créer la chanson: "${songRequest.title}" pour ${songRequest.fullName}`
            : `Créer la chanson pour ${songRequest.fullName}`;

          await prisma.activity.create({
            data: {
              type: 'TASK',
              title: taskTitle,
              description: `Soumission acceptée - Devis ${quote.quoteNumber}. La chanson doit être créée selon les paramètres définis dans la demande.`,
              songRequestId: quote.songRequestId,
              contactId: quote.contactId,
              relatedType: 'SONG_REQUEST',
              relatedId: quote.songRequestId,
              relatedUrl: `/crm/song-requests/${quote.songRequestId}`,
            },
          });
        }
      } catch (error) {
        console.error('Erreur création tâche pour demande de chanson:', error);
      }
    }

    return NextResponse.json({ ok: true, status: item.status });
}
