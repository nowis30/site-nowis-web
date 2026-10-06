const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function authStore(fetch) {
  const code = ts.transpileModule(fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8'), { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const exported = {}, module = { exports: exported };
  vm.runInNewContext(code + '\nmodule.exports.testCreateStore = createAuthStore;', { module, exports: exported, fetch, Error,
    require: name => {
      if (name === 'react') return { createContext: () => ({ Provider: 'provider' }) };
      if (name === 'react/jsx-runtime') return require(name);
      throw new Error('Unexpected dependency: ' + name);
    },
  });
  return module.exports.testCreateStore();
}
const reply = user => ({ ok: true, json: async () => ({ user }) });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const settle = () => new Promise(resolve => setImmediate(resolve));

test('authentication subscription initializes once, provides a stable server snapshot and publishes the fetched identity', async () => {
  const pending = deferred(), requests = [];
  const store = authStore(async url => { requests.push(url); return pending.promise; });
  assert.equal(store.getSnapshot(), store.getServerSnapshot());
  const updates = [];
  const first = store.subscribe(() => updates.push(store.getSnapshot()));
  const second = store.subscribe(() => {});
  assert.deepEqual(requests, ['/api/auth/me']);
  first(); second();
  const remove = store.subscribe(() => updates.push(store.getSnapshot()));
  pending.resolve(reply({ id: 'verified-owner' }));
  await settle();
  assert.equal(store.getSnapshot().user.id, 'verified-owner');
  assert.equal(store.getSnapshot().loading, false);
  assert.equal(store.getServerSnapshot().user, null);
  assert.equal(requests.length, 1);
  assert.ok(updates.length >= 2);
  remove();
});

test('a delayed initial refresh cannot overwrite a newer successful login', async () => {
  const older = deferred();
  let meCalls = 0;
  const store = authStore(async url => url === '/api/auth/me' ? (++meCalls === 1 ? older.promise : reply({ id: 'current-owner' })) : reply(null));
  const remove = store.subscribe(() => {});
  await store.login('owner@example.test', 'TestPassword1');
  assert.equal(store.getSnapshot().user.id, 'current-owner');
  older.resolve(reply({ id: 'outdated-owner' }));
  await settle();
  assert.equal(store.getSnapshot().user.id, 'current-owner');
  assert.equal(store.getSnapshot().loading, false);
  remove();
});

test('logout prevents a delayed refresh from restoring the old client identity', async () => {
  const older = deferred();
  const store = authStore(async url => url === '/api/auth/me' ? older.promise : reply(null));
  const remove = store.subscribe(() => {});
  await store.logout();
  older.resolve(reply({ id: 'logged-out-owner' }));
  await settle();
  assert.equal(store.getSnapshot().user, null);
  assert.equal(store.getSnapshot().loading, false);
  remove();
});

test('network failures release the login loading state and expose an error instead of leaving the UI blocked', async () => {
  const store = authStore(async () => { throw new Error('Mock network unavailable'); });
  await assert.rejects(store.login('owner@example.test', 'TestPassword1'), /Mock network unavailable/);
  assert.equal(store.getSnapshot().loading, false);
  assert.equal(store.getSnapshot().error, 'Mock network unavailable');
  assert.equal(store.getSnapshot().user, null);
});
