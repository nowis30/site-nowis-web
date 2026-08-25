import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { buildPublicInvoiceUrl, signCompactPublicInvoiceToken } from '@/lib/public-links';
import { buildCustomerSnapshotFromContact, getBillingIssuerSnapshot, toCustomerSnapshot, toIssuerSnapshot } from '@/lib/billing-profile';
import {
  createInvoiceOutlookDraft,
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
  // encodeURIComponent utilise %20 pour les espaces. Certains clients Outlook Android
  // affichent littéralement les + produits par URLSearchParams dans les liens mailto.
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

  // Sur ordinateur, Outlook est connecté via Microsoft Graph : le brouillon est créé
  // directement dans la boîte Outlook avec le PDF déjà joint.
  if (!isMobileRequest(request)) {
    try {
      const draft = await createInvoiceOutlookDraft(invoice.id, appUrl);
      return NextResponse.json({
        ...draft,
        mode: 'outlook-draft',
        paymentEmail: draft.senderEmail,
      });
    } catch (error) {
      if (error instanceof OutlookNotConnectedError) {
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
      }

      if (error instanceof OutlookConfigurationError) {
        return NextResponse.json(
          {
            error: error.message,
            code: 'OUTLOOK_CONFIG_MISSING',
          },
          { status: 503 },
        );
      }

      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Impossible de préparer le brouillon Outlook avec le PDF.',
        },
        { status: 502 },
      );
    }
  }

  // Sur mobile, on conserve MAILTO : c'est le chemin le plus fiable pour ouvrir
  // directement l'application de courriel configurée sur Android/iOS.
  const invoiceToken = signCompactPublicInvoiceToken({
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
    contactId: invoice.contact.id,
  });
  const invoiceUrl = buildPublicInvoiceUrl(invoiceToken, appUrl);
  const subject = `Facture ${invoice.number} | ${businessProfile.displayName}`;
  const message = [
    `Bonjour ${customerProfile.fullName},`,
    '',
    `Veuillez trouver ci-dessous la facture ${invoice.number}.`,
    '',
    `Montant dû : ${formatMoney(invoice.amount.toString())}`,
    `Date d'échéance : ${formatDate(invoice.dueDate)}`,
    '',
    'CONSULTER LA FACTURE',
    invoiceUrl,
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
    invoiceUrl,
    recipientEmail,
    senderEmail,
    paymentEmail: senderEmail,
    mode: 'mailto-mobile',
    pdfAttached: false,
  });
}
