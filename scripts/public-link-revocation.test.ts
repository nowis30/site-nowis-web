import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publicTokenFromInput, revokePublicDocumentLink, isPublicLinkRevoked } from '@/lib/public-link-revocation';
import { signPublicInvoiceToken, signPublicQuoteToken, signPublicBillingToken, signCompactPublicInvoiceToken, parseCompactPublicInvoiceToken } from '@/lib/public-links';
import { signCrmToken } from '@/features/crm/auth/session';
import { POST } from '@/app/api/crm/security/public-links/revoke/route';
import { GET as quoteGet } from '@/app/api/public/quotes/[token]/route';
import { GET as billingGet, PATCH as billingPatch } from '@/app/api/public/billing/[token]/route';
import { POST as quoteRespond } from '@/app/api/public/quotes/[token]/respond/route';
import { withAuthDatabase } from './auth-test-database';

test('JWT and compact document links can be individually revoked without persisting a capability; authorization fails closed', async () => {
  const envNames = ['PUBLIC_LINKS_JWT_SECRET', 'CRM_JWT_SECRET', 'NODE_ENV'] as const;
  const previous = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
  process.env.PUBLIC_LINKS_JWT_SECRET = 'isolated-public-document-revocation-test-32bytes';
  process.env.CRM_JWT_SECRET = 'isolated-admin-session-for-revocation-32bytes';
  process.env.NODE_ENV = 'test';
  const upsert = prisma.authGrant.upsert, invoiceFind = prisma.invoice.findUnique;
  try {
    await withAuthDatabase(async state => {
      prisma.authGrant.upsert = (async ({ where, create, update }: any) => {
        if (state.unavailable) throw new Error('private-database-details');
        const row = state.grants.get(where.tokenHash);
        if (row) Object.assign(row, update); else state.grants.set(where.tokenHash, create);
        return row || create;
      }) as typeof upsert;
      const invoice = { id: 'isolated-invoice', number: 'TEST-001', contactId: state.contact.id };
      prisma.invoice.findUnique = (async () => invoice) as typeof invoiceFind;
      const tokens = [signPublicInvoiceToken(invoice as any), signPublicQuoteToken({ quoteId: 'isolated-quote', contactId: state.contact.id }),
        signPublicBillingToken({ contactId: state.contact.id }), signCompactPublicInvoiceToken({ invoiceId: invoice.id, invoiceNumber: invoice.number, contactId: invoice.contactId })];
      // The JWT invoice ID must be present in the signing input.
      tokens[0] = signPublicInvoiceToken({ invoiceId: invoice.id, contactId: invoice.contactId });
      const session = await signCrmToken({ sub: state.admin.id, role: 'ADMIN', email: state.admin.email, fullName: state.admin.fullName });
      const req = (token: string, cookie = `crm_session=${session}`, origin = 'https://nowis.store', confirm = true) => new NextRequest('https://nowis.store/api/crm/security/public-links/revoke', {
        method: 'POST', headers: { origin, cookie, 'content-type': 'application/json' }, body: JSON.stringify({ link: token, confirm }),
      });
      assert.equal((await POST(req(tokens[0], ''))).status, 401);
      assert.equal((await POST(req(tokens[0], undefined, 'https://foreign.invalid'))).status, 403);
      assert.equal((await POST(req(tokens[0], undefined, undefined, false))).status, 400);
      for (const token of tokens) {
        assert.equal(await isPublicLinkRevoked(token), false);
        await revokePublicDocumentLink(token, state.admin.id);
        assert.equal(await isPublicLinkRevoked(token), true);
        assert.equal((await POST(req(token))).status, 200);
        assert.equal(JSON.stringify([...state.grants.values()]).includes(token), false);
      }
      const params = (token: string) => ({ params: Promise.resolve({ token }) });
      const request = new NextRequest('https://nowis.store/api/public/documents/isolated');
      assert.equal((await quoteGet(request, params(tokens[1]))).status, 401);
      assert.equal((await quoteRespond(req(tokens[1]), params(tokens[1]))).status, 401);
      assert.equal((await billingGet(request, params(tokens[2]))).status, 401);
      assert.equal((await billingPatch(req(tokens[2]), params(tokens[2]))).status, 401);
      const other = signPublicQuoteToken({ quoteId: 'another-quote' });
      assert.equal(await isPublicLinkRevoked(other), false);
      assert.equal(publicTokenFromInput(`https://nowis.store/facture/${tokens[3]}`), tokens[3]);
      for (const url of ['https://foreign.invalid/facture/link', 'https://nowis.store/facture/link?tracking=1', 'https://nowis.store/facture/link#fragment', 'https://nowis.store:8443/facture/link']) assert.throws(() => publicTokenFromInput(url));
      const pieces = tokens[3].split('.'); pieces[2] = '0' + pieces[2];
      assert.equal(parseCompactPublicInvoiceToken(pieces.join('.')), null);
      await assert.rejects(revokePublicDocumentLink(pieces.join('.'), state.admin.id), /PUBLIC_LINK_INVALID/);
      state.admin.role = 'ASSISTANT';
      const assistant = await signCrmToken({ sub: state.admin.id, role: 'ASSISTANT', email: state.admin.email, fullName: state.admin.fullName });
      assert.equal((await POST(req(other, `crm_session=${assistant}`))).status, 403);
      state.unavailable = true;
      await assert.rejects(isPublicLinkRevoked(other));
      assert.equal((await POST(req(other))).status, 503);
      // A forged token must not query storage, even during an outage.
      assert.equal((await quoteGet(request, params('invalid'))).status, 401);
      assert.equal((await billingGet(request, params('invalid'))).status, 401);
    });
  } finally {
    prisma.authGrant.upsert = upsert; prisma.invoice.findUnique = invoiceFind;
    for (const [name, value] of Object.entries(previous)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
    await prisma.$disconnect();
  }
});
