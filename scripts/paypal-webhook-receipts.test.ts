import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { createPayPalWebhookReceipts } from '@/lib/server/paypal-webhook-receipts';
import { handlePayPalWebhookRequest } from '@/lib/server/paypal-webhook';

test('PayPal event receipt persists across handler instances, serializes 50 duplicates, and retries failed leases safely', async () => {
  const database = new PGlite();
  try {
    await database.exec(readFileSync('prisma/migrations/20260504153000_add_contact_api_rate_limits/migration.sql', 'utf8'));
    const db = { async $queryRaw<T>(sql: Prisma.Sql): Promise<T> { return (await database.query(sql.text, sql.values)).rows as T; } };
    const receipts = createPayPalWebhookReceipts(db);
    const claims = await Promise.all(Array.from({ length: 50 }, () => createPayPalWebhookReceipts(db).claim('EVT-isolated-001')));
    assert.equal(claims.filter(item => item.state === 'claimed').length, 1);
    const winner = claims.find(item => item.state === 'claimed'); assert.ok(winner?.state === 'claimed');
    await receipts.complete(winner.owner);
    assert.equal((await createPayPalWebhookReceipts(db).claim('EVT-isolated-001')).state, 'completed');
    const failed = await receipts.claim('EVT-failure'); assert.ok(failed.state === 'claimed');
    await receipts.release(failed.owner);
    const retry = await receipts.claim('EVT-failure'); assert.ok(retry.state === 'claimed');
    assert.notEqual(failed.owner, retry.owner);
    await assert.rejects(receipts.complete(failed.owner), /LEASE_LOST/);
    await receipts.complete(retry.owner);
    const stalled = await receipts.claim('EVT-stalled'); assert.ok(stalled.state === 'claimed');
    await database.query('UPDATE api_rate_limits SET "resetAt" = CURRENT_TIMESTAMP - interval \'1 second\' WHERE id = $1', [stalled.owner]);
    const takeover = await receipts.claim('EVT-stalled'); assert.ok(takeover.state === 'claimed');
    await assert.rejects(receipts.complete(stalled.owner), /LEASE_LOST/);
    await receipts.complete(takeover.owner);
    let calls = 0, throws = false;
    const request = () => new NextRequest('https://nowis.store/api/paypal/webhook', { method: 'POST', headers: {
      'paypal-transmission-id': 'isolated-transmission', 'paypal-transmission-time': '2026-10-06T00:00:00Z', 'paypal-cert-url': 'https://api.paypal.com/isolated',
      'paypal-auth-algo': 'SHA256withRSA', 'paypal-transmission-sig': 'isolated-signature',
    }, body: '{}' });
    const deps = { receipts, verifySignature: async () => ({ isValid: true, event: { id: 'EVT-route', event_type: 'INVOICING.INVOICE.PAID' } }),
      extractInvoiceId: () => 'INV-isolated', syncStatus: async () => { calls++; if (throws) throw new Error('private-details'); return {} as any; } };
    assert.equal((await handlePayPalWebhookRequest(request(), deps)).status, 200);
    assert.equal((await (await handlePayPalWebhookRequest(request(), deps)).json()).duplicate, true);
    assert.equal(calls, 1);
    deps.verifySignature = async () => ({ isValid: true, event: { id: 'EVT-retry-route', event_type: 'INVOICING.INVOICE.PAID' } });
    throws = true; const response = await handlePayPalWebhookRequest(request(), deps);
    assert.equal(response.status, 503); assert.doesNotMatch(await response.text(), /private-details/);
    throws = false; assert.equal((await handlePayPalWebhookRequest(request(), deps)).status, 200);
    const saved = await database.query('SELECT identifier FROM api_rate_limits');
    assert.doesNotMatch(JSON.stringify(saved.rows), /EVT-|INV-/);
    assert.match(readFileSync('src/lib/contact-rate-limit.ts', 'utf8'), /scope: \{ not: 'paypal:webhook-receipt' \}/);
  } finally { await database.close(); }
});
