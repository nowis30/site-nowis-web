import { Buffer } from 'node:buffer';
import { InvoiceStatus, Prisma } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildCustomerSnapshotFromContact, getBillingIssuerSnapshot, toCustomerSnapshot, toIssuerSnapshot, validateCustomerSnapshot, validateIssuerSnapshot } from '@/lib/billing-profile';

type PayPalConfig = {
  env: 'sandbox' | 'live';
  clientId: string;
  clientSecret: string;
  webhookId: string | null;
  businessEmail: string;
  currency: string;
};

type PayPalInvoiceLineItem = {
  name: string;
  description?: string;
  quantity: string;
  unit_amount: {
    currency_code: string;
    value: string;
  };
};

type PayPalInvoiceSyncSummary = {
  invoiceId: string;
  paypalInvoiceId: string | null;
  paypalInvoiceUrl: string | null;
  paypalStatus: string | null;
  paypalSentAt: string | null;
  paypalPaidAt: string | null;
  paypalLastWebhookAt: string | null;
  paymentProvider: string | null;
  paymentStatus: string | null;
  paymentAmount: string | null;
  paymentCurrency: string | null;
  crmStatus: string;
};

type WebhookVerificationResult = {
  isValid: boolean;
  event: Record<string, unknown>;
};

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' ? (value as JsonRecord) : {};
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function getPayPalConfig(): PayPalConfig {
  const env = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox';
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim() || '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim() || '';
  const businessEmail = process.env.PAYPAL_BUSINESS_EMAIL?.trim() || '';
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim() || null;
  const currency = (process.env.PAYPAL_CURRENCY?.trim() || 'CAD').toUpperCase();

  if (!clientId || !clientSecret || !businessEmail) {
    throw new Error('PayPal n est pas configure. Ajoute PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET et PAYPAL_BUSINESS_EMAIL.');
  }

  return { env, clientId, clientSecret, webhookId, businessEmail, currency };
}

export function getPayPalBaseUrl() {
  const env = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox';
  return env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

function toMoneyString(value: Prisma.Decimal | string | number | null | undefined) {
  if (value === null || value === undefined) return '0.00';
  return Number(value).toFixed(2);
}

function splitFullName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) return { givenName: 'Client', surname: 'Nowis' };
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { givenName: parts[0], surname: parts[0] };
  return {
    givenName: parts[0],
    surname: parts.slice(1).join(' '),
  };
}

function extractPayPalInvoiceUrl(payload: JsonRecord): string | null {
  const detail = asRecord(payload.detail);
  const metadata = asRecord(detail.metadata);
  const recipientViewUrl = readString(metadata.recipient_view_url);
  if (recipientViewUrl) return recipientViewUrl;

  const href = readString(payload.href);
  if (href) return href;

  const links = Array.isArray(payload.links) ? payload.links : [];
  for (const linkValue of links) {
    const link = asRecord(linkValue);
    const rel = readString(link.rel)?.toLowerCase();
    if (rel && ['payer-view', 'view', 'self'].includes(rel)) {
      const linkHref = readString(link.href);
      if (linkHref) return linkHref;
    }
  }

  return null;
}

function extractPayPalStatus(payload: JsonRecord): string | null {
  const detail = asRecord(payload.detail);
  const invoice = asRecord(payload.invoice);
  const candidates = [payload.status, detail.status, invoice.status];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim().toUpperCase();
  }
  return null;
}

function mapPayPalStatus(paypalStatus: string | null) {
  const normalized = paypalStatus?.toUpperCase() || null;
  if (!normalized) {
    return { paypalStatus: null, paymentStatus: 'unpaid', crmStatus: null as InvoiceStatus | null };
  }

  if (normalized.includes('REFUND')) {
    return { paypalStatus: normalized, paymentStatus: 'refunded', crmStatus: null as InvoiceStatus | null };
  }

  if (normalized.includes('PAID')) {
    return { paypalStatus: normalized, paymentStatus: 'paid', crmStatus: InvoiceStatus.PAID };
  }

  if (normalized.includes('PARTIALLY_PAID')) {
    return { paypalStatus: normalized, paymentStatus: 'partial', crmStatus: InvoiceStatus.SENT };
  }

  if (normalized.includes('CANCEL')) {
    return { paypalStatus: normalized, paymentStatus: 'cancelled', crmStatus: InvoiceStatus.CANCELLED };
  }

  if (normalized.includes('SENT') || normalized.includes('SCHEDULED')) {
    return { paypalStatus: normalized, paymentStatus: 'unpaid', crmStatus: InvoiceStatus.SENT };
  }

  if (normalized.includes('DRAFT')) {
    return { paypalStatus: normalized, paymentStatus: 'unpaid', crmStatus: InvoiceStatus.DRAFT };
  }

  return { paypalStatus: normalized, paymentStatus: 'unpaid', crmStatus: null as InvoiceStatus | null };
}

