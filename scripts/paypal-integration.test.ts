import assert from 'node:assert/strict';
import test from 'node:test';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import {
  buildPayPalInvoiceCreatePayload,
  derivePayPalInvoiceSyncUpdate,
  isDuplicatePayPalInvoiceNumberError,
  PayPalApiError,
  PayPalValidationError,
  reuseExistingPayPalInvoiceIfPresent,
  serializePayPalApiError,
  validatePayPalInvoicePreconditions,
  syncPayPalInvoiceStatusByPayPalInvoiceId,
} from '@/lib/server/paypal';
import { prisma } from '@/lib/prisma';
import { handlePayPalWebhookRequest, PAYPAL_MAX_WEBHOOK_BODY_BYTES } from '@/lib/server/paypal-webhook';
import {
  buildPayPalAddressFromBilling,
  normalizePayPalCountryCode,
  normalizePayPalProvince,
} from '@/lib/server/paypal-address';

const issuer = {
  displayName: 'Simon Morin',
  companyName: 'Création Nowis',
  legalLabel: undefined,
  tradeName: undefined,
  email: 'billing@nowis.store',
  phone: undefined,
  website: undefined,
  addressLine1: '123 Rue Principale',
  addressLine2: undefined,
  city: 'Montreal',
  state: 'Québec',
  postalCode: 'H2X 1Y4',
  country: 'Canada',
  taxId: undefined,
  paymentTerms: undefined,
  footerNote: undefined,
  profileId: null,
  taxesEnabled: true,
  taxRateGst: 0.05,
  taxRateQst: 0.09975,
  currency: 'CAD',
};

const customer = {
  fullName: 'Client Test',
  companyName: null,
  legalName: null,
  email: 'client@example.com',
  phone: null,
  addressLine1: '456 Avenue Test',
  addressLine2: null,
  city: 'Quebec',
  state: 'QC',
  postalCode: 'G1A 1A1',
  country: 'Canada',
  taxId: null,
  notes: null,
};

test('normalizePayPalCountryCode("Canada") -> "CA"', () => {
  assert.equal(normalizePayPalCountryCode('Canada'), 'CA');
});

test('normalizePayPalCountryCode("CA") -> "CA"', () => {
  assert.equal(normalizePayPalCountryCode('CA'), 'CA');
});

test('normalizePayPalProvince("Québec") -> "QC"', () => {
  assert.equal(normalizePayPalProvince('Québec'), 'QC');
});

test('payload PayPal ne contient jamais country_code Canada', () => {
  const payload = buildPayPalInvoiceCreatePayload({
    invoice: {
      number: 'FAC-20260505-001',
      description: 'Facture de test',
      issueDate: new Date('2026-05-05T10:00:00.000Z'),
      dueDate: new Date('2026-05-15T10:00:00.000Z'),
      paymentCurrency: 'CAD',
    },
    items: [{
      name: 'Chanson personnalisée',
      quantity: '1',
      unit_amount: { currency_code: 'CAD', value: '125.00' },
    }],
    issuer,
    customer,
    currency: 'CAD',
    businessEmail: 'billing@nowis.store',
  });

  const serialized = JSON.stringify(payload);
  assert.equal(serialized.includes('"country_code":"Canada"'), false);
  assert.equal(serialized.includes('"country_code":"CA"'), true);
});

test('payload PayPal utilise business_name string et name.full_name objet', () => {
  const payload = buildPayPalInvoiceCreatePayload({
    invoice: {
      number: 'FAC-20260505-002',
      description: 'Facture de schema',
      issueDate: new Date('2026-05-05T10:00:00.000Z'),
      dueDate: new Date('2026-05-15T10:00:00.000Z'),
      paymentCurrency: 'CAD',
    },
    items: [{
      name: 'Chanson personnalisée',
      quantity: '1',
      unit_amount: { currency_code: 'CAD', value: '125.00' },
    }],
    issuer,
    customer,
    currency: 'CAD',
    businessEmail: 'billing@nowis.store',
  });

  assert.equal(payload.invoicer.business_name, 'Création Nowis');
  assert.deepEqual(payload.invoicer.name, { full_name: 'Simon Morin' });
  assert.equal(typeof payload.invoicer.name, 'object');
  assert.equal('full_name' in (payload.invoicer.name || {}), true);
  assert.deepEqual(payload.primary_recipients[0]?.billing_info.name, { full_name: 'Client Test' });
  assert.equal(typeof payload.primary_recipients[0]?.billing_info.name, 'object');

  const serialized = JSON.stringify(payload);
  assert.equal(serialized.includes('"name":"Création Nowis"'), false);
  assert.equal(serialized.includes('"name":"Client Test"'), false);
});

