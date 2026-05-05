import assert from 'node:assert/strict';
import test from 'node:test';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import {
  buildPayPalInvoiceCreatePayload,
  derivePayPalInvoiceSyncUpdate,
  reuseExistingPayPalInvoiceIfPresent,
} from '@/lib/server/paypal';
import { handlePayPalWebhookRequest } from '@/lib/server/paypal-webhook';
import {
  buildPayPalAddressFromBilling,
  normalizePayPalCountryCode,
  normalizePayPalProvince,
} from '@/lib/server/paypal-address';

const issuer = {
  displayName: 'Nowis',
  companyName: 'Nowis Inc.',
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