function buildInvoiceLineItems(invoice: {
  number: string;
  amount: Prisma.Decimal;
  description: string | null;
  convertedFromQuote?: {
    lines: Array<{
      title: string;
      description: string | null;
      quantity: Prisma.Decimal;
      unitPrice: Prisma.Decimal;
    }>;
  } | null;
}, currency: string): PayPalInvoiceLineItem[] {
  const quoteLines = invoice.convertedFromQuote?.lines || [];
  if (quoteLines.length > 0) {
    return quoteLines.map((line) => ({
      name: line.title.slice(0, 120),
      description: line.description || undefined,
      quantity: Number(line.quantity).toFixed(2),
      unit_amount: {
        currency_code: currency,
        value: Number(line.unitPrice).toFixed(2),
      },
    }));
  }

  const descriptionLines = (invoice.description || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (descriptionLines.length === 0) {
    throw new Error('La facture CRM doit contenir au moins un poste ou une description avant creation PayPal.');
  }

  return [
    {
      name: descriptionLines[0].slice(0, 120) || `Facture ${invoice.number}`,
      description: descriptionLines.join(' | ').slice(0, 1000),
      quantity: '1',
      unit_amount: {
        currency_code: currency,
        value: toMoneyString(invoice.amount),
      },
    },
  ];
}

async function getJsonErrorMessage(response: Response) {
  const payload = asRecord(await response.json().catch(() => null));
  const details = Array.isArray(payload.details) ? payload.details : [];
  const firstDetail = asRecord(details[0]);
  return (
    readString(payload.message) ||
    readString(payload.error_description) ||
    readString(payload.name) ||
    readString(firstDetail.issue) ||
    response.statusText
  );
}

export async function getPayPalAccessToken() {
  const config = getPayPalConfig();
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Authentification PayPal impossible: ${await getJsonErrorMessage(response)}`);
  }

  const payload = await response.json() as { access_token?: string };
  if (!payload.access_token) {
    throw new Error('PayPal n a retourne aucun access token.');
  }

  return payload.access_token;
}

async function paypalFetch(path: string, init?: RequestInit) {
  const token = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`PayPal API error: ${await getJsonErrorMessage(response)}`);
  }

  return response;
}

function toSyncSummary(invoice: {
  id: string;
  status: string;
  paypalInvoiceId: string | null;
  paypalInvoiceUrl: string | null;
  paypalStatus: string | null;
  paypalSentAt: Date | null;
  paypalPaidAt: Date | null;
  paypalLastWebhookAt: Date | null;
  paymentProvider: string | null;
  paymentStatus: string | null;
  paymentAmount: Prisma.Decimal | null;
  paymentCurrency: string | null;
}): PayPalInvoiceSyncSummary {
  return {
    invoiceId: invoice.id,
    paypalInvoiceId: invoice.paypalInvoiceId,
    paypalInvoiceUrl: invoice.paypalInvoiceUrl,
    paypalStatus: invoice.paypalStatus,
    paypalSentAt: invoice.paypalSentAt?.toISOString() || null,
    paypalPaidAt: invoice.paypalPaidAt?.toISOString() || null,
    paypalLastWebhookAt: invoice.paypalLastWebhookAt?.toISOString() || null,
    paymentProvider: invoice.paymentProvider,
    paymentStatus: invoice.paymentStatus,
    paymentAmount: invoice.paymentAmount ? invoice.paymentAmount.toString() : null,
    paymentCurrency: invoice.paymentCurrency,
    crmStatus: invoice.status,
  };
}

async function writePaypalActivity(input: {
  title: string;
  description: string;
  contactId: string;
  invoiceId: string;
  userId?: string | null;
}) {
  await prisma.activity.create({
    data: {
      type: 'PAYMENT',
      title: input.title,
      description: input.description,
      contactId: input.contactId,
      invoiceId: input.invoiceId,
      userId: input.userId || null,
    },
  }).catch(() => undefined);
}

export async function createPayPalInvoiceFromCrmInvoice(invoiceId: string, userId?: string | null) {
  const config = getPayPalConfig();
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      contact: {
        select: {
          id: true,
          fullName: true,
          companyName: true,
          email: true,
          phone: true,
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
      convertedFromQuote: {
        include: {
          lines: {
            orderBy: { sortOrder: 'asc' },
            select: {
              title: true,
              description: true,
              quantity: true,
              unitPrice: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    throw new Error('Facture CRM introuvable.');
  }

  if (!invoice.contact.email) {
    throw new Error('Le client de cette facture n a pas de courriel.');
  }

  const issuer = toIssuerSnapshot(invoice.issuerSnapshot) || await getBillingIssuerSnapshot();
  const customer = toCustomerSnapshot(invoice.customerSnapshot) || buildCustomerSnapshotFromContact(invoice.contact);
  const missingIssuer = validateIssuerSnapshot(issuer);
  const missingCustomer = validateCustomerSnapshot(customer);
  if (missingIssuer.length > 0 || missingCustomer.length > 0) {
    throw new Error(
      `Facturation incomplete avant creation PayPal. Emetteur: ${missingIssuer.join(', ') || 'ok'}. Client: ${missingCustomer.join(', ') || 'ok'}.`,
    );
  }

  const items = buildInvoiceLineItems(invoice, config.currency);
  const contactName = splitFullName(invoice.contact.fullName);
  const payload = {
    detail: {
      invoice_number: invoice.number,
      currency_code: invoice.paymentCurrency || config.currency,
      note: invoice.description || `Facture CRM ${invoice.number}`,
      term: process.env.INVOICE_PAYMENT_TERMS || 'Paiement a reception.',
      invoice_date: invoice.issueDate.toISOString().slice(0, 10),
      due_date: invoice.dueDate.toISOString().slice(0, 10),
    },
    invoicer: {
      email_address: config.businessEmail,
    },
    primary_recipients: [
      {
        billing_info: {
          name: {
            given_name: contactName.givenName,
            surname: contactName.surname,
          },
          email_address: invoice.contact.email,
        },
      },
    ],
    items,
  };

  const response = await paypalFetch('/v2/invoicing/invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const created = asRecord(await response.json());
  const createdInvoice = asRecord(created.invoice);
  const paypalInvoiceId = readString(created.id) || readString(createdInvoice.id);

  if (!paypalInvoiceId) {
    throw new Error('PayPal n a pas retourne d identifiant de facture.');
  }

  const mapped = mapPayPalStatus(extractPayPalStatus(created) || 'DRAFT');
  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      paypalInvoiceId,
      paypalInvoiceUrl: extractPayPalInvoiceUrl(created),
      paypalStatus: mapped.paypalStatus,
      paymentProvider: 'PAYPAL',
      paymentStatus: mapped.paymentStatus,
      paymentAmount: invoice.amount,
      paymentCurrency: invoice.paymentCurrency || config.currency,
    },
  });

  await writePaypalActivity({
    title: `Facture PayPal creee : ${invoice.number}`,
    description: `Facture PayPal ${paypalInvoiceId} creee pour ${invoice.contact.email}.`,
    contactId: invoice.contact.id,
    invoiceId: invoice.id,
    userId,
  });

  return toSyncSummary(updated);
}

export async function sendPayPalInvoice(invoiceId: string, userId?: string | null) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      contact: {
        select: {
          id: true,
          fullName: true,
          companyName: true,
          email: true,
          phone: true,
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
    throw new Error('Facture CRM introuvable.');
  }

  if (!invoice.paypalInvoiceId) {
    throw new Error('Aucune facture PayPal liee. Cree la facture PayPal avant envoi.');
  }

  const issuer = toIssuerSnapshot(invoice.issuerSnapshot) || await getBillingIssuerSnapshot();
  const customer = toCustomerSnapshot(invoice.customerSnapshot) || buildCustomerSnapshotFromContact(invoice.contact);
  const missingIssuer = validateIssuerSnapshot(issuer);
  const missingCustomer = validateCustomerSnapshot(customer);
  if (missingIssuer.length > 0 || missingCustomer.length > 0) {
    throw new Error(
      `Facturation incomplete avant envoi PayPal. Emetteur: ${missingIssuer.join(', ') || 'ok'}. Client: ${missingCustomer.join(', ') || 'ok'}.`,
    );
  }

  await paypalFetch(`/v2/invoicing/invoices/${invoice.paypalInvoiceId}/send`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  const remote = await paypalFetch(`/v2/invoicing/invoices/${invoice.paypalInvoiceId}`, {
    method: 'GET',
  });
  const payload = asRecord(await remote.json());
  const mapped = mapPayPalStatus(extractPayPalStatus(payload) || 'SENT');

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      paypalInvoiceUrl: extractPayPalInvoiceUrl(payload) || invoice.paypalInvoiceUrl,
      paypalStatus: mapped.paypalStatus || 'SENT',
      paypalSentAt: new Date(),
      paymentProvider: 'PAYPAL',
      paymentStatus: mapped.paymentStatus,
      status: mapped.crmStatus || (invoice.status === InvoiceStatus.DRAFT ? InvoiceStatus.SENT : invoice.status),
    },
  });

  await writePaypalActivity({
    title: `Facture PayPal envoyee : ${invoice.number}`,
    description: `Facture PayPal ${invoice.paypalInvoiceId} envoyee a ${invoice.contact.email || 'client sans email local'}.`,
    contactId: invoice.contactId,
    invoiceId: invoice.id,
    userId,
  });

  return toSyncSummary(updated);
}

export async function syncPayPalInvoiceStatusByPayPalInvoiceId(paypalInvoiceId: string, options?: {
  userId?: string | null;
  webhookEventType?: string | null;
  markWebhookAt?: boolean;
}) {
  const invoice = await prisma.invoice.findFirst({
    where: { paypalInvoiceId },
    include: {
      contact: { select: { id: true, email: true } },
    },
  });

  if (!invoice) {
    throw new Error('Aucune facture CRM liee a cette facture PayPal.');
  }

  const remote = await paypalFetch(`/v2/invoicing/invoices/${paypalInvoiceId}`, {
    method: 'GET',
  });
  const payload = asRecord(await remote.json());
  const paypalStatus = extractPayPalStatus(payload);
  const mapped = mapPayPalStatus(paypalStatus);
  const paidNow = mapped.paymentStatus === 'paid';
  const amount = asRecord(payload.amount);
  const detail = asRecord(payload.detail);
  const detailAmount = asRecord(detail.amount);
  const paymentAmountValue = readString(amount.value) || readString(detailAmount.value);
  const paymentCurrency =
    readString(amount.currency_code) ||
    readString(detail.currency_code) ||
    invoice.paymentCurrency ||
    process.env.PAYPAL_CURRENCY ||
    'CAD';

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      paypalInvoiceUrl: extractPayPalInvoiceUrl(payload) || invoice.paypalInvoiceUrl,
      paypalStatus: mapped.paypalStatus,
      paymentProvider: 'PAYPAL',
      paymentStatus: mapped.paymentStatus,
      paymentAmount: paymentAmountValue ? new Prisma.Decimal(paymentAmountValue) : invoice.paymentAmount,
      paymentCurrency,
      paypalPaidAt: paidNow ? (invoice.paypalPaidAt || new Date()) : invoice.paypalPaidAt,
      paypalLastWebhookAt: options?.markWebhookAt ? new Date() : invoice.paypalLastWebhookAt,
      status: mapped.crmStatus || invoice.status,
    },
  });

  const label = options?.webhookEventType ? `Webhook PayPal: ${options.webhookEventType}` : 'Statut PayPal synchronise';
  await writePaypalActivity({
    title: `${label} - ${invoice.number}`,
    description: `Statut PayPal: ${mapped.paypalStatus || 'inconnu'} · paiement: ${mapped.paymentStatus || 'inconnu'}.`,
    contactId: invoice.contactId,
    invoiceId: invoice.id,
    userId: options?.userId,
  });

  return toSyncSummary(updated);
}

export async function getPayPalInvoiceStatus(invoiceId: string, userId?: string | null) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { paypalInvoiceId: true },
  });

  if (!invoice?.paypalInvoiceId) {
    throw new Error('Cette facture CRM n est pas encore liee a PayPal.');
  }

  return syncPayPalInvoiceStatusByPayPalInvoiceId(invoice.paypalInvoiceId, { userId });
}

export async function verifyPayPalWebhookSignature(request: NextRequest, rawBody?: string): Promise<WebhookVerificationResult> {
  const config = getPayPalConfig();
  if (!config.webhookId) {
    throw new Error('PAYPAL_WEBHOOK_ID manquant.');
  }

  const bodyText = rawBody ?? await request.text();
  const event = JSON.parse(bodyText) as Record<string, unknown>;
  const token = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: request.headers.get('paypal-auth-algo'),
      cert_url: request.headers.get('paypal-cert-url'),
      transmission_id: request.headers.get('paypal-transmission-id'),
      transmission_sig: request.headers.get('paypal-transmission-sig'),
      transmission_time: request.headers.get('paypal-transmission-time'),
      webhook_id: config.webhookId,
      webhook_event: event,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Verification webhook PayPal impossible: ${await getJsonErrorMessage(response)}`);
  }

  const payload = await response.json() as { verification_status?: string };
  return {
    isValid: payload.verification_status === 'SUCCESS',
    event,
  };
}

export function extractPayPalInvoiceIdFromWebhookEvent(event: Record<string, unknown>) {
  const resource = asRecord(event.resource);
  const invoice = asRecord(resource.invoice);
  const candidates = [
    invoice.id,
    resource.id,
    resource.invoice_id,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}
