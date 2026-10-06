import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { signClientPortalToken, verifyClientPortalToken } from '../src/lib/client-portal';

const secret = 'legacy-portal-isolated-test-secret';
const payload = { contactId: 'contact-123', email: 'client@example.test', fullName: 'Test Client' };

test('legacy client portal requires its server secret in production and validates signed token claims', () => {
  const oldNodeEnv = process.env.NODE_ENV;
  const oldPortalSecret = process.env.CLIENT_PORTAL_JWT_SECRET;
  const oldJwtSecret = process.env.JWT_SECRET;
  try {
    Object.assign(process.env, { NODE_ENV: 'production' });
    delete process.env.CLIENT_PORTAL_JWT_SECRET;
    delete process.env.JWT_SECRET;
    assert.throws(() => signClientPortalToken(payload), /manquant en production/);
    const knownFallback = jwt.sign({ ...payload, scope: 'song-request-portal' }, 'dev-only-portal-secret-must-change', { expiresIn: '1h' });
    assert.equal(verifyClientPortalToken(knownFallback), null);

    process.env.CLIENT_PORTAL_JWT_SECRET = secret;
    const valid = signClientPortalToken(payload);
    assert.equal(verifyClientPortalToken(valid)?.contactId, payload.contactId);
    assert.equal(verifyClientPortalToken(knownFallback), null);
    assert.equal(verifyClientPortalToken(jwt.sign({ ...payload, scope: 'client-login' }, secret, { expiresIn: '1h' })), null);
    assert.equal(verifyClientPortalToken(jwt.sign({ ...payload, scope: 'song-request-portal' }, secret, { expiresIn: '1h', algorithm: 'HS512' })), null);
    assert.equal(verifyClientPortalToken(jwt.sign({ ...payload, scope: 'song-request-portal' }, secret)), null);
    assert.equal(verifyClientPortalToken(jwt.sign({ ...payload, contactId: '', scope: 'song-request-portal' }, secret, { expiresIn: '1h' })), null);
    assert.equal(verifyClientPortalToken(jwt.sign({ ...payload, scope: 'song-request-portal' }, secret, { expiresIn: '-1h' })), null);
  } finally {
    for (const [name, value] of Object.entries({ NODE_ENV: oldNodeEnv, CLIENT_PORTAL_JWT_SECRET: oldPortalSecret, JWT_SECRET: oldJwtSecret })) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
