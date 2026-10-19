import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

// Execute the real handler with its external services injected; never access a live invoice.
function handler(options: { denied?: boolean; missing?: boolean } = {}) {
  const source = stripTypeScriptTypes(readFileSync('src/app/api/crm/invoices/[id]/preview-pdf/route.ts', 'utf8')
    .replace(/^import .*;\r?\n/gm, '')).replace('export async function GET', 'async function GET');
  const captured: { input?: Record<string, unknown>; issuer?: unknown; reads: number } = { reads: 0 };
  const customer = { fullName: 'Client enregistré', email: 'billing@example.com', companyName: 'Société', addressLine1: '383 Heriot' };
  const issuer = { displayName: 'Émetteur enregistré', email: 'issuer@example.com' };
  const invoice = { number: 'FAC-100', issueDate: new Date(), dueDate: new Date(), amount: 100, description: 'Service | 100.00 $',
    contact: { fullName: 'Coordonnées modifiées' }, issuerSnapshot: issuer, customerSnapshot: customer };
  const get = new Function('NextResponse', 'prisma', 'requireApiPermission', 'buildCustomerSnapshotFromContact', 'getBillingIssuerSnapshot', 'toCustomerSnapshot', 'toIssuerSnapshot', 'buildInvoicePdfBuffer', source + '; return GET;')(
    Response,
    { invoice: { findUnique: async () => { captured.reads++; return options.missing ? null : invoice; } } },
    async () => ({ error: options.denied ? Response.json({ error: 'Session invalide' }, { status: 401 }) : null }),
    () => { throw new Error('Stored customer must take precedence'); },
    () => { throw new Error('Stored issuer must take precedence'); },
    (value: unknown) => value, (value: unknown) => value,
    async (input: Record<string, unknown>, profile: unknown) => { captured.input = input; captured.issuer = profile; return Buffer.from('%PDF-test'); },
  );
  return { get, captured, customer, issuer };
}

test('le PDF du CRM utilise les mêmes profils enregistrés que le PDF envoyé', async () => {
  const { get, captured, customer, issuer } = handler();
  const response: Response = await get({ nextUrl: new URL('https://nowis.store/pdf') }, { params: Promise.resolve({ id: 'invoice' }) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/pdf');
  assert.equal(response.headers.get('content-disposition'), 'inline; filename="facture-FAC-100.pdf"');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(captured.input?.contact, customer);
  assert.deepEqual(captured.issuer, issuer);
  assert.equal(captured.input?.amount, '100');
  assert.equal(await response.text(), '%PDF-test');
});

test('le téléchargement renvoie une pièce jointe', async () => {
  const { get } = handler();
  const response: Response = await get({ nextUrl: new URL('https://nowis.store/pdf?download=1') }, { params: Promise.resolve({ id: 'invoice' }) });
  assert.equal(response.headers.get('content-disposition'), 'attachment; filename="facture-FAC-100.pdf"');
});

test('le PDF refuse une session absente et une facture introuvable', async () => {
  const denied = handler({ denied: true });
  assert.equal((await denied.get({}, { params: Promise.resolve({ id: 'invoice' }) })).status, 401);
  assert.equal(denied.captured.reads, 0);
  const missing = handler({ missing: true });
  assert.equal((await missing.get({}, { params: Promise.resolve({ id: 'invoice' }) })).status, 404);
});
