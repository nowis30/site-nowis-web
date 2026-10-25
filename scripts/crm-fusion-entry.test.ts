import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { NextRequest } from 'next/server';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { config, proxy } from '@/proxy';
import { crmNavigation } from '@/features/crm/config/navigation';
import { getPortalNotificationHref } from '@/lib/portal-notifications';

const require = createRequire(import.meta.url);
const destination = 'https://crm.nowis.store/connexion/gestionnaire#accueil';

for (const pathname of ['/crm', '/crm/dashboard', '/crm/historique']) {
  for (const method of ['GET', 'HEAD']) {
    test(`${method} ${pathname} opens the fixed fusion entry without carrying legacy request data`, async () => {
      assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: pathname }), true);
      const request = new NextRequest(`https://nowis.store${pathname}?token=synthetic-private-token&next=https%3A%2F%2Fexample.invalid&workspace=synthetic#private-fragment`, {
        method,
        headers: { Cookie: 'crm_session=synthetic-cookie', Authorization: 'Bearer synthetic-token', Referer: 'https://nowis.store/crm/invoices/synthetic', 'x-nonce': 'forged' },
      });
      const response = proxy(request);
      assert.equal(response.status, 307);
      assert.equal(response.headers.get('location'), destination);
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
      assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
      for (const header of ['set-cookie', 'cookie', 'authorization', 'x-middleware-override-headers', 'x-middleware-rewrite']) {
        assert.equal(response.headers.get(header), null);
      }
      assert.equal(await response.text(), '');
    });
  }
}

test('non-navigation methods are rejected locally without reading or redirecting their body', async () => {
  for (const pathname of ['/crm', '/crm/dashboard', '/crm/historique']) {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      const request = new NextRequest(`https://nowis.store${pathname}?token=synthetic`, {
        method, body: 'synthetic-body-never-forwarded', headers: { 'Content-Type': 'text/plain' },
      });
      const response = proxy(request);
      assert.equal(response.status, 405);
      assert.equal(response.headers.get('allow'), 'GET, HEAD');
      assert.equal(response.headers.get('location'), null);
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
      assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
      assert.equal(request.bodyUsed, false);
      assert.equal(await response.text(), '');
    }
  }
});

test('historical pages retain the existing private CSP and neighboring paths are not redirected', () => {
  for (const pathname of ['/crm/login', '/crm/contacts', '/crm/dashboard-extra', '/client/dashboard']) {
    const response = proxy(new NextRequest(`https://nowis.store${pathname}`, { headers: { 'x-nonce': 'forged' } }));
    assert.equal(response.headers.get('location'), null);
    assert.equal(response.headers.get('x-middleware-next'), '1');
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    const policy = response.headers.get('content-security-policy')!;
    assert.match(policy, /script-src[^;]*'nonce-/);
    assert.doesNotMatch(policy, /forged/);
    assert.equal(response.headers.get('x-middleware-request-content-security-policy'), policy);
  }
  for (const pathname of ['/', '/api/crm/contacts', '/api/client-auth/login']) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: pathname }), false);
  }
});

function component(file: string, dependencies: Record<string, unknown>) {
  const exported: Record<string, any> = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  vm.runInNewContext(code, {
    exports: exported, module: { exports: exported },
    require: (name: string) => {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      if (name === 'react/jsx-runtime') return require(name);
      throw new Error(`Unexpected component dependency: ${name}`);
    },
  });
  return exported;
}

test('the historical route reuses the dashboard and rejects unauthenticated access before any database read', async () => {
  const denied = new Error('synthetic unauthenticated session');
  let reads = 0;
  const dashboard = component('src/app/crm/(app)/dashboard/page.tsx', {
    'next/link': () => null,
    '@/features/crm/auth/session': { requireCrmSession: async () => { throw denied; } },
    '@/lib/prisma': { prisma: new Proxy({}, { get() { reads++; throw new Error('Database must not be accessed'); } }) },
    '@/features/crm/components/shared/DashboardUploader': {},
    '@/features/crm/components/shared/StatusBadge': {},
    'lucide-react': {},
  });
  const historical = component('src/app/crm/(app)/historique/page.tsx', { '../dashboard/page': dashboard });
  assert.equal(historical.default, dashboard.default, 'Historical dashboard must not diverge into a copied implementation');
  await assert.rejects(historical.default(), error => error === denied);
  assert.equal(reads, 0);

  const layout = component('src/app/crm/(app)/layout.tsx', {
    'next/navigation': { redirect: () => { throw new Error('Unexpected role redirect'); } },
    '@/features/crm/auth/session': { requireCrmSession: async () => { throw denied; } },
    '@/features/crm/components/layout/CrmShell': {},
  });
  await assert.rejects(layout.default({ children: 'private' }), error => error === denied);
});

test('the shared historical layout preserves portal-user exclusion and authorized staff rendering', async () => {
  let role = 'PORTAL_USER';
  const shell = () => null;
  const layout = component('src/app/crm/(app)/layout.tsx', {
    'next/navigation': { redirect: (path: string) => { throw new Error(`redirect:${path}`); } },
    '@/features/crm/auth/session': { requireCrmSession: async () => ({ role }) },
    '@/features/crm/components/layout/CrmShell': { CrmShell: shell },
  });
  await assert.rejects(layout.default({ children: 'private' }), /redirect:\/client\/dashboard/);
  role = 'ASSISTANT';
  const tree = await layout.default({ children: 'private' });
  assert.equal(tree.type, shell);
  assert.equal(tree.props.children, 'private');
  assert.equal(tree.props.session.role, 'ASSISTANT');
});

test('the historical navigation and notification fallback remain on the historical dashboard', () => {
  const dashboard = crmNavigation.find(item => item.module === 'dashboard');
  assert.equal(dashboard?.href, '/crm/historique');
  assert.match(dashboard!.label, /historique/i);
  assert.equal(getPortalNotificationHref({ linkedType: 'UNKNOWN', linkedId: 'synthetic', contactId: null }), '/crm/historique');
  assert.equal(getPortalNotificationHref({ linkedType: 'INVOICE', linkedId: 'synthetic', contactId: null }), '/crm/invoices/synthetic');
});
