import assert from 'node:assert/strict';
import test from 'node:test';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/prisma';
import { signPublicInvoiceToken, signPublicQuoteToken } from '../src/lib/public-links';
import { GET as getInvoice } from '../src/app/api/public/invoices/[token]/route';
import { GET as getQuote } from '../src/app/api/public/quotes/[token]/route';
import { POST as respondQuote } from '../src/app/api/public/quotes/[token]/respond/route';
import { isClientVisibleStoredFile, toClientFileDto } from '../src/features/client-portal/documents/client-file-dto';
import { toClientWorkshopDto } from '../src/features/client-portal/workshops/client-workshop-dto';

test('public invoice and quote DTOs expose customer fields only and keep internal notes, staff IDs and archive metadata private', async () => {
  const oldGrant = prisma.authGrant.findUnique;
  prisma.authGrant.findUnique = (async () => null) as typeof oldGrant;
  const oldSecret = process.env.PUBLIC_LINKS_JWT_SECRET;
  const oldInvoice = prisma.invoice.findUnique, oldQuote = prisma.commercialQuote.findUnique;
  process.env.PUBLIC_LINKS_JWT_SECRET = 'isolated-public-documents-secret';
  const contactId = 'isolated-private-contact-id';
  const privateFields = { internalNotes: 'private-operator-note', deleteReason: 'private-delete-reason', testReason: 'private-test-reason', deletedBy: 'private-staff-id',
    organizationId: 'private-organization-id', songRequestId: 'private-song-request-id' };
  const invoice = { id: 'isolated-invoice', contactId, number: 'ISOLATED-001', status: 'SENT', description: 'Customer invoice',
    issueDate: new Date(), dueDate: new Date(), amount: new Prisma.Decimal(125), paymentAmount: null, paypalPaidAt: null,
    customerSnapshot: { fullName: 'Customer', email: 'customer@example.test', addressLine1: 'Customer address', notes: 'private-snapshot-note', taxId: 'private-tax-id', ...privateFields },
    issuerSnapshot: { privateAccess: 'private-issuer-snapshot' }, contact: { id: contactId, fullName: 'Customer', email: 'customer@example.test', phone: 'private-phone' }, ...privateFields };
  const quote = { id: 'isolated-quote', contactId, quoteNumber: 'ISOLATED-Q001', title: 'Customer quote', description: 'Description', status: 'SENT', currency: 'CAD', validUntil: null,
    subtotal: new Prisma.Decimal(100), taxAmount: new Prisma.Decimal(25), totalAmount: new Prisma.Decimal(125),
    contact: invoice.contact, convertedToInvoice: { id: 'private-related-invoice-id', number: 'INVOICE-001', status: 'SENT' },
    lines: [{ id: 'public-line-id', quoteId: 'private-line-parent-id', title: 'Item', description: 'Customer item', quantity: new Prisma.Decimal(1), unitPrice: new Prisma.Decimal(100), subtotal: new Prisma.Decimal(100), ...privateFields }], ...privateFields };
  try {
    prisma.invoice.findUnique = (async () => invoice) as typeof oldInvoice;
    prisma.commercialQuote.findUnique = (async () => quote) as typeof oldQuote;
    const request = new NextRequest('https://nowis.store/api/public/documents/isolated');
    const invoiceToken = signPublicInvoiceToken({ invoiceId: invoice.id, contactId });
    const invoiceResponse = await getInvoice(request, { params: Promise.resolve({ token: invoiceToken }) });
    const quoteToken = signPublicQuoteToken({ quoteId: quote.id, contactId });
    const quoteResponse = await getQuote(request, { params: Promise.resolve({ token: quoteToken }) });
    for (const response of [invoiceResponse, quoteResponse]) {
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
      assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
      const text = await response.text();
      assert.doesNotMatch(text, /private-|internalNotes|deletedBy|deleteReason|testReason|issuerSnapshot|organizationId|songRequestId|contactId|quoteId/);
      assert.match(text, /Customer/);
    }
    assert.equal((await getInvoice(request, { params: Promise.resolve({ token: 'invalid' }) })).status, 401);
    assert.equal((await getQuote(request, { params: Promise.resolve({ token: signPublicQuoteToken({ quoteId: quote.id, contactId: 'another-contact' }) }) })).status, 403);
    for (const status of ['EXPIRED', 'ARCHIVED', 'ACCEPTED', 'DECLINED']) {
      quote.status = status;
      const response = await respondQuote(new NextRequest('https://nowis.store/api/public/quotes/isolated/respond', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'accept' }) }),
        { params: Promise.resolve({ token: quoteToken }) });
      assert.equal(response.status, 409, status);
    }
  } finally {
    prisma.authGrant.findUnique = oldGrant;
    prisma.invoice.findUnique = oldInvoice; prisma.commercialQuote.findUnique = oldQuote;
    if (oldSecret === undefined) delete process.env.PUBLIC_LINKS_JWT_SECRET; else process.env.PUBLIC_LINKS_JWT_SECRET = oldSecret;
    await prisma.$disconnect();
  }
});

test('client document libraries exclude administrative files and workshop responses omit internal data', () => {
  const visible = { id: 'public-doc', size: 12, visibility: 'CLIENT_VISIBLE', category: 'song-deliverable', storageKey: 'client-files/client-a/2026/10/file.pdf',
    url: 'https://storage.example.test/private-file.pdf', uploadedByUserId: 'private-staff-id' };
  assert.equal(isClientVisibleStoredFile(visible, 'client-a'), true);
  assert.equal(isClientVisibleStoredFile({ ...visible, visibility: 'ADMIN_ONLY' }, 'client-a'), false);
  assert.equal(isClientVisibleStoredFile({ ...visible, category: 'admin-internal' }, 'client-a'), false);
  assert.equal(isClientVisibleStoredFile({ ...visible, storageKey: 'client-files/client-b/private.pdf' }, 'client-a'), false);
  assert.equal(isClientVisibleStoredFile({ ...visible, storageKey: 'client-files/client-a/staging/upload.pdf' }, 'client-a'), false);
  const dto = toClientFileDto(visible);
  assert.equal(dto.storageKey, undefined);
  assert.equal(dto.url, '/api/client-portal/file-documents/public-doc/download');
  assert.equal(dto.uploadedByUserId, 'admin');
  const workshop = toClientWorkshopDto({ id: 'public-workshop', title: 'Customer workshop', internalNotes: 'private-note', bookingRawPayload: { privateAnswer: 'private-booking' },
    clientAccessToken: 'private-token', deletedBy: 'private-staff', deleteReason: 'private-reason', basePrice: 'private-cost',
    organization: { id: 'private-organization-id', name: 'Customer organization' },
    appointments: [{ id: 'appointment-id', title: 'Customer appointment', privateAnswer: 'private-appointment-data' }] } as any);
  const serialized = JSON.stringify(workshop);
  assert.match(serialized, /Customer workshop|Customer organization|Customer appointment/);
  assert.doesNotMatch(serialized, /private-|internalNotes|bookingRawPayload|clientAccessToken|deletedBy|deleteReason|basePrice/);
});
