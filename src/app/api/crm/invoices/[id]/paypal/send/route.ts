import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { sendPayPalInvoice } from '@/lib/server/paypal';
import { prisma } from '@/lib/prisma';
import { getBillingIssuerSnapshot, validateIssuerSnapshot } from '@/lib/billing-profile';
import { getClientBillingMissingLabels } from '@/lib/client-billing';
import { buildPublicBillingUrl, signPublicBillingToken } from '@/lib/public-links';

export const runtime = 'nodejs';

function ensureAdmin(request: NextRequest) {
  const guard = requireApiPermission(request, 'invoices', 'update');
  if (guard.error) return { error: guard.error, session: null as null };
  if (guard.session.role !== 'ADMIN') {
    return {
      error: NextResponse.json({ error: 'Action reservee a un administrateur.' }, { status: 403 }),
      session: null as null,
    };
  }
  return { error: null, session: guard.session };
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = ensureAdmin(request);
  if (admin.error) return admin.error;

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      contactId: true,
      contact: {
        select: {
          id: true,
          fullName: true,
          email: true,
          billingLegalName: true,
          billingEmail: true,
          billingAddressLine1: true,
          billingCity: true,
          billingState: true,
          billingPostalCode: true,
          billingCountry: true,
        },
      },
    },
  });

  if (!invoice || !invoice.contact) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
  }

  const missingIssuer = validateIssuerSnapshot(await getBillingIssuerSnapshot());
  const missingCustomer = getClientBillingMissingLabels(invoice.contact);
  if (missingIssuer.length > 0 || missingCustomer.length > 0) {
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_DOMAIN || request.nextUrl.origin;
    const billingUpdateUrl = buildPublicBillingUrl(
      signPublicBillingToken({ contactId: invoice.contact.id, invoiceId: invoice.id }),
      appUrl,
    );
    return NextResponse.json(
      {
        error: 'Facturation incomplete. Complete le profil emetteur et les informations client avant envoi PayPal.',
        missingIssuer,
        missingCustomer,
        editCustomerUrl: `/crm/contacts/${invoice.contact.id}`,
        billingUpdateUrl,
      },
      { status: 409 },
    );
  }

  try {
    const item = await sendPayPalInvoice(params.id, admin.session.sub);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Envoi PayPal impossible' },
      { status: 400 },
    );
  }
}
