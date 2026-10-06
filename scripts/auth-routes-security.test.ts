import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { POST as verifySms } from '@/app/api/crm/auth/verify-sms/route';
import { POST as login } from '@/app/api/crm/auth/login/route';
import { GET as getReviews } from '@/app/api/reviews/route';
import { signCrmOtpToken, verifyCrmToken } from '@/features/crm/auth/session';

process.env.JWT_SECRET = 'test-only-auth-routes-key-with-adequate-length';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
const identity = { sub: 'crm-user-a', role: 'ADMIN' as const, email: 'admin@example.test', fullName: 'Admin A' };

function otpRequest(challenge: string, code: string) {
  return new NextRequest('https://nowis.store/api/crm/auth/verify-sms', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `crm_otp=${challenge}` }, body: JSON.stringify({ code }) });
}

test('SMS endpoint requires the code, gives a session only after validation, persists account attempts across fresh challenges and fails closed', async () => {
  const originalTransaction = prisma.$transaction;
  const records = new Map<string, any>();
  let unavailable = false;
  // Model durable storage independently of request handler invocations; no real database is changed.
  (prisma as any).$transaction = async (run: any) => {
    if (unavailable) throw new Error('Test database unavailable');
    return run({ apiRateLimit: {
      findUnique: async (args: any) => records.get(JSON.stringify(args.where.scope_identifier_windowStart)) || null,
      create: async ({ data }: any) => {
        const item = { ...data, id: String(records.size + 1) };
        records.set(JSON.stringify({ scope: data.scope, identifier: data.identifier, windowStart: data.windowStart }), item);
        return item;
      },
      update: async ({ where }: any) => { const item = [...records.values()].find(value => value.id === where.id); item.count += 1; return item; },
    } });
  };
  try {
    const first = signCrmOtpToken({ ...identity, otpCode: '123456' });
    assert.equal((await verifySms(otpRequest(first, '000000'))).status, 401);
    const correct = await verifySms(otpRequest(first, '123456'));
    assert.equal(correct.status, 200);
    const session = correct.headers.get('set-cookie')?.match(/crm_session=([^;]+)/)?.[1];
    assert.ok(session);
    assert.equal(verifyCrmToken(session)?.sub, identity.sub);
    assert.equal((await verifySms(otpRequest(first, '654321'))).status, 401);
    assert.equal((await verifySms(otpRequest(first, '654321'))).status, 401);
    assert.equal((await verifySms(otpRequest(first, '654321'))).status, 401);
    const renewed = signCrmOtpToken({ ...identity, otpCode: '654321' });
    const blocked = await verifySms(otpRequest(renewed, '654321'));
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get('retry-after')) > 0);
    assert.equal(blocked.headers.get('set-cookie'), null);
    unavailable = true;
    const failed = await verifySms(otpRequest(renewed, '654321'));
    assert.equal(failed.status, 503);
    assert.equal(failed.headers.get('set-cookie'), null);
  } finally { (prisma as any).$transaction = originalTransaction; }
});

test('CRM login consults persistent account quota before password checking', async () => {
  const originalTransaction = prisma.$transaction;
  const originalFind = prisma.user.findUnique;
  let queriedAccount = false;
  (prisma as any).$transaction = async (run: any) => run({ apiRateLimit: {
    findUnique: async () => ({ id: 'existing', count: 10, resetAt: new Date(Date.now() + 60_000) }),
  } });
  (prisma.user as any).findUnique = async () => { queriedAccount = true; return null; };
  try {
    const request = new NextRequest('https://nowis.store/api/crm/auth/login', { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: identity.email, password: 'any' }) });
    const response = await login(request);
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(queriedAccount, false);
  } finally {
    (prisma as any).$transaction = originalTransaction;
    (prisma.user as any).findUnique = originalFind;
  }
});

test('public reviews retain review content without disclosing authors email addresses', async () => {
  const originalFind = prisma.review.findMany;
  (prisma.review as any).findMany = async ({ select }: any) => {
    assert.equal(select.email, undefined);
    const stored = { id: 'review-a', name: 'Alice', email: 'private@example.test', rating: 5,
      comment: 'Très bonne expérience', context: 'atelier', createdAt: new Date() };
    return [Object.fromEntries(Object.entries(stored).filter(([key]) => select[key]))];
  };
  try {
    const response = await getReviews(new NextRequest('https://nowis.store/api/reviews'));
    const reviews = await response.json();
    assert.equal(response.status, 200);
    assert.equal(reviews[0].name, 'Alice');
    assert.equal(reviews[0].email, undefined);
    assert.equal(reviews[0].rating, 5);
  } finally { (prisma.review as any).findMany = originalFind; }
});
