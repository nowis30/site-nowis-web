import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/webhooks/calendly/route';
import { CALENDLY_MAX_BODY_BYTES, verifyCalendlySignature } from '@/lib/calendly-webhook-security';

const key = 'test-only-calendly-signing-key';
const time = 1791244800;
const body = JSON.stringify({ event: 'invitee.created', payload: { name: 'Alice' } });
const signature = (raw = body, timestamp = time) => `t=${timestamp},v1=${createHmac('sha256', key).update(`${timestamp}.${raw}`).digest('hex')}`;

test('timestamped Calendly HMAC accepts only authentic fresh unchanged payloads', () => {
  assert.equal(verifyCalendlySignature(body, signature(), key, time), true);
  assert.equal(verifyCalendlySignature(`${body} `, signature(), key, time), false);
  assert.equal(verifyCalendlySignature(body, signature(), 'wrong-key', time), false);
  assert.equal(verifyCalendlySignature(body, signature(), key, time + 301), false);
  assert.equal(verifyCalendlySignature(body, signature(), key, time - 301), false);
  assert.equal(verifyCalendlySignature(body, `v1=${createHmac('sha256', key).update(body).digest('hex')}`, key, time), false);
  assert.equal(verifyCalendlySignature(body, `${signature()},t=${time}`, key, time), false);
  assert.equal(verifyCalendlySignature(body, null, key, time), false);
});

test('public webhook refuses missing keys, missing/bad signatures and oversized body before any DB operation', async () => {
  const oldKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  const originalActivity = prisma.activity.create;
  let writes = 0;
  (prisma.activity as any).create = async () => { writes += 1; throw new Error('An unauthenticated webhook must never write'); };
  const request = (raw: string, header?: string) => new NextRequest('https://nowis.store/api/webhooks/calendly', {
    method: 'POST', headers: header ? { 'calendly-webhook-signature': header } : {}, body: raw,
  });
  try {
    delete process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
    assert.equal((await POST(request(body))).status, 503);
    process.env.CALENDLY_WEBHOOK_SIGNING_KEY = key;
    assert.equal((await POST(request(body))).status, 401);
    assert.equal((await POST(request(body, 't=0,v1=invalid'))).status, 401);
    assert.equal((await POST(request('a'.repeat(CALENDLY_MAX_BODY_BYTES + 1)))).status, 413);
    assert.equal(writes, 0);
  } finally {
    if (oldKey === undefined) delete process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
    else process.env.CALENDLY_WEBHOOK_SIGNING_KEY = oldKey;
    (prisma.activity as any).create = originalActivity;
  }
});
