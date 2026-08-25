import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { buildPublicInvoiceUrl, signPublicInvoiceToken } from '@/lib/public-links';
import { buildCustomerSnapshotFromContact, getBillingIssuerSnapshot, toCustomerSnapshot, toIssuerSnapshot } from '@/lib/billing-profile';

function formatMoney(value: string | number) {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(value));
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'invoices', 'read');
  if (guard.error) return guard.error;

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      contact: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          companyName: true,
          billingCompanyName: true,
          billingLegalName: true,
          billingEmail: true,
          billingPhone: true,
          billingAddressLine1: true,
          billingAddressLine2: true,
          billingCity: true,
          billingState: true,
          billingPostalCode: true,
          billingCountry: true,
          billingTaxId: true,
          billingNotes: true,
        },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 });
  }

  const businessProfile = toIssuerSnapshot(invoice.issuerSnapshot) || await getBillingIssuerSnapshot();
  const customerProfile = toCustomerSnapshot(invoice.customerSnapshot) || buildCustomerSnapshotFromContact(invoice.contact);
  const recipientEmail = customerProfile.email || invoice.contact.email;
  const paymentEmail = businessProfile.email?.trim();

  if (!recipientEmail) {
    return NextResponse.json(
      { error: "Aucune adresse courriel n'est configurée pour le destinataire de cette facture." },
      { status: 409 },
    );
  }

  if (!paymentEmail) {
    return NextResponse.json(
      { error: "Configure ton adresse courriel de facturation dans les paramètres du CRM avant d'envoyer la facture." },
      { status: 409 },
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    request.nextUrl.origin;

  const invoiceToken = signPublicInvoiceToken({
    invoiceId: invoice.id,
    contactId: invoice.contact.id,
  });
  const invoiceUrl = buildPublicInvoiceUrl(invoiceToken, appUrl);
  const subject = `Facture ${invoice.number} - ${businessProfile.displayName}`;
  const message = [
    `Bonjour ${customerProfile.fullName},`,
    '',
    `Voici la facture ${invoice.number}.`,
    `Montant : ${formatMoney(invoice.amount.toString())}`,
    `Échéance : ${invoice.dueDate.toLocaleDateString('fr-CA')}`,
    '',
    `Paiement par virement Interac à : ${paymentEmail}`,
    '',
    `Consulter la facture : ${invoiceUrl}`,
    '',
    'Merci,',
    businessProfile.displayName,
  ].join('\n');

  const query = new URLSearchParams({
    to: recipientEmail,
    subject,
    body: message,
  });

  return NextResponse.json({
    outlookUrl: `https://outlook.office.com/mail/deeplink/compose?${query.toString()}`,
    invoiceUrl,
    recipientEmail,
    paymentEmail,
  });
}
