import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { signClientPortalToken, verifyClientPortalToken } from '@/lib/client-portal';
import { contactId, withAuthDatabase } from './auth-test-database';

const secret = 'legacy-portal-isolated-test-private-signing-fixture';
const payload = { contactId, email: 'portal@example.test', fullName: 'Portal Test' };
test('legacy portal URL access requires persisted grants, valid current accounts and a private server key', async () => {
  const before = { NODE_ENV: process.env.NODE_ENV, CLIENT_PORTAL_JWT_SECRET: process.env.CLIENT_PORTAL_JWT_SECRET, JWT_SECRET: process.env.JWT_SECRET };
  try {
    process.env.NODE_ENV = 'production'; delete process.env.CLIENT_PORTAL_JWT_SECRET; delete process.env.JWT_SECRET;
    await assert.rejects(signClientPortalToken(payload), /signature invalide/);
    process.env.CLIENT_PORTAL_JWT_SECRET = secret;
    await withAuthDatabase(async state => {
      const valid = await signClientPortalToken(payload);
      assert.equal((await verifyClientPortalToken(valid))?.contactId, contactId);
      for (const token of [
        jwt.sign({ ...payload, scope: 'song-request-portal' }, 'dev-only-portal-secret-must-change', { expiresIn: '1h' }),
        jwt.sign({ ...payload, scope: 'song-request-portal' }, secret, { expiresIn: '1h' }),
        jwt.sign({ ...payload, scope: 'client-login' }, secret, { expiresIn: '1h' }),
        jwt.sign({ ...payload, scope: 'song-request-portal' }, secret, { expiresIn: '1h', algorithm: 'HS512' }),
        jwt.sign({ ...payload, scope: 'song-request-portal' }, secret),
      ]) assert.equal(await verifyClientPortalToken(token), null);
      state.portal.isActive = false; assert.equal(await verifyClientPortalToken(valid), null);
    });
  } finally { for (const [name, value] of Object.entries(before)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; } }
});
