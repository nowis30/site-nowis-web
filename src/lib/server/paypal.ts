import { Buffer } from 'node:buffer';
import { InvoiceStatus, Prisma } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildCustomerSnapshotFromContact,
  getBillingIssuerSnapshot,
  type BillingCustomerSnapshot,
  type BillingIssuerSnapshot,
  toCustomerSnapshot,
  toIssuerSnapshot,
  validateCustomerSnapshot,
  validateIssuerSnapshot,
} from '@/lib/billing-profile';
import { buildPayPalAddressFromBilling } from '@/lib/server/paypal-address';

type PayPalConfig = {
  env: 'sandbox' | 'live';
  clientId: string;
  clientSecret: string;
  webhookId: string | null;
  businessEmail: string | null;
  currency: string;
};

type PayPalDiagnostics = {
  configured: boolean;
  env: 'sandbox' | 'live';
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasWebhookId: boolean;
  apiBaseUrl: string;
  webhookUrlExpected: string;
  clientIdPreview: string | null;
  businessEmailConfigured: string | null;
};

type PayPalInvoiceAdminDiagnostics = {
  invoice: {
    id: string;
    number: string;
    isTest: boolean;
    paypalInvoiceIdPresent: boolean;
    paypalInvoiceId: string | null;
    paypalInvoiceUrl: string | null;
    paypalInvoiceUrlHost: string | null;
    paypalInvoiceUrlEnv: 'sandbox' | 'live' | null;
    paypalStatus: string | null;
    paymentProvider: string | null;
    paymentStatus: string | null;
  };
  businessEmailConfigured: string | null;
  merchantEmailUsed: string | null;
  remoteLookup: {
    checked: boolean;
    ok: boolean;
    paypalInvoiceId: string | null;
    invoiceNumber: string | null;
    invoicerEmail: string | null;
    remoteInvoiceUrl: string | null;
    remoteInvoiceUrlHost: string | null;
    remoteInvoiceUrlEnv: 'sandbox' | 'live' | null;
    belongsToCurrentMerchant: boolean | null;
    paypalStatus?: number;
    paypalName?: string | null;
    paypalMessage?: string | null;
    paypalDebugId?: string | null;
    paypalDetails?: PayPalErrorDetail[];
    error?: string;
  } | null;
};

type PayPalErrorDetail = {
  field?: string;
  issue?: string;
  description?: string;
  value?: string;
};

type PayPalApiErrorShape = {
  httpStatus: number;
  name: string | null;
  message: string;
  details: PayPalErrorDetail[];
  debugId: string | null;
};

type PayPalPayloadAddress = {
  address_line_1: string;
  address_line_2?: string;
  admin_area_1?: string;
  admin_area_2: string;
  postal_code: string;
  country_code: string;
};

