import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/site-assistant/feedback/route';

type StoredCounter = {
  id: string;
  scope: string;
  identifier: string;
  windowStart: Date;
  windowSeconds: number;
  count: number;
  resetAt: Date;
};

const validFeedback = { idea: 'Une suggestion suffisamment longue.', email: 'visitor@example.test', pathname: '/ateliers', website: '' };
const ipHash = (ip: string) => createHash('sha256').update(ip).digest('hex');

function request(body: unknown = validFeedback, headers: Record<string, string> = {}, raw = false) {
  return new Request('https://nowis.store/api/site-assistant/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://nowis.store',
      'x-vercel-forwarded-for': '198.51.100.10', ...headers },
    body: raw ? String(body) : JSON.stringify(body),
  });
}

test('feedback endpoint applies request guards, durable quota and HTML escaping before email delivery', async (t) => {
  const originalTransaction = prisma.$transaction;
  const originalEmailPost = Resend.prototype.post;
  const originalEnv = Object.fromEntries(['NODE_ENV', 'VERCEL', 'RESEND_API_KEY', 'SITE_FEEDBACK_EMAIL']
    .map(key => [key, process.env[key]]));
  const records = new Map<string, StoredCounter>();
  const emails: Array<{ to: string; html: string; subject: string }> = [];
  let transactions = 0;
  let unavailable = false;
  let mailUnavailable = false;
  const key = (value: Pick<StoredCounter, 'scope' | 'identifier' | 'windowStart'>) =>
    JSON.stringify([value.scope, value.identifier, value.windowStart.toISOString()]);

  Object.assign(process.env, { NODE_ENV: 'production', VERCEL: '1', RESEND_API_KEY: 're_test_never_used_for_network', SITE_FEEDBACK_EMAIL: 'feedback@example.test' });
  // Exercise the real route and persistent limiter. Only storage and external delivery are replaced.
  (prisma as any).$transaction = async (run: any, options: any) => {
    transactions += 1;
    assert.equal(options?.isolationLevel, 'Serializable');
    if (unavailable) throw new Error('Test storage unavailable');
    return run({ apiRateLimit: {
      findUnique: async (args: any) => records.get(key(args.where.scope_identifier_windowStart)) || null,
      create: async ({ data }: any) => {
        const record = { ...data, id: String(records.size + 1) } as StoredCounter;
        records.set(key(record), record);
        return record;
      },
      update: async ({ where, data }: any) => {
        const record = [...records.values()].find(item => item.id === where.id);
        assert.ok(record);
        record.count += data.count.increment;
        return record;
      },
    } });
  };
  (Resend.prototype as any).post = async (path: string, payload: any) => {
    assert.equal(path, '/emails');
    emails.push(payload);
    return mailUnavailable
      ? { data: null, error: { message: 'Simulated delivery failure' } }
      : { data: { id: 'test-email' }, error: null };
  };

  try {
    await t.test('malformed input, forbidden origins and actual oversized body cause no DB or email work', async () => {
      const beforeTransactions = transactions;
      const beforeEmails = emails.length;
      const invalid: Array<[Request, number]> = [
        [request('{"idea":', {}, true), 400],
        [request({ ...validFeedback, idea: 'court' }), 400],
        [request({ ...validFeedback, idea: 'a'.repeat(2001) }), 400],
        [request({ ...validFeedback, email: 'not-an-email' }), 400],
        [request({ ...validFeedback, pathname: '/'.repeat(201) }), 400],
        [request({ ...validFeedback, website: 'bot-filled-field' }), 400],
        [request(validFeedback, { Origin: '' }), 403],
        [request(validFeedback, { Origin: 'https://evil.example.test' }), 403],
        [request(validFeedback, { Origin: 'https://nowis.store/path' }), 403],
        [request(validFeedback, { 'sec-fetch-site': 'cross-site' }), 403],
        [request(validFeedback, { 'Content-Type': 'text/plain' }), 415],
        [request({ ...validFeedback, idea: 'a'.repeat(17_000) }, { 'Content-Length': '1' }), 413],
        [request(validFeedback, { 'Content-Length': '20000' }), 413],
        [request({ ...validFeedback, idea: '字'.repeat(6000) }), 413],
      ];
      for (const [input, expected] of invalid) assert.equal((await POST(input)).status, expected);
      assert.equal(transactions, beforeTransactions);
      assert.equal(emails.length, beforeEmails);
    });

    await t.test('five persisted reservations succeed and forwarding spoofing cannot unlock the sixth', async () => {
      records.clear();
      emails.length = 0;
      for (let index = 0; index < 5; index += 1) {
        const response = await POST(request({ ...validFeedback, email: `visitor${index}@example.test` }, {
          'x-forwarded-for': `203.0.113.${index + 1}`, 'x-real-ip': `203.0.113.${index + 10}`,
        }));
        assert.equal(response.status, 200);
      }
      const blocked = await POST(request(validFeedback, {
        'x-forwarded-for': '192.0.2.99', 'x-real-ip': '192.0.2.98', 'cf-connecting-ip': '192.0.2.97',
      }));
      assert.equal(blocked.status, 429);
      assert.ok(Number(blocked.headers.get('retry-after')) > 0);
      assert.equal(blocked.headers.get('cache-control'), 'no-store');
      assert.equal(emails.length, 5);
      const counter = [...records.values()][0];
      assert.equal(records.size, 1);
      assert.equal(counter.scope, 'site-assistant:feedback');
      assert.equal(counter.identifier, ipHash('198.51.100.10'));
      assert.equal(counter.windowSeconds, 3600);
      assert.equal(counter.count, 5);
    });

    await t.test('only verified deployment IPs change the counter and invalid/untrusted headers share fallback', async () => {
      records.clear();
      emails.length = 0;
      assert.equal((await POST(request(validFeedback, { 'x-vercel-forwarded-for': '198.51.100.11' }))).status, 200);
      assert.equal((await POST(request(validFeedback, { 'x-vercel-forwarded-for': '198.51.100.12' }))).status, 200);
      assert.equal(records.size, 2);
      assert.deepEqual(new Set([...records.values()].map(record => record.identifier)),
        new Set([ipHash('198.51.100.11'), ipHash('198.51.100.12')]));
      records.clear();
      assert.equal((await POST(request(validFeedback, { 'x-vercel-forwarded-for': '', 'x-forwarded-for': '192.0.2.1' }))).status, 200);
      assert.equal((await POST(request(validFeedback, { 'x-vercel-forwarded-for': 'invalid', 'x-real-ip': '192.0.2.2' }))).status, 200);
      assert.equal(records.size, 1);
      assert.equal([...records.values()][0].identifier, ipHash('unknown'));
      assert.equal([...records.values()][0].count, 2);
      records.clear();
      delete process.env.VERCEL;
      assert.equal((await POST(request(validFeedback))).status, 200);
      assert.equal([...records.values()][0].identifier, ipHash('unknown'));
      process.env.VERCEL = '1';
    });

    await t.test('storage unavailable fails closed with 503 and never attempts email', async () => {
      unavailable = true;
      const before = emails.length;
      const response = await POST(request());
      assert.equal(response.status, 503);
      assert.equal(emails.length, before);
      unavailable = false;
    });

    await t.test('valid suggestions escape every visitor-controlled HTML field', async () => {
      records.clear();
      emails.length = 0;
      const response = await POST(request({
        ...validFeedback, idea: '<script>alert("x")</script> & \'idea\'',
        email: "o'brien@example.test",
        pathname: '/<img src=x onerror="boom">',
      }, { 'User-Agent': '<svg onload="boom"> & \'browser\'' }));
      assert.equal(response.status, 200);
      assert.equal(emails.length, 1);
      assert.equal(emails[0].to, 'feedback@example.test');
      const html = emails[0].html;
      assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#039;idea&#039;'));
      assert.ok(html.includes('o&#039;brien@example.test'));
      assert.ok(html.includes('/&lt;img src=x onerror=&quot;boom&quot;&gt;'));
      assert.ok(html.includes('&lt;svg onload=&quot;boom&quot;&gt; &amp; &#039;browser&#039;'));
      assert.equal(html.includes('<script>'), false);
      assert.equal(html.includes('<img src=x'), false);
      assert.equal(html.includes('<svg'), false);
    });

    await t.test('delivery failure returns 503 and retains the quota reservation', async () => {
      records.clear();
      emails.length = 0;
      mailUnavailable = true;
      assert.equal((await POST(request())).status, 503);
      assert.equal(emails.length, 1);
      assert.equal([...records.values()][0].count, 1);
      mailUnavailable = false;
    });
  } finally {
    (prisma as any).$transaction = originalTransaction;
    (Resend.prototype as any).post = originalEmailPost;
    for (const [name, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
