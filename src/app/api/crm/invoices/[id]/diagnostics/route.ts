import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { getPayPalDiagnostics } from '@/lib/server/paypal';

export const runtime = 'nodejs';

function ensureAdmin(request: NextRequest) {
  const guard = requireApiPermission(request, 'invoices', 'read');
  if (guard.error) return { error: guard.error, session: null as null };
  if (guard.session.role !== 'ADMIN') {
    return {
      error: NextResponse.json({ error: 'Action reservee a un administrateur.' }, { status: 403 }),
      session: null as null,
    };
  }
  return { error: null, session: guard.session };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = ensureAdmin(request);
  if (admin.error) return admin.error;

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      number: true,
      status: true,
      paypalInvoiceId: true,
      paypalInvoiceUrl: true,
      paypalStatus: true,
      paymentStatus: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
  }

  const fileDocumentPlaceholders = await prisma.fileDocument.count({
    where: {
      invoiceId: invoice.id,
      size: 0,
      storageKey: {
        startsWith: 'invoices/',
      },
    },
  });

  const realFileDocuments = await prisma.fileDocument.count({
    where: {
      invoiceId: invoice.id,
      NOT: {
        AND: [
          { size: 0 },
          {
            storageKey: {
              startsWith: 'invoices/',
            },
          },
        ],
      },
    },
  });

  return NextResponse.json({
    invoice: {
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      paypalInvoiceIdPresent: Boolean(invoice.paypalInvoiceId),
      paypalInvoiceUrl: invoice.paypalInvoiceUrl,
      paypalStatus: invoice.paypalStatus,
      paymentStatus: invoice.paymentStatus,
    },
    fileDocumentPlaceholders,
    realFileDocuments,
    resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    paypalConfigured: getPayPalDiagnostics().configured,
  });
}
