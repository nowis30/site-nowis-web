import test from 'node:test';
import assert from 'node:assert/strict';
import { immobilierServiceUrl } from '../src/lib/immobilier-service.ts';

test('CRM navigation is disabled until the independent service is configured', () => {
  assert.equal(immobilierServiceUrl(undefined), null);
  assert.equal(immobilierServiceUrl(''), null);
  assert.equal(immobilierServiceUrl('https://crm.nowis.store/'), 'https://crm.nowis.store');
});
test('CRM navigation cannot redirect to a customer instance or an unrelated destination', () => {
  for (const url of ['https://espace.gestionvallee.ca', 'https://gestionvallee.ca', 'http://crm.nowis.store', 'https://crm.nowis.store.example.com', 'https://name:secret@crm.nowis.store', 'https://crm.nowis.store/?next=elsewhere', 'https://crm.nowis.store/other']) assert.equal(immobilierServiceUrl(url), null);
});