test('create ne recree pas si paypalInvoiceId existe', async () => {
  let syncCalls = 0;
  const result = await reuseExistingPayPalInvoiceIfPresent({
    invoiceId: 'inv-1',
    paypalInvoiceId: 'paypal-123',
    syncExisting: async (invoiceId) => {
      syncCalls += 1;
      return { invoiceId, reused: true };
    },
  });

  assert.equal(syncCalls, 1);
  assert.deepEqual(result, { invoiceId: 'inv-1', reused: true });
});

test('duplicate invoice number PayPal est detecte pour rattachement distant', () => {
  const error = new PayPalApiError({
    httpStatus: 422,
    name: 'UNPROCESSABLE_ENTITY',
    message: 'The requested action could not be performed, semantically incorrect, or failed business validation.',
    details: [{ description: 'Invoice number is duplicate.' }],
    debugId: 'debug-123',
  });

  assert.equal(isDuplicatePayPalInvoiceNumberError(error), true);
});

test('serializePayPalApiError expose type, debug_id et details utiles', () => {
  const error = new PayPalApiError({
    httpStatus: 422,
    name: 'UNPROCESSABLE_ENTITY',
    message: 'The requested action could not be performed, semantically incorrect, or failed business validation.',
    details: [{ field: '/detail/invoice_number', description: 'Invoice number is duplicate.' }],
    debugId: 'debug-422',
    links: [{ href: 'https://api-m.paypal.com/v2/invoicing/invoices/INV2-123', rel: 'self', method: 'GET' }],
  });

  const serialized = serializePayPalApiError(error, 'Creation PayPal impossible');
  assert.equal(serialized.status, 422);
  assert.equal(serialized.body.paypalName, 'UNPROCESSABLE_ENTITY');
  assert.equal(serialized.body.paypalDebugId, 'debug-422');
  assert.equal(Array.isArray(serialized.body.paypalLinks), true);
  assert.equal(String(serialized.body.error).includes('Type: UNPROCESSABLE_ENTITY'), true);
  assert.equal(String(serialized.body.error).includes('Debug ID: debug-422'), true);
  assert.equal(String(serialized.body.error).includes('Invoice number is duplicate.'), true);
});

test('validatePayPalInvoicePreconditions bloque email manquant, montant nul et devise non CAD', () => {
  assert.throws(
    () => validatePayPalInvoicePreconditions({
      invoice: {
        id: 'inv-1',
        number: 'FAC-20260505-003',
        amount: new Prisma.Decimal('0.00'),
        description: null,
        paymentCurrency: 'USD',
        contactId: 'contact-1',
      },
      contact: { id: 'contact-1', email: null },
      issuerMissing: ['nom legal'],
      customerMissing: ['adresse'],
      hasLineItems: false,
      currency: 'CAD',
    }),
    (error: unknown) => {
      assert.equal(error instanceof PayPalValidationError, true);
      const validationError = error as PayPalValidationError;
      assert.equal(validationError.details.some((detail) => detail.field === 'primary_recipients[0].billing_info.email_address'), true);
      assert.equal(validationError.details.some((detail) => detail.field === 'amount.value'), true);
      assert.equal(validationError.details.some((detail) => detail.field === 'detail.currency_code'), true);
      assert.equal(validationError.details.some((detail) => detail.field === 'items'), true);
      return true;
    },
  );
});

test('webhook PAID met Invoice.status a PAID', () => {
  const update = derivePayPalInvoiceSyncUpdate({
    invoice: {
      amount: new Prisma.Decimal('125.00'),
      status: InvoiceStatus.SENT,
      paymentCurrency: 'CAD',
      paymentAmount: new Prisma.Decimal('125.00'),
      paypalInvoiceUrl: null,
      paypalPaidAt: null,
      paypalLastWebhookAt: null,
    },
    payload: {
      status: 'PAID',
      amount: { value: '125.00', currency_code: 'CAD' },
      detail: {
        metadata: { recipient_view_url: 'https://paypal.example/invoice' },
      },
    },
    markWebhookAt: true,
  });

  assert.equal(update.status, InvoiceStatus.PAID);
  assert.equal(update.paymentStatus, 'paid');
  assert.equal(update.paypalStatus, 'PAID');
  assert.ok(update.paypalPaidAt instanceof Date);
  assert.ok(update.paypalLastWebhookAt instanceof Date);
});

