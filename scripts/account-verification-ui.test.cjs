const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise actual React handlers with deterministic hooks and fake API replies.
// No DOM, email provider, database or browser network is required.
function loadComponent(file, name, data, initial = [], search = '?verification=sent') {
  const states = [...initial], navigation = [], requests = [];
  let cursor = 0, mounted = false;
  const verification = function ExistingContactVerification() {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const exported = {}, module = { exports: exported };
  const fakeReact = {
    Suspense: 'suspense',
    useState: initialValue => { const index = cursor++; if (!(index in states)) states[index] = typeof initialValue === 'function' ? initialValue() : initialValue;
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; },
    useEffect: callback => { if (!mounted) callback(); },
  };
  vm.runInNewContext(code, { module, exports: exported, URLSearchParams, TextEncoder, window: { location: { search: '?verification=sent' } },
    FormData: class { constructor(values) { this.values = values; } get(name) { return this.values[name]; } },
    fetch: async (url, options) => { requests.push({ url, body: JSON.parse(options.body) }); return { ok: data.status < 400, status: data.status, json: async () => data.body }; },
    require: name => {
      if (name === 'react') return fakeReact;
      if (name === 'react/jsx-runtime') return require(name);
      if (name === 'next/navigation') return { useSearchParams: () => new URLSearchParams(search), useRouter: () => ({ push: path => navigation.push(path), replace: path => navigation.push(path), refresh: () => {} }) };
      if (name === 'next/link') return { __esModule: true, default: 'a' };
      if (name.endsWith('/validators')) return require('zod') && { clientRegisterSchema: { safeParse: form => ({ success: true, data: form }) } };
      if (name.endsWith('/principal-crm')) return { principalCrmUrl: 'https://crm.nowis.store/app/aujourdhui#accueil' };
      if (name.endsWith('/safe-next')) return { sanitizeNextPath: (path, fallback) => path || fallback };
      if (name.endsWith('/api-client')) return { readApiJson: response => response.json(), getApiErrorMessage: body => body.error };
      if (name.endsWith('/ExistingContactVerification')) return { ExistingContactVerification: verification };
      if (name.endsWith('/Button')) return { Button: 'button' };
      if (name.endsWith('/GoogleClientAuthCard')) return { GoogleClientAuthCard: 'aside' };
      if (name === 'lucide-react') return new Proxy({}, { get: () => 'svg' });
      throw new Error('Unexpected UI dependency: ' + name);
    },
  });
  const render = () => { cursor = 0; let tree = module.exports[name]();
    if (tree.type === 'suspense' && typeof tree.props.children?.type === 'function') tree = tree.props.children.type(tree.props.children.props);
    mounted = true; return tree; };
  const find = (node, predicate) => {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } return null; }
    if (predicate(node)) return node;
    return find(node.props?.children, predicate);
  };
  const text = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join(' ') : node?.props ? text(node.props.children) : '';
  return { states, navigation, requests, verification, render, find, text };
}

for (const [file, name] of [
  ['src/components/radio/RadioAccount.tsx', 'RadioAccount'],
  ['src/components/community/AiCommunityAccount.tsx', 'AiCommunityAccount'],
]) {
  test(name + ' offers existing login and has no signup action', () => {
    const ui = loadComponent(file, name, { status: 200, body: {} });
    const tree = ui.render();
    assert.match(ui.text(tree), /inscriptions sont fermées/);
    assert.equal(ui.find(tree, node => node.type === 'input' && node.props.autoComplete === 'new-password'), null);
    assert.doesNotMatch(ui.text(tree), /Créer mon compte/);
  });
  test(name + ' respects successful login redirect and exposes the email-proof action on pending login', async () => {
    const success = loadComponent(file, name, { status: 200, body: { redirectTo: '/client/dashboard' } }, [false]);
    await success.find(success.render(), node => node.type === 'form').props.onSubmit({ preventDefault() {}, currentTarget: { email: 'owner@example.test', password: 'OwnerPassword1' } });
    assert.deepEqual(success.navigation, ['/client/dashboard']);
    const pending = loadComponent(file, name, { status: 401, body: { code: 'EMAIL_VERIFICATION_REQUIRED', error: 'Vérifiez votre courriel pour activer votre compte.' } }, [false]);
    await pending.find(pending.render(), node => node.type === 'form').props.onSubmit({ preventDefault() {}, currentTarget: { email: 'owner@example.test', password: 'OwnerPassword1' } });
    assert.deepEqual(pending.navigation, []);
    assert.match(pending.text(pending.find(pending.render(), node => node.props?.role === 'alert')), /Vérifiez votre courriel/);
    assert.ok(pending.find(pending.render(), node => node.type === 'a' && node.props.href.startsWith('/connexion?next=')));
  });
}

test('connexion shows the sent-email confirmation and offers proof after an unverified login response', async () => {
  const ui = loadComponent('src/app/connexion/page.tsx', 'default', { status: 401, body: { code: 'EMAIL_VERIFICATION_REQUIRED', error: 'Vérifiez votre courriel.' } }, ['owner@example.test', 'OwnerPassword1']);
  ui.render();
  assert.match(ui.text(ui.find(ui.render(), node => node.props?.role === 'status')), /Consultez votre courriel/);
  await ui.find(ui.render(), node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(ui.navigation, []);
  assert.equal(ui.states[4], 'owner@example.test');
  assert.ok(ui.find(ui.render(), node => node.type === ui.verification && node.props.email === 'owner@example.test'));
});

test('the retired signup page offers the principal CRM and historical login without a form', () => {
  const ui = loadComponent('src/app/inscription/page.tsx', 'default', { status: 410, body: {} });
  const tree = ui.render();
  assert.equal(ui.find(tree, node => node.type === 'form'), null);
  assert.match(ui.text(tree), /inscriptions sont fermées/);
  assert.ok(ui.find(tree, node => node.type === 'a' && node.props.href === 'https://crm.nowis.store/app/aujourdhui#accueil'));
  assert.ok(ui.find(tree, node => node.type === 'a' && node.props.href === '/connexion'));
});

for (const [file, endpoint] of [
  ['src/app/crm/reset-password/page.tsx', '/api/crm/auth/reset-password'],
  ['src/app/reinitialiser-mot-de-passe/page.tsx', '/api/client-auth/reset-password'],
]) {
  test(file + ' submits the current query token without an effect or an extra form state', async () => {
    const ui = loadComponent(file, 'default', { status: 200, body: { ok: true } }, ['NewOwnerPassword1', 'NewOwnerPassword1'], '?token=%20safe-test-token%20');
    await ui.find(ui.render(), node => node.type === 'form').props.onSubmit({ preventDefault() {} });
    assert.equal(ui.requests.length, 1);
    assert.equal(ui.requests[0].url, endpoint);
    assert.deepEqual(ui.requests[0].body, { token: 'safe-test-token', password: 'NewOwnerPassword1' });
    assert.equal(ui.states[0], '');
    assert.equal(ui.states[1], '');
    assert.match(ui.text(ui.render()), /mis à jour/);
  });
}

test('retired signup ignores supplied next destinations and does not send registration requests', () => {
  const ui = loadComponent('src/app/inscription/page.tsx', 'default', { status: 410, body: {} }, [], '?next=https://example.invalid');
  const tree = ui.render();
  assert.equal(ui.find(tree, node => node.type === 'form'), null);
  assert.deepEqual(ui.requests, []);
  assert.ok(ui.find(tree, node => node.type === 'a' && node.props.href === 'https://crm.nowis.store/app/aujourdhui#accueil'));
});
