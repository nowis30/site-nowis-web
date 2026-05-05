import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { assertCanSendQuoteForSongRequest, SongRequestQuoteGuardError } from '@/features/crm/server/song-request-quote-guards';
import { ensureQuoteFileDocument } from '@/features/crm/server/file-document-links';

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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = ensureAdmin(request);
  if (admin.error) return admin.error;

  const quote = await prisma.commercialQuote.findUnique({ where: { id: params.id } });
  if (!quote) return NextResponse.json({ error: 'Soumission commerciale introuvable.' }, { status: 404 });

  if (quote.status === 'CONVERTED') {
    return NextResponse.json({ error: 'Cette soumission est déjà convertie en facture.' }, { status: 409 });
  }

  if (quote.songRequestId) {
    try {
      await assertCanSendQuoteForSongRequest(quote.songRequestId, quote.id);
    } catch (error) {
      if (error instanceof SongRequestQuoteGuardError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }
  }

  const item = await prisma.commercialQuote.update({
    where: { id: params.id },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      declinedAt: null,
    },
  });

  await prisma.activity.create({
    data: {
      type: 'NOTE',
      title: 'Soumission commerciale acceptée',
      description: `Devis ${item.quoteNumber} accepté.`,
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
      console.error('Erreur création FileDocument pour devis (accept):', error);
    }
  }

  return NextResponse.json({ ok: true, item });
}
