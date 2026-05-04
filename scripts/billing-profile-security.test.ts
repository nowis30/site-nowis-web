import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCustomerSnapshotFromContact,
  toCustomerSnapshot,
  toIssuerSnapshot,
  validateCustomerSnapshot,
  validateIssuerSnapshot,
} from '@/lib/billing-profile';

test('validateIssuerSnapshot identifies required fields', () => {
  const missing = validateIssuerSnapshot({
    displayName: 'Nowis',
    companyName: 'Nowis Inc.',
    profileId: null,
    taxesEnabled: true,
    taxRateGst: 0.05,
    taxRateQst: 0.09975,
    currency: 'CAD',
    email: undefined,
    addressLine1: undefined,
    city: undefined,
    postalCode: undefined,
    country: undefined,
  });

  assert.deepEqual(missing, ['email', 'addressLine1', 'city', 'postalCode', 'country']);
});

test('buildCustomerSnapshotFromContact uses billing fields over generic fields', () => {
  const customer = buildCustomerSnapshotFromContact({
    fullName: 'Client Test',
    email: 'legacy@example.com',
    billingEmail: 'billing@example.com',
    billingAddressLine1: '123 Rue Exemple',
    billingCity: 'Montreal',
    billingPostalCode: 'H1H1H1',
    billingCountry: 'Canada',
  });

  assert.equal(customer.email, 'billing@example.com');
  assert.equal(customer.addressLine1, '123 Rue Exemple');
  assert.equal(customer.city, 'Montreal');
});

test('toIssuerSnapshot and toCustomerSnapshot reject invalid payloads', () => {
  assert.equal(toIssuerSnapshot(null), null);
  assert.equal(toCustomerSnapshot({}), null);
});

test('validateCustomerSnapshot reports missing fields', () => {
  const missing = validateCustomerSnapshot({
    fullName: 'Client',
    companyName: null,
    legalName: null,
    email: null,
    phone: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
    taxId: null,
    notes: null,
  });

  assert.deepEqual(missing, ['email', 'addressLine1', 'city', 'postalCode', 'country']);
});