type PayPalInvoiceCreatePayload = {
  detail: {
    currency_code: string;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    payment_term: { term_type: string };
    note?: string;
  };
  invoicer: {
    business_name?: string;
    name?: { full_name: string };
    email_address?: string;
    address: PayPalPayloadAddress;
  };
  primary_recipients: Array<{
    billing_info: {
      business_name?: string;
      email_address: string;
      name?: { full_name: string };
      address: PayPalPayloadAddress;
    };
  }>;
  items: PayPalInvoiceLineItem[];
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

function extractInvoiceIdFromUrl(value: string | null | undefined) {
  const raw = readString(value);
  if (!raw) return null;

  // Accept both absolute URLs and relative API paths.
  const match = raw.match(/\/v2\/invoicing\/invoices\/([A-Za-z0-9-]+)/i);
  return match?.[1] || null;
}

function trimToNull(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getPayPalEnv(): 'sandbox' | 'live' {
  return (process.env.PAYPAL_ENV || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox';
}

function getPayPalBaseUrlForEnv(env: 'sandbox' | 'live') {
  return env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

function getExpectedPayPalWebhookUrl() {
  const appUrl = trimToNull(process.env.NEXT_PUBLIC_SITE_URL) || trimToNull(process.env.NEXT_PUBLIC_DOMAIN) || 'https://nowis.store';
  return `${appUrl.replace(/\/$/, '')}/api/paypal/webhook`;
}

function getClientIdPreview(clientId: string | null) {
  const value = trimToNull(clientId);
  if (!value) return null;
  return value.slice(0, 6);
}

function getUrlHost(value: string | null | undefined) {
  const trimmed = trimToNull(value);
  if (!trimmed) return null;

  try {
    return new URL(trimmed).host || null;
  } catch {
    return null;
  }
}

function inferPayPalUrlEnv(value: string | null | undefined): 'sandbox' | 'live' | null {
  const host = getUrlHost(value);
  if (!host) return null;

  const normalized = host.toLowerCase();
  if (normalized.includes('sandbox.paypal.com')) return 'sandbox';
  if (normalized === 'paypal.com' || normalized.endsWith('.paypal.com')) return 'live';
  return null;
}

export function getPayPalDiagnostics(): PayPalDiagnostics {
  const env = getPayPalEnv();
  const clientId = trimToNull(process.env.PAYPAL_CLIENT_ID);
  const clientSecret = trimToNull(process.env.PAYPAL_CLIENT_SECRET);
  const webhookId = trimToNull(process.env.PAYPAL_WEBHOOK_ID);
  const businessEmailConfigured = trimToNull(process.env.PAYPAL_BUSINESS_EMAIL);

  return {
    configured: Boolean(clientId && clientSecret && webhookId),
    env,
    hasClientId: Boolean(clientId),
    hasClientSecret: Boolean(clientSecret),
    hasWebhookId: Boolean(webhookId),
    apiBaseUrl: getPayPalBaseUrlForEnv(env),
    webhookUrlExpected: getExpectedPayPalWebhookUrl(),
    clientIdPreview: getClientIdPreview(clientId),
    businessEmailConfigured,
  };
}

export async function getPayPalMerchantEmailUsed() {
  const configuredBusinessEmail = trimToNull(process.env.PAYPAL_BUSINESS_EMAIL);
  if (configuredBusinessEmail) return configuredBusinessEmail;

  const issuer = await getBillingIssuerSnapshot();
  return trimToNull(issuer.email);
}

export class PayPalApiError extends Error {
  httpStatus: number;
  paypalName: string | null;
  details: PayPalErrorDetail[];
  debugId: string | null;

  constructor(shape: PayPalApiErrorShape) {
    super(shape.message);
    this.name = 'PayPalApiError';
    this.httpStatus = shape.httpStatus;
    this.paypalName = shape.name;
    this.details = shape.details;
    this.debugId = shape.debugId;
  }
}

export function isPayPalApiError(error: unknown): error is PayPalApiError {
  return error instanceof PayPalApiError;
}

export function serializePayPalApiError(error: unknown, fallbackMessage: string) {
  if (isPayPalApiError(error)) {
    return {
      status: error.httpStatus,
      body: {
        error: error.message,
        paypalStatus: error.httpStatus,
        paypalName: error.paypalName,
        paypalMessage: error.message,
        paypalDetails: error.details,
        paypalDebugId: error.debugId,
      },
    };
  }

  return {
    status: 400,
    body: {
      error: error instanceof Error ? error.message : fallbackMessage,
    },
  };
}

function getPayPalConfig(): PayPalConfig {
  const env = getPayPalEnv();
  const clientId = trimToNull(process.env.PAYPAL_CLIENT_ID) || '';
  const clientSecret = trimToNull(process.env.PAYPAL_CLIENT_SECRET) || '';
  const businessEmail = trimToNull(process.env.PAYPAL_BUSINESS_EMAIL);
  const webhookId = trimToNull(process.env.PAYPAL_WEBHOOK_ID);
  const currency = (trimToNull(process.env.PAYPAL_CURRENCY) || 'CAD').toUpperCase();

  if (!clientId || !clientSecret) {
    throw new Error('PayPal n est pas configure. Ajoute PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET.');
  }

  return { env, clientId, clientSecret, webhookId, businessEmail, currency };
}

export function getPayPalBaseUrl() {
  return getPayPalBaseUrlForEnv(getPayPalEnv());
}

function toMoneyString(value: Prisma.Decimal | string | number | null | undefined) {
  if (value === null || value === undefined) return '0.00';
  return Number(value).toFixed(2);
}

function buildPayPalName(value: string | null | undefined) {
  const fullName = trimToNull(value);
  if (!fullName) return undefined;
  return { full_name: fullName };
}

function buildPayPalContactName(params: {
  fullName?: string | null;
  businessName?: string | null;
  fallbackName?: string | null;
}) {
  return compactValue({
    business_name: trimToNull(params.businessName),
    name: buildPayPalName(trimToNull(params.fullName) || trimToNull(params.fallbackName)),
  });
}

function compactValue<T>(value: T): T | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string' && value.trim().length === 0) return undefined;
  if (Array.isArray(value)) {
    const compactedArray = value
      .map((item) => compactValue(item))
      .filter((item) => item !== undefined);
    return (compactedArray.length > 0 ? compactedArray : undefined) as T | undefined;
  }
  if (typeof value === 'object') {
    const compactedEntries = Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => [key, compactValue(entry)] as const)
      .filter(([, entry]) => entry !== undefined);
    return (compactedEntries.length > 0 ? Object.fromEntries(compactedEntries) : undefined) as T | undefined;
  }
  return value;
}

function getPayPalPaymentTerm(issueDate: Date, dueDate: Date) {
  const diffDays = Math.max(0, Math.ceil((dueDate.getTime() - issueDate.getTime()) / (24 * 60 * 60 * 1000)));
  if (diffDays <= 0) return { term_type: 'DUE_ON_RECEIPT' };
  if (diffDays <= 10) return { term_type: 'NET_10' };
  if (diffDays <= 15) return { term_type: 'NET_15' };
  if (diffDays <= 30) return { term_type: 'NET_30' };
  if (diffDays <= 45) return { term_type: 'NET_45' };
  if (diffDays <= 60) return { term_type: 'NET_60' };
  return { term_type: 'NET_30' };
}

function normalizePayPalDetails(details: unknown): PayPalErrorDetail[] {
  if (!Array.isArray(details)) return [];
  return details.map((detail) => {
    const item = asRecord(detail);
    return {
      field: readString(item.field) || undefined,
      issue: readString(item.issue) || undefined,
      description: readString(item.description) || undefined,
      value: readString(item.value) || undefined,
    };
  });
}

async function readPayPalError(response: Response) {
  const payload = asRecord(await response.json().catch(() => null));
  const details = normalizePayPalDetails(payload.details);
  return new PayPalApiError({
    httpStatus: response.status,
    name: readString(payload.name),
    message:
      readString(payload.message) ||
      readString(payload.error_description) ||
      details[0]?.description ||
      details[0]?.issue ||
      response.statusText ||
      'Erreur PayPal inconnue',
    details,
    debugId: readString(payload.debug_id),
  });
}

export function isDuplicatePayPalInvoiceNumberError(error: unknown) {
  if (!isPayPalApiError(error)) return false;
  if (error.httpStatus !== 422) return false;

  const haystack = [
    error.paypalName,
    error.message,
    ...error.details.flatMap((detail) => [detail.field, detail.issue, detail.description, detail.value]),
  ]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLowerCase();

  return haystack.includes('invoice number is duplicate') || (haystack.includes('invoice') && haystack.includes('duplicate'));
}

function extractPayPalInvoiceId(payload: JsonRecord) {
  const invoice = asRecord(payload.invoice);
  const directId =
    readString(payload.id) ||
    readString(payload.invoice_id) ||
    readString(invoice.id) ||
    readString(invoice.invoice_id);
  if (directId) return directId;

  const hrefId = extractInvoiceIdFromUrl(readString(payload.href));
  if (hrefId) return hrefId;

  const links = Array.isArray(payload.links) ? payload.links : [];
  for (const linkValue of links) {
    const link = asRecord(linkValue);
    const linkId = extractInvoiceIdFromUrl(readString(link.href));
    if (linkId) return linkId;
  }

  return null;
}

function extractPayPalInvoiceNumber(payload: JsonRecord) {
  const detail = asRecord(payload.detail);
  const invoice = asRecord(payload.invoice);
  const invoiceDetail = asRecord(invoice.detail);
  return (
    readString(detail.invoice_number) ||
    readString(payload.invoice_number) ||
    readString(invoiceDetail.invoice_number)
  );
}

async function findPayPalInvoiceByInvoiceNumber(invoiceNumber: string) {
  const normalizedInvoiceNumber = trimToNull(invoiceNumber);
  if (!normalizedInvoiceNumber) return null;

  let page = 1;
  const pageSize = 100;
  const maxPages = 10;

  while (page <= maxPages) {
    const response = await paypalFetch(`/v2/invoicing/invoices?page=${page}&page_size=${pageSize}&total_required=true`, {
      method: 'GET',
    });
    const payload = asRecord(await response.json());
    const items = Array.isArray(payload.items) ? payload.items : [];

    for (const itemValue of items) {
      const item = asRecord(itemValue);
      if (extractPayPalInvoiceNumber(item) === normalizedInvoiceNumber) {
        const paypalInvoiceId = extractPayPalInvoiceId(item);
        if (!paypalInvoiceId) return null;
        return { paypalInvoiceId, payload: item };
      }
    }

    const totalPages = Number(payload.total_pages);
    if (Number.isFinite(totalPages) && totalPages > 0) {
      if (page >= totalPages) break;
    } else if (items.length < pageSize) {
      break;
    }

    page += 1;
  }

  return null;
}

function buildPayPalInvoicer(issuer: BillingIssuerSnapshot, fallbackBusinessEmail: string | null) {
  const displayName = trimToNull(issuer.displayName) || trimToNull(issuer.companyName) || 'Nowis';
  const address = buildPayPalAddressFromBilling({
    addressLine1: issuer.addressLine1,
    addressLine2: issuer.addressLine2,
    city: issuer.city,
    state: issuer.state,
    postalCode: issuer.postalCode,
    country: issuer.country,
  });
  const contactName = buildPayPalContactName({
    businessName: issuer.companyName || issuer.tradeName || 'Création Nowis',
    fullName: issuer.displayName,
    fallbackName: issuer.legalLabel || displayName,
  });

  return compactValue({
    business_name: contactName?.business_name,
    name: contactName?.name,
    email_address: fallbackBusinessEmail || trimToNull(issuer.email) || undefined,
    address,
  }) as PayPalInvoiceCreatePayload['invoicer'];
}

function buildPayPalRecipient(customer: BillingCustomerSnapshot) {
  const address = buildPayPalAddressFromBilling({
    addressLine1: customer.addressLine1,
    addressLine2: customer.addressLine2,
    city: customer.city,
    state: customer.state,
    postalCode: customer.postalCode,
    country: customer.country,
  });
  const contactName = buildPayPalContactName({
    businessName: customer.companyName || customer.legalName,
    fullName: customer.fullName,
  });

  return {
    billing_info: compactValue({
      business_name: contactName?.business_name,
      email_address: customer.email,
      name: contactName?.name,
      address,
    }),
  } as PayPalInvoiceCreatePayload['primary_recipients'][0];
}

export function buildPayPalInvoiceCreatePayload(params: {
  invoice: {
    number: string;
    description: string | null;
    issueDate: Date;
    dueDate: Date;
    paymentCurrency: string | null;
  };
  items: PayPalInvoiceLineItem[];
  issuer: BillingIssuerSnapshot;
  customer: BillingCustomerSnapshot;
  currency: string;
  businessEmail?: string | null;
}) {
  const payload = compactValue({
    detail: {
      currency_code: params.invoice.paymentCurrency || params.currency,
      invoice_number: params.invoice.number,
      invoice_date: params.invoice.issueDate.toISOString().slice(0, 10),
      due_date: params.invoice.dueDate.toISOString().slice(0, 10),
      payment_term: getPayPalPaymentTerm(params.invoice.issueDate, params.invoice.dueDate),
      note: trimToNull(params.invoice.description) || `Facture CRM ${params.invoice.number}`,
    },
    invoicer: buildPayPalInvoicer(params.issuer, params.businessEmail || null),
    primary_recipients: [buildPayPalRecipient(params.customer)],
    items: params.items,
  });

  if (!payload) {
    throw new Error('Payload PayPal vide.');
  }

  return payload as PayPalInvoiceCreatePayload;
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
    throw await readPayPalError(response);
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
    throw await readPayPalError(response);
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

export async function reuseExistingPayPalInvoiceIfPresent<T>(params: {
  invoiceId: string;
  paypalInvoiceId: string | null;
  syncExisting: (invoiceId: string) => Promise<T>;
}) {
  if (!params.paypalInvoiceId) return null;
  return params.syncExisting(params.invoiceId);
}

export function derivePayPalInvoiceSyncUpdate(params: {
  invoice: {
    status: InvoiceStatus;
    paymentCurrency: string | null;
    paymentAmount: Prisma.Decimal | null;
    paypalInvoiceUrl: string | null;
    paypalPaidAt: Date | null;
    paypalLastWebhookAt: Date | null;
  };
  payload: JsonRecord;
  markWebhookAt?: boolean;
}) {
  const paypalStatus = extractPayPalStatus(params.payload);
  const mapped = mapPayPalStatus(paypalStatus);
  const paidNow = mapped.paymentStatus === 'paid';
  const amount = asRecord(params.payload.amount);
  const detail = asRecord(params.payload.detail);
  const detailAmount = asRecord(detail.amount);
  const paymentAmountValue = readString(amount.value) || readString(detailAmount.value);
  const paymentCurrency =
    readString(amount.currency_code) ||
    readString(detail.currency_code) ||
    params.invoice.paymentCurrency ||
    trimToNull(process.env.PAYPAL_CURRENCY) ||
    'CAD';

  return {
    paypalInvoiceUrl: extractPayPalInvoiceUrl(params.payload) || params.invoice.paypalInvoiceUrl,
    paypalStatus: mapped.paypalStatus,
    paymentProvider: 'PAYPAL',
    paymentStatus: mapped.paymentStatus,
    paymentAmount: paymentAmountValue ? new Prisma.Decimal(paymentAmountValue) : params.invoice.paymentAmount,
    paymentCurrency,
    paypalPaidAt: paidNow ? (params.invoice.paypalPaidAt || new Date()) : params.invoice.paypalPaidAt,
    paypalLastWebhookAt: params.markWebhookAt ? new Date() : params.invoice.paypalLastWebhookAt,
    status: mapped.crmStatus || params.invoice.status,
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

  const existing = await reuseExistingPayPalInvoiceIfPresent({
    invoiceId: invoice.id,
    paypalInvoiceId: invoice.paypalInvoiceId,
    syncExisting: (currentInvoiceId) => getPayPalInvoiceStatus(currentInvoiceId, userId),
  });
  if (existing) {
    return existing;
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
  const payload = buildPayPalInvoiceCreatePayload({
    invoice: {
      number: invoice.number,
      description: invoice.description,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paymentCurrency: invoice.paymentCurrency,
    },
    items,
    issuer,
    customer,
    currency: config.currency,
    businessEmail: config.businessEmail,
  });

  try {
    const response = await paypalFetch('/v2/invoicing/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const locationHeader = readString(response.headers.get('location'));
    const created = asRecord(await response.json());
    const createdInvoice = asRecord(created.invoice);
    const paypalInvoiceId =
      extractPayPalInvoiceId(created) ||
      extractPayPalInvoiceId(createdInvoice) ||
      extractInvoiceIdFromUrl(locationHeader);

    if (!paypalInvoiceId) {
      throw new Error('PayPal n a pas retourne d identifiant de facture.');
    }

    let paypalInvoiceUrl = extractPayPalInvoiceUrl(created);
    if (!paypalInvoiceUrl) {
      const detailResponse = await paypalFetch(`/v2/invoicing/invoices/${paypalInvoiceId}`, { method: 'GET' });
      const detailPayload = asRecord(await detailResponse.json());
      paypalInvoiceUrl = extractPayPalInvoiceUrl(detailPayload);
    }

    const mapped = mapPayPalStatus(extractPayPalStatus(created) || 'DRAFT');
    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paypalInvoiceId,
        paypalInvoiceUrl,
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
  } catch (error) {
    if (!isDuplicatePayPalInvoiceNumberError(error)) {
      throw error;
    }

    const remoteDuplicate = await findPayPalInvoiceByInvoiceNumber(invoice.number);
    if (!remoteDuplicate?.paypalInvoiceId) {
      throw error;
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paypalInvoiceId: remoteDuplicate.paypalInvoiceId,
        paymentProvider: 'PAYPAL',
      },
    });

    await writePaypalActivity({
      title: `Facture PayPal rattachee : ${invoice.number}`,
      description: `Facture PayPal existante ${remoteDuplicate.paypalInvoiceId} rattachee apres detection d un doublon PayPal sur le numero ${invoice.number}.`,
      contactId: invoice.contact.id,
      invoiceId: invoice.id,
      userId,
    });

    return syncPayPalInvoiceStatusByPayPalInvoiceId(remoteDuplicate.paypalInvoiceId, { userId });
  }
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
  const recipientEmail = trimToNull(customer.email) || trimToNull(invoice.contact.email);
  const merchantEmail = await getPayPalMerchantEmailUsed();

  // Live PayPal can reject invoices sent to the same email as the merchant account.
  if (recipientEmail && merchantEmail && recipientEmail.toLowerCase() === merchantEmail.toLowerCase()) {
    throw new Error(
      'Le courriel client est identique au courriel marchand PayPal. Utilise une adresse client differente pour envoyer la facture PayPal.',
    );
  }

  const missingIssuer = validateIssuerSnapshot(issuer);
  const missingCustomer = validateCustomerSnapshot(customer);
  if (missingIssuer.length > 0 || missingCustomer.length > 0) {
    throw new Error(
      `Facturation incomplete avant envoi PayPal. Emetteur: ${missingIssuer.join(', ') || 'ok'}. Client: ${missingCustomer.join(', ') || 'ok'}.`,
    );
  }

  const remoteBeforeSend = await paypalFetch(`/v2/invoicing/invoices/${invoice.paypalInvoiceId}`, {
    method: 'GET',
  });
  const payloadBeforeSend = asRecord(await remoteBeforeSend.json());
  const statusBeforeSend = extractPayPalStatus(payloadBeforeSend) || 'UNKNOWN';

  // If already sent/paid remotely, avoid a second send call that returns 422 and just sync local state.
  if (!['DRAFT', 'SCHEDULED'].includes(statusBeforeSend)) {
    const syncUpdateBeforeSend = derivePayPalInvoiceSyncUpdate({
      invoice,
      payload: payloadBeforeSend,
    });
    const updatedBeforeSend = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        ...syncUpdateBeforeSend,
        paypalStatus: extractPayPalStatus(payloadBeforeSend) || invoice.paypalStatus,
        paypalSentAt: invoice.paypalSentAt || new Date(),
        status:
          syncUpdateBeforeSend.status ||
          (invoice.status === InvoiceStatus.DRAFT ? InvoiceStatus.SENT : invoice.status),
      },
    });

    return toSyncSummary(updatedBeforeSend);
  }

  await paypalFetch(`/v2/invoicing/invoices/${invoice.paypalInvoiceId}/send`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  const remote = await paypalFetch(`/v2/invoicing/invoices/${invoice.paypalInvoiceId}`, {
    method: 'GET',
  });
  const payload = asRecord(await remote.json());
  const syncUpdate = derivePayPalInvoiceSyncUpdate({
    invoice,
    payload,
  });

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      ...syncUpdate,
      paypalStatus: extractPayPalStatus(payload) || 'SENT',
      paypalSentAt: new Date(),
      status:
        syncUpdate.status ||
        (invoice.status === InvoiceStatus.DRAFT ? InvoiceStatus.SENT : invoice.status),
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
  const syncUpdate = derivePayPalInvoiceSyncUpdate({
    invoice,
    payload,
    markWebhookAt: options?.markWebhookAt,
  });
  const mapped = mapPayPalStatus(extractPayPalStatus(payload));

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: syncUpdate,
  });

  const label = options?.webhookEventType === 'INVOICING.INVOICE.PAID'
    ? 'Paiement PayPal confirme'
    : options?.webhookEventType
      ? `Webhook PayPal: ${options.webhookEventType}`
      : 'Statut PayPal synchronise';
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

export async function getPayPalInvoiceAdminDiagnostics(invoiceId: string): Promise<PayPalInvoiceAdminDiagnostics> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      number: true,
      isTest: true,
      paypalInvoiceId: true,
      paypalInvoiceUrl: true,
      paypalStatus: true,
      paymentProvider: true,
      paymentStatus: true,
    },
  });

  if (!invoice) {
    throw new Error('Facture introuvable.');
  }

  const businessEmailConfigured = trimToNull(process.env.PAYPAL_BUSINESS_EMAIL);
  const merchantEmailUsed = await getPayPalMerchantEmailUsed();
  let remoteLookup: PayPalInvoiceAdminDiagnostics['remoteLookup'] = null;

  if (invoice.paypalInvoiceId && getPayPalDiagnostics().hasClientId && getPayPalDiagnostics().hasClientSecret) {
    try {
      const remote = await paypalFetch(`/v2/invoicing/invoices/${invoice.paypalInvoiceId}`, {
        method: 'GET',
      });
      const payload = asRecord(await remote.json());
      const invoicer = asRecord(payload.invoicer);
      const invoicerEmail = readString(invoicer.email_address);
      const remoteInvoiceUrl = extractPayPalInvoiceUrl(payload);

      remoteLookup = {
        checked: true,
        ok: true,
        paypalInvoiceId: extractPayPalInvoiceId(payload) || invoice.paypalInvoiceId,
        invoiceNumber: extractPayPalInvoiceNumber(payload),
        invoicerEmail,
        remoteInvoiceUrl,
        remoteInvoiceUrlHost: getUrlHost(remoteInvoiceUrl),
        remoteInvoiceUrlEnv: inferPayPalUrlEnv(remoteInvoiceUrl),
        belongsToCurrentMerchant:
          merchantEmailUsed && invoicerEmail
            ? merchantEmailUsed.toLowerCase() === invoicerEmail.toLowerCase()
            : null,
      };
    } catch (error) {
      if (isPayPalApiError(error)) {
        remoteLookup = {
          checked: true,
          ok: false,
          paypalInvoiceId: invoice.paypalInvoiceId,
          invoiceNumber: null,
          invoicerEmail: null,
          remoteInvoiceUrl: null,
          remoteInvoiceUrlHost: null,
          remoteInvoiceUrlEnv: null,
          belongsToCurrentMerchant: null,
          paypalStatus: error.httpStatus,
          paypalName: error.paypalName,
          paypalMessage: error.message,
          paypalDebugId: error.debugId,
          paypalDetails: error.details,
        };
      } else {
        remoteLookup = {
          checked: true,
          ok: false,
          paypalInvoiceId: invoice.paypalInvoiceId,
          invoiceNumber: null,
          invoicerEmail: null,
          remoteInvoiceUrl: null,
          remoteInvoiceUrlHost: null,
          remoteInvoiceUrlEnv: null,
          belongsToCurrentMerchant: null,
          error: error instanceof Error ? error.message : 'Diagnostic PayPal impossible.',
        };
      }
    }
  }

  return {
    invoice: {
      id: invoice.id,
      number: invoice.number,
      isTest: invoice.isTest,
      paypalInvoiceIdPresent: Boolean(invoice.paypalInvoiceId),
      paypalInvoiceId: invoice.paypalInvoiceId,
      paypalInvoiceUrl: invoice.paypalInvoiceUrl,
      paypalInvoiceUrlHost: getUrlHost(invoice.paypalInvoiceUrl),
      paypalInvoiceUrlEnv: inferPayPalUrlEnv(invoice.paypalInvoiceUrl),
      paypalStatus: invoice.paypalStatus,
      paymentProvider: invoice.paymentProvider,
      paymentStatus: invoice.paymentStatus,
    },
    businessEmailConfigured,
    merchantEmailUsed,
    remoteLookup,
  };
}

