const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loginUi(replies) {
  const states = ['admin@example.test', 'TestStaffPassword1'], navigation = [], requests = [];
  let cursor = 0;
  const code = ts.transpileModule(fs.readFileSync('src/app/crm/login/page.tsx', 'utf8'), { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const exported = {}, module = { exports: exported };
  vm.runInNewContext(code, { module, exports: exported,
    fetch: async (url, options) => {
      requests.push({ url, body: JSON.parse(options.body) });
      const reply = replies.shift();
      assert.ok(reply, 'Unexpected request');
      return { ok: reply.status < 400, json: async () => reply.body };
    },
    require: name => {
      if (name === 'react') return { useState: initial => {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [states[index], value => { states[index] = value; }];
      } };
      if (name === 'react/jsx-runtime') return require(name);
      if (name === 'next/navigation') return { useRouter: () => ({ push: path => navigation.push(path), refresh() {} }) };
      if (name.endsWith('/api-client')) return { readApiJson: response => response.json(), getApiErrorMessage: body => body.message || body.error };
      throw new Error('Unexpected UI dependency: ' + name);
    },
  });
  const render = () => { cursor = 0; return module.exports.default(); };
  const find = (node, predicate) => {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } return null; }
    return predicate(node) ? node : find(node.props?.children, predicate);
  };
  const text = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join(' ') : node?.props ? text(node.props.children) : '';
  return { states, navigation, requests, render, find, text };
}

for (const channel of ['sms', 'email']) {
  test('CRM displays ' + channel + ' verification and opens the dashboard only after validating the code', async () => {
    const ui = loginUi([{ status: 200, body: { requiresOtp: true, otpChannel: channel } }, { status: 200, body: { ok: true } }]);
    await ui.find(ui.render(), node => node.type === 'form').props.onSubmit({ preventDefault() {} });
    assert.deepEqual(ui.navigation, []);
    assert.equal(ui.states[1], '', 'Password is cleared after password verification');
    const tree = ui.render();
    assert.match(ui.text(tree), channel === 'sms' ? /par SMS.*Code SMS/ : /courriel de votre compte.*Code courriel/);
    assert.match(ui.text(tree), /10 minutes/);
    const input = ui.find(tree, node => node.type === 'input' && node.props.autoComplete === 'one-time-code');
    input.props.onChange({ target: { value: '123456' } });
    await ui.find(ui.render(), node => node.type === 'form').props.onSubmit({ preventDefault() {} });
    assert.deepEqual(ui.navigation, ['/crm/dashboard']);
    assert.equal(ui.requests[1].url, '/api/crm/auth/verify-sms');
    assert.deepEqual(ui.requests[1].body, { code: '123456' });
  });
}

test('CRM delivery failure leaves the login form visible without navigation or a verification step', async () => {
  const ui = loginUi([{ status: 503, body: { message: 'L’envoi du code de vérification est momentanément indisponible.' } }]);
  await ui.find(ui.render(), node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(ui.navigation, []);
  assert.match(ui.text(ui.render()), /momentanément indisponible/);
  assert.equal(ui.find(ui.render(), node => node.type === 'input' && node.props.autoComplete === 'one-time-code'), null);
});
