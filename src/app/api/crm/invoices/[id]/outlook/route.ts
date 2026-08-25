import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { buildCustomerSnapshotFromContact, getBillingIssuerSnapshot, toCustomerSnapshot, toIssuerSnapshot } from '@/lib/billing-profile';
import { parseInvoiceDescriptionLines } from '@/lib/invoice-lines';
import { createInvoiceOutlookDraftWithFullInvoice } from '@/lib/outlook/invoice-draft';
import {
  getOutlookOAuthConfig,
  OutlookConfigurationError,
  OutlookNotConnectedError,
} from '@/lib/outlook/service';

function formatMoney(value: string | number) {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(value));
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(value);
}

function encodeMailtoValue(value: string) {
  return encodeURIComponent(value);
}

function isMobileRequest(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
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
  const senderEmail = businessProfile.email?.trim();

  if (!recipientEmail) {
    return NextResponse.json(
      { error: "Aucune adresse courriel n'est configurée pour le destinataire de cette facture." },
      { status: 409 },
    );
  }

  if (!senderEmail) {
    return NextResponse.json(
      { error: "Configure ton adresse courriel de facturation dans les paramètres du CRM avant d'envoyer la facture." },
      { status: 409 },
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    request.nextUrl.origin;

  if (!isMobileRequest(request)) {
    try {
      const draft = await createInvoiceOutlookDraftWithFullInvoice(invoice.id, appUrl);
      return NextResponse.json({
        ...draft,
        mode: 'outlook-draft',
        paymentEmail: draft.senderEmail,
      });
    } catch (error) {
      if (error instanceof OutlookNotConnectedError) {
        try {
          getOutlookOAuthConfig(appUrl);
          const connectUrl = `/api/crm/outlook/connect?invoiceId=${encodeURIComponent(invoice.id)}`;
          return NextResponse.json({
            outlookUrl: connectUrl,
            connectUrl,
            recipientEmail,
            senderEmail,
            paymentEmail: senderEmail,
            setupRequired: true,
            mode: 'outlook-connect',
          });
        } catch (configError) {
          if (!(configError instanceof OutlookConfigurationError)) {
            throw configError;
          }
        }
      } else if (!(error instanceof OutlookConfigurationError)) {
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : 'Impossible de préparer le brouillon Outlook avec le PDF.',
          },
          { status: 502 },
        );
      }
    }
  }

  // Fallback sans lien : la facture est écrite directement dans le message.
  // Un lien mailto ne peut pas joindre un fichier; le PDF automatique est réservé au vrai brouillon Outlook Graph.
  const lines = parseInvoiceDescriptionLines(invoice.description, invoice.amount.toString());
  const detailLines = lines.map((line) =>
    `- ${line.description}${line.amount !== null ? ` : ${formatMoney(line.amount)}` : ''}`,
  );
  const billedTo = [
    customerProfile.companyName,
    customerProfile.fullName,
    customerProfile.addressLine1,
    customerProfile.addressLine2,
    [customerProfile.city, customerProfile.state, customerProfile.postalCode].filter(Boolean).join(', '),
    customerProfile.country,
  ].filter(Boolean) as string[];

  const subject = `Facture ${invoice.number} | ${businessProfile.displayName}`;
  const message = [
    `Bonjour ${customerProfile.fullName},`,
    '',
    `Voici le détail de la facture ${invoice.number}.`,
    '',
    `FACTURE ${invoice.number}`,
    `Date : ${formatDate(invoice.issueDate)}`,
    `Échéance : ${formatDate(invoice.dueDate)}`,
    '',
    'FACTURÉ À',
    ...billedTo,
    '',
    'DÉTAIL',
    ...detailLines,
    '',
    `TOTAL : ${formatMoney(invoice.amount.toString())}`,
    '',
    'MODE DE PAIEMENT',
    `Virement Interac : ${senderEmail}`,
    '',
    'Merci,',
    businessProfile.displayName,
    senderEmail,
    businessProfile.website || 'nowis.store',
  ].join('\n');

  const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeMailtoValue(subject)}&body=${encodeMailtoValue(message)}`;
  const outlookMobileUrl = `ms-outlook://compose?to=${encodeMailtoValue(recipientEmail)}&subject=${encodeMailtoValue(subject)}&body=${encodeMailtoValue(message)}`;
  const outlookWebUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeMailtoValue(recipientEmail)}&subject=${encodeMailtoValue(subject)}&body=${encodeMailtoValue(message)}`;

  return NextResponse.json({
    outlookUrl: mailtoUrl,
    mailtoUrl,
    outlookMobileUrl,
    outlookWebUrl,
    recipientEmail,
    senderEmail,
    paymentEmail: senderEmail,
    mode: isMobileRequest(request) ? 'mailto-mobile' : 'mailto-fallback',
    pdfAttached: false,
  });
}
