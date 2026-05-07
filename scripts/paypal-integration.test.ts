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
} from '@/lib/server/paypal';
import { handlePayPalWebhookRequest } from '@/lib/server/paypal-webhook';
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