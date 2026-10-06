import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';
import { privateContentSecurityPolicy } from '@/lib/private-content-security-policy';
test('private pages use unpredictable per-request nonces, ignore forged headers, prohibit inline execution and external exfiltration', () => {
  const request = new NextRequest('https://nowis.store/connexion', { headers: { 'x-nonce': 'attacker-chosen', 'Content-Security-Policy': "default-src *" } });
  const one = proxy(request), two = proxy(request);
  const first = one.headers.get('Content-Security-Policy')!;
  assert.notEqual(first, two.headers.get('Content-Security-Policy'));
  assert.doesNotMatch(first, /attacker-chosen|default-src \*/);
  assert.doesNotMatch(first.split(';').find(item => item.includes('script-src'))!, /unsafe-inline/);
  assert.equal(one.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(one.headers.get('x-middleware-request-content-security-policy'), first);
  assert.doesNotMatch(first.split(';').find(item => item.includes('connect-src'))!, /https:(?:;|$| )/);
  assert.doesNotMatch(privateContentSecurityPolicy('a'.repeat(32), true), /unsafe-eval|ws:/);
  assert.throws(() => privateContentSecurityPolicy("'; default-src *;"));
});