test('PayPal exact statuses never treat UNPAID, partial, refunded or unknown states as a full payment', () => {
  const invoice = { amount: new Prisma.Decimal('125.00'), status: InvoiceStatus.SENT, paymentCurrency: 'CAD',
    paymentAmount: null, paypalInvoiceUrl: null, paypalPaidAt: null, paypalLastWebhookAt: null };
  for (const [status, paymentStatus, crmStatus] of [
    ['UNPAID', 'unpaid', InvoiceStatus.SENT],
    ['PARTIALLY_PAID', 'partial', InvoiceStatus.SENT],
    ['PAYMENT_PENDING', 'unpaid', InvoiceStatus.SENT],
    ['REFUNDED', 'refunded', InvoiceStatus.SENT],
    ['PARTIALLY_REFUNDED', 'refunded', InvoiceStatus.SENT],
    ['CANCELLED', 'cancelled', InvoiceStatus.CANCELLED],
    ['UNKNOWN_PAID_STATE', 'unpaid', InvoiceStatus.SENT],
  ] as const) {
    const update = derivePayPalInvoiceSyncUpdate({ invoice, payload: { status, amount: { value: '125.00', currency_code: 'CAD' } } });
    assert.equal(update.paymentStatus, paymentStatus, status);
    assert.equal(update.status, crmStatus, status);
    assert.equal(update.paypalPaidAt, null, status);
  }
  const refunded = derivePayPalInvoiceSyncUpdate({ invoice: { ...invoice, status: InvoiceStatus.PAID }, payload: { status: 'REFUNDED' } });
  assert.equal(refunded.status, InvoiceStatus.SENT);
});

test('PayPal PAID requires the persisted amount and currency and sufficient reported payments', () => {
  const invoice = { amount: new Prisma.Decimal('125.00'), status: InvoiceStatus.SENT, paymentCurrency: 'CAD',
    paymentAmount: null, paypalInvoiceUrl: null, paypalPaidAt: null, paypalLastWebhookAt: null };
  for (const amount of [
    { value: '1.00', currency_code: 'CAD' },
    { value: '125.00', currency_code: 'USD' },
    { value: '-125.00', currency_code: 'CAD' },
    { value: 'Infinity', currency_code: 'CAD' },
    { value: '125.00' },
    {},
  ]) assert.throws(() => derivePayPalInvoiceSyncUpdate({ invoice, payload: { status: 'PAID', amount } }), /incohérent/);
  const amount = { value: '125.00', currency_code: 'CAD' };
  assert.throws(() => derivePayPalInvoiceSyncUpdate({ invoice, payload: { status: 'PAID', amount,
    payments: { paid_amount: { value: '25.00', currency_code: 'CAD' } } } }), /incomplet/);
  assert.throws(() => derivePayPalInvoiceSyncUpdate({ invoice, payload: { status: 'PAID', amount,
    payments: { paid_amount: { value: '125.00', currency_code: 'USD' } } } }), /incomplet/);
  for (const status of ['PAID', 'MARKED_AS_PAID', 'PAID_EXTERNAL']) {
    const update = derivePayPalInvoiceSyncUpdate({ invoice, payload: { status, amount,
      payments: { paid_amount: amount } } });
    assert.equal(update.status, InvoiceStatus.PAID);
    assert.equal(update.paymentStatus, 'paid');
  }
});

test('an older concurrent PayPal lookup cannot overwrite a newer refund or CRM edit', async () => {
  const env = { PAYPAL_CLIENT_ID: 'isolated-id', PAYPAL_CLIENT_SECRET: 'isolated-key', PAYPAL_CURRENCY: 'CAD', PAYPAL_ENV: 'sandbox' };
  const previousEnv = Object.fromEntries(Object.keys(env).map(name => [name, process.env[name]]));
  const previousFetch = globalThis.fetch;
  const originalFirst = prisma.invoice.findFirst, originalUnique = prisma.invoice.findUnique, originalUpdate = prisma.invoice.updateMany;
  const originalActivity = prisma.activity.create;
  const initialDate = new Date('2026-10-05T12:00:00Z');
  let stored: any = { id: 'isolated-invoice', number: 'ISOLATED-001', contactId: 'isolated-contact', amount: new Prisma.Decimal(125),
    paypalInvoiceId: 'INV2-ISOLATED', paypalInvoiceUrl: null, paypalSentAt: null, paypalStatus: 'PAID', paypalPaidAt: initialDate,
    paypalLastWebhookAt: null, paymentStatus: 'paid', paymentProvider: 'PAYPAL', paymentAmount: new Prisma.Decimal(125),
    paymentCurrency: 'CAD', status: InvoiceStatus.PAID, updatedAt: initialDate };
  let releaseOlder: () => void = () => {}, sawOlder: () => void = () => {};
  const olderWait = new Promise<void>(resolve => { releaseOlder = resolve; });
  const olderStarted = new Promise<void>(resolve => { sawOlder = resolve; });
  let remoteLookups = 0, successfulUpdates = 0, activities = 0;
  Object.assign(process.env, env);
  try {
    prisma.invoice.findFirst = (async () => ({ ...stored })) as typeof originalFirst;
    prisma.invoice.findUnique = (async () => ({ ...stored })) as typeof originalUnique;
    prisma.invoice.updateMany = (async ({ where, data }: any) => {
      if (where.updatedAt.getTime() !== stored.updatedAt.getTime()) return { count: 0 };
      stored = { ...stored, ...data, updatedAt: new Date(initialDate.getTime() + 1000) };
      successfulUpdates += 1; return { count: 1 };
    }) as typeof originalUpdate;
    prisma.activity.create = (async () => { activities += 1; return {}; }) as typeof originalActivity;
    globalThis.fetch = (async (input: any) => {
      const url = String(input);
      if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'isolated-access-token' });
      assert.match(url, /\/v2\/invoicing\/invoices\/INV2-ISOLATED$/);
      const position = ++remoteLookups;
      if (position === 1) { sawOlder(); await olderWait; }
      return Response.json({ status: position === 1 ? 'PAID' : 'REFUNDED', amount: { value: '125.00', currency_code: 'CAD' } });
    }) as typeof globalThis.fetch;
    const older = syncPayPalInvoiceStatusByPayPalInvoiceId('INV2-ISOLATED');
    await olderStarted;
    const current = await syncPayPalInvoiceStatusByPayPalInvoiceId('INV2-ISOLATED');
    assert.equal(current.paymentStatus, 'refunded');
    releaseOlder();
    assert.equal((await older).paymentStatus, 'refunded');
    assert.equal(stored.status, InvoiceStatus.SENT);
    assert.equal(successfulUpdates, 1);
    assert.equal(activities, 1);
  } finally {
    releaseOlder(); globalThis.fetch = previousFetch;
    prisma.invoice.findFirst = originalFirst; prisma.invoice.findUnique = originalUnique; prisma.invoice.updateMany = originalUpdate; prisma.activity.create = originalActivity;
    for (const [name, value] of Object.entries(previousEnv)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
    await prisma.$disconnect();
  }
});

