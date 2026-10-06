import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeNextPath, buildAuthRedirect } from '@/lib/safe-next';

test('login redirects reject browser-normalized and encoded external authority paths', () => {
  for (const value of ['https://evil.test', '//evil.test', '/\\evil.test', '/\t/evil.test', '/\n/evil.test', '/%2f%2fevil.test',
    '/%5cevil.test', '/%255cevil.test', '/%2509/evil.test', '/%00', '/bad%ZZ']) {
    assert.equal(sanitizeNextPath(value), '/client/dashboard', JSON.stringify(value));
  }
  for (const value of ['/client/dashboard', '/client/song-requests/nouveau?title=Mon%20projet', '/radio#mes-favoris', '/tarot']) {
    assert.equal(sanitizeNextPath(value), value);
    assert.equal(new URL(value, 'https://nowis.store').origin, 'https://nowis.store');
  }
  assert.equal(buildAuthRedirect('/tarot'), '/connexion?next=%2Ftarot');
});
