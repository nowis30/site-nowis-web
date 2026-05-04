import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSafeContactLog,
  isAllowedOrigin,
  parseContactPayload,
  sanitizeEmailSubject,
  validateContactRequestGuards,
} from '@/lib/contact-request-security';
import { createContactRateLimiter } from '@/lib/contact-rate-limit';

function createHeaders(values: Record<string, string>) {
  return new Headers(values);
}

test('message vide refuse', () => {
  const result = parseContactPayload({
    name: 'Simon Morin',
    message: '   ',
    serviceType: 'autre',
  });

  assert.equal(result.success, false);
});

test('message trop court refuse', () => {
  const result = parseContactPayload({
    name: 'Simon Morin',
    message: 'court',
    serviceType: 'chanson',
  });

  assert.equal(result.success, false);
});

test('message trop long refuse', () => {
  const result = parseContactPayload({
    name: 'Simon Morin',
    message: 'a'.repeat(3001),
    serviceType: 'video',
  });

  assert.equal(result.success, false);
});

test('serviceType inconnu refuse', () => {
  const result = parseContactPayload({
    name: 'Simon Morin',
    message: 'Message valide pour depasser le minimum.',
    serviceType: 'inconnu',
  });

  assert.equal(result.success, false);
});

test('origin externe refuse', () => {
  const headers = createHeaders({
    'content-type': 'application/json',
    origin: 'https://evil.example.com',
  });

  const result = validateContactRequestGuards(headers, {
    NODE_ENV: 'production',
    NEXT_PUBLIC_SITE_URL: 'https://nowis.store',
  } as NodeJS.ProcessEnv);

  assert.deepEqual(result, {
    ok: false,
    status: 403,
    error: 'Origine non autorisee pour cette operation.',
    code: 'INVALID_ORIGIN',
  });
});

test('content-type invalide refuse', () => {
  const headers = createHeaders({
    'content-type': 'text/plain',
    origin: 'https://nowis.store',
  });

  const result = validateContactRequestGuards(headers, {
    NODE_ENV: 'production',
    NEXT_PUBLIC_SITE_URL: 'https://nowis.store',
  } as NodeJS.ProcessEnv);

  assert.deepEqual(result, {
    ok: false,
    status: 400,
    error: 'Le Content-Type doit etre application/json.',
    code: 'INVALID_CONTENT_TYPE',
  });
});

test('rate limit actif', async () => {
  const limiter = createContactRateLimiter(async (args) => {
    if (args.scope === 'contact:user') {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 120,
      };
    }
    return {
      allowed: true,
      remaining: 999,
      retryAfterSeconds: 60,
    };
  });

  const result = await limiter({
    userId: 'contact-user-id',
    headers: createHeaders({ 'x-forwarded-for': '1.1.1.1' }),
  });

  assert.equal(result.allowed, false);
  if (!result.allowed) {
    assert.equal(result.retryAfterSeconds, 120);
  }
});

test('subject nettoye contre CRLF', () => {
  const subject = sanitizeEmailSubject('Nouveau message\r\nBcc: victim@example.com');
  assert.equal(subject.includes('\r'), false);
  assert.equal(subject.includes('\n'), false);
  assert.equal(subject.includes('Bcc:'), true);
});

test('aucun log ne contient le message complet', () => {
  const logPayload = buildSafeContactLog({
    userId: 'user-id',
    contactId: 'contact-id',
    inquiryId: 'inquiry-id',
    messageLength: 250,
    emailStatus: 'sent',
  });

  const serialized = JSON.stringify(logPayload);
  assert.equal(serialized.includes('Message prive et sensible'), false);
  assert.equal(serialized.includes('messageLength'), true);
});

test('origin localhost autorise en developpement', () => {
  const allowed = isAllowedOrigin('http://localhost:3000', {
    NODE_ENV: 'development',
    NEXT_PUBLIC_SITE_URL: 'https://nowis.store',
  } as NodeJS.ProcessEnv);

  assert.equal(allowed, true);
});
