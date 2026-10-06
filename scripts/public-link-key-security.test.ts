import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { signPublicInvoiceToken, verifyPublicInvoiceToken, verifyPublicQuoteToken } from '@/lib/public-links';
import { encryptCalendarToken, decryptCalendarToken } from '@/lib/calendar/token-crypto';
import { toErrorMetadata } from '@/lib/api-diagnostics';

test('public document signatures and calendar encryption reject weak/published production keys without exposing values', () => {
  const names = ['NODE_ENV', 'PUBLIC_LINKS_JWT_SECRET', 'CALENDAR_TOKEN_ENCRYPTION_KEY'];
  const before = names.map(name => [name, process.env[name]] as const);
  try {
    process.env.NODE_ENV = 'production';
    for (const key of ['short-secret', 'dev-calendar-token-encryption-key-change-me', 'dev-only-secret-must-change-before-prod']) {
      process.env.PUBLIC_LINKS_JWT_SECRET = key;
      process.env.CALENDAR_TOKEN_ENCRYPTION_KEY = key;
      assert.throws(() => signPublicInvoiceToken({ invoiceId: 'invoice-test', contactId: 'contact-test' }), error => error instanceof Error && !error.message.includes(key));
      assert.throws(() => encryptCalendarToken('private-token'), error => error instanceof Error && !error.message.includes(key));
    }
    const secret = 'isolated-test-strong-key-with-at-least-32-bytes';
    process.env.PUBLIC_LINKS_JWT_SECRET = secret;
    process.env.CALENDAR_TOKEN_ENCRYPTION_KEY = secret;
    const token = signPublicInvoiceToken({ invoiceId: 'invoice-test', contactId: 'contact-test' });
    assert.equal(verifyPublicInvoiceToken(token)?.invoiceId, 'invoice-test');
    assert.equal(verifyPublicQuoteToken(token), null);
    assert.equal(verifyPublicInvoiceToken(jwt.sign({ scope: 'public-invoice', invoiceId: 'invoice-test', contactId: 'contact-test' }, secret, { algorithm: 'HS384' })), null);
    const encrypted = encryptCalendarToken('private-token')!;
    assert.equal(decryptCalendarToken(encrypted), 'private-token');
    assert.equal(encrypted.includes('private-token'), false);
    assert.equal(JSON.stringify(toErrorMetadata(new Error('password=private-and-unsafe; user input'))).includes('private-and-unsafe'), false);
  } finally { for (const [name, value] of before) { if (value === undefined) delete process.env[name]; else process.env[name] = value; } }
});