export async function resetPayPalInvoiceLinkForTest(invoiceId: string, userId?: string | null) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      number: true,
      status: true,
      isTest: true,
      contactId: true,
      paypalInvoiceId: true,
      paypalInvoiceUrl: true,
      paypalStatus: true,
      paypalSentAt: true,
      paypalPaidAt: true,
      paypalLastWebhookAt: true,
      paymentProvider: true,
      paymentStatus: true,
      paymentAmount: true,
      paymentCurrency: true,
    },
  });

  if (!invoice) {
    throw new Error('Facture introuvable.');
  }

  if (!invoice.isTest) {
    throw new Error('Le reset PayPal est reserve aux factures de test.');
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paypalInvoiceId: null,
      paypalInvoiceUrl: null,
      paypalStatus: null,
      paypalSentAt: null,
      paypalPaidAt: null,
      paypalLastWebhookAt: null,
      paymentProvider: null,
      paymentStatus: null,
    },
  });

  await writePaypalActivity({
    title: `Lien PayPal reinitialise : ${invoice.number}`,
    description: 'Lien PayPal de test reinitialise pour retenter un cycle create/send/status complet.',
    contactId: invoice.contactId,
    invoiceId: invoice.id,
    userId,
  });

  return toSyncSummary(updated);
}

export async function verifyPayPalWebhookSignature(request: NextRequest, rawBody?: string): Promise<WebhookVerificationResult> {
  const config = getPayPalConfig();
  if (!config.webhookId) {
    throw new Error('PAYPAL_WEBHOOK_ID manquant.');
  }

  const transmissionId = request.headers.get('paypal-transmission-id');
  const transmissionTime = request.headers.get('paypal-transmission-time');
  const certUrl = request.headers.get('paypal-cert-url');
  const authAlgo = request.headers.get('paypal-auth-algo');
  const transmissionSig = request.headers.get('paypal-transmission-sig');

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    throw new Error('Headers PayPal webhook incomplets.');
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
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: config.webhookId,
      webhook_event: event,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw await readPayPalError(response);
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
