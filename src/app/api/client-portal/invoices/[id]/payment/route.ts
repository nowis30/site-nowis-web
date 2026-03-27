import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyClientPortalToken } from '@/lib/client-portal';
import { persistUploadedFile } from '@/lib/uploaded-file';
import { sendPortalEventNotificationEmail } from '@/lib/email-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formData = await request.formData();
    const token = request.nextUrl.searchParams.get('token') || String(formData.get('token') || '');
    const message = String(formData.get('message') || '').trim();
    const file = formData.get('file');

    const session = verifyClientPortalToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Lien client invalide' }, { status: 401 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, contactId: session.contactId },
      select: { id: true, contactId: true, number: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
    }

    let proofUrl: string | null = null;
    if (file instanceof File && file.size > 0) {
      const stored = await persistUploadedFile(file);
      proofUrl = stored.url;
      await prisma.document.create({
        data: {
          fileName: stored.fileName,
          fileUrl: stored.url,
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
          linkedType: 'INVOICE',
          linkedId: invoice.id,
        },
      });
    }

    await prisma.activity.create({
      data: {
        type: 'PAYMENT',
        title: `Paiement signalé par le client pour la facture ${invoice.number}`,
        description: [message || 'Le client indique avoir effectue le paiement.', proofUrl ? `Preuve: ${proofUrl}` : null]
          .filter(Boolean)
          .join('\n'),
        contactId: invoice.contactId,
        invoiceId: invoice.id,
      },
    });

    await prisma.communication.create({
      data: {
        contactId: invoice.contactId,
        channel: 'portal-payment',
        subject: `Paiement signalé - ${invoice.number}`,
        body: [message || 'Le client indique avoir effectue le paiement.', proofUrl ? `Preuve: ${proofUrl}` : null]
          .filter(Boolean)
          .join('\n'),
        direction: 'INBOUND',
        linkedType: 'INVOICE',
        linkedId: invoice.id,
      },
    });

    await sendPortalEventNotificationEmail({
      eventLabel: 'Portail client',
      subject: `Paiement signalé : ${invoice.number}`,
      headline: `Facture ${invoice.number}`,
      lines: [
        `Client: ${session.fullName}`,
        `Email: ${session.email}`,
        message || 'Le client indique avoir effectue le paiement.',
        proofUrl ? `Preuve jointe: ${proofUrl}` : 'Aucune preuve jointe.',
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[CLIENT_PORTAL_INVOICE_PAYMENT]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Signalement impossible' }, { status: 500 });
  }
}