test('webhook avec mauvaise signature est refuse', async () => {
  const request = new NextRequest('https://nowis.store/api/paypal/webhook', {
    method: 'POST',
    body: JSON.stringify({ event_type: 'INVOICING.INVOICE.PAID' }),
    headers: { 'content-type': 'application/json' },
  });

  const response = await handlePayPalWebhookRequest(request, {
    verifySignature: async () => ({ isValid: false, event: {} }),
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, 'Signature PayPal invalide.');
});

test('PayPal webhook rejects unbounded, unsigned and malformed bodies before provider verification', async () => {
  const headers = { 'content-type': 'application/json', 'paypal-transmission-id': 'isolated-id',
    'paypal-transmission-time': '2026-10-05T12:00:00Z', 'paypal-cert-url': 'https://api.paypal.com/v1/notifications/certs/isolated',
    'paypal-auth-algo': 'SHA256withRSA', 'paypal-transmission-sig': 'isolated-signature' };
  let verifications = 0;
  const verifySignature = async () => { verifications += 1; return { isValid: true, event: { event_type: 'INVOICING.INVOICE.PAID' } }; };
  for (const [body, extraHeaders, status] of [
    ['x'.repeat(PAYPAL_MAX_WEBHOOK_BODY_BYTES + 1), headers, 413],
    ['{}', { ...headers, 'content-length': String(PAYPAL_MAX_WEBHOOK_BODY_BYTES + 1) }, 413],
    ['{}', { 'content-type': 'application/json' }, 400],
    ['not JSON', headers, 400],
    ['null', headers, 400],
    ['[]', headers, 400],
  ] as const) {
    const request = new NextRequest('https://nowis.store/api/paypal/webhook', { method: 'POST', headers: extraHeaders, body });
    assert.equal((await handlePayPalWebhookRequest(request, { verifySignature })).status, status);
  }
  assert.equal(verifications, 0);
  const request = () => new NextRequest('https://nowis.store/api/paypal/webhook', { method: 'POST', headers, body: '{}' });
  const invalid = await handlePayPalWebhookRequest(request(), { verifySignature: async () => ({ isValid: false, event: {} }) });
  assert.equal(invalid.status, 400);
  const failed = await handlePayPalWebhookRequest(request(), { verifySignature: async () => { throw new Error('private-provider-detail'); } });
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /private-provider-detail/);
});

test('buildPayPalAddressFromBilling produit une adresse ISO PayPal', () => {
  const address = buildPayPalAddressFromBilling({
    addressLine1: '123 Rue Principale',
    city: 'Montreal',
    state: 'Québec',
    postalCode: 'H2X 1Y4',
    country: 'Canada',
  });

  assert.deepEqual(address, {
    address_line_1: '123 Rue Principale',
    admin_area_1: 'QC',
    admin_area_2: 'Montreal',
    postal_code: 'H2X 1Y4',
    country_code: 'CA',
  });
});
