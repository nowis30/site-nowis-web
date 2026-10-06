import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/crm/security/diagnostics/route';
import { signCrmToken } from '@/features/crm/auth/session';
import { withAuthDatabase } from './auth-test-database';

test('provider/database diagnostics reject anonymous, cross-origin and assistant access before querying provider metadata', async () => {
  const before = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'isolated-diagnostics-test-signing-secret-32chars';
  try {
    const request = (cookie = '', origin = 'https://nowis.store') => new NextRequest('https://nowis.store/api/crm/security/diagnostics', { method: 'POST', headers: { cookie, origin } });
    assert.equal((await POST(request())).status, 401);
    assert.equal((await POST(request('', 'https://foreign.invalid'))).status, 403);
    await withAuthDatabase(async state => {
      state.admin.role = 'ASSISTANT';
      const token = await signCrmToken({ sub: state.admin.id, role: 'ASSISTANT', email: state.admin.email, fullName: state.admin.fullName });
      assert.equal((await POST(request(`crm_session=${token}`))).status, 403);
      state.unavailable = true;
      const response = await POST(request(`crm_session=${token}`));
      assert.equal(response.status, 503);
      assert.doesNotMatch(await response.text(), /password|database details|SECRET/);
    });
  } finally { if (before === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = before; }
});
