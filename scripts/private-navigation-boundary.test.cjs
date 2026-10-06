const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function boundary(initialPath) {
  let pathname = initialPath, state, initialized = false, effects = [], click;
  const navigations = [], replacements = [], children = 'sensitive-private-content';
  class Element { constructor(anchor) { this.anchor = anchor; } closest() { return this.anchor; } }
  class Anchor extends Element { constructor(href, target = '') { super(); this.href = href; this.target = target; } hasAttribute() { return false; } }
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/components/PrivateNavigationBoundary.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, Element, HTMLAnchorElement: Anchor, URL,
    window: { location: { href: 'https://nowis.store' + initialPath, origin: 'https://nowis.store', assign: url => navigations.push(url), replace: url => replacements.push(url) } },
    document: { addEventListener: (_, handler) => { click = handler; }, removeEventListener() {} },
    require: name => {
      if (name === 'react') return { useState: initializer => { if (!initialized) { state = initializer(); initialized = true; } return [state]; }, useEffect: action => effects.push(action) };
      if (name === 'react/jsx-runtime') return require(name);
      if (name === 'next/navigation') return { usePathname: () => pathname };
      if (name.endsWith('/private-page-path')) return { isPrivatePagePath: path => /^\/(crm|client|connexion|facture)(\/|$)/.test(path) };
      throw new Error('Unexpected dependency');
    },
  });
  function render(nextPath = pathname) { pathname = nextPath; effects = []; const tree = exports.PrivateNavigationBoundary({ children }); for (const effect of effects) effect(); return tree; }
  render();
  function navigate(path, extra = {}) {
    let prevented = false;
    click({ button: 0, target: new Element(new Anchor('https://nowis.store' + path)), preventDefault() { prevented = true; }, stopPropagation() {}, ...extra });
    return prevented;
  }
  return { render, navigate, navigations, replacements, children };
}
test('public music navigation stays continuous, private transitions use a fresh document and modified clicks retain browser behavior', () => {
  const ui = boundary('/radio');
  assert.equal(ui.navigate('/album'), false);
  assert.equal(ui.navigate('/connexion', { ctrlKey: true }), false);
  assert.equal(ui.navigate('/connexion'), true);
  assert.deepEqual(ui.navigations, ['https://nowis.store/connexion']);
  assert.notEqual(ui.render('/crm/dashboard'), ui.children, 'Programmatic transitions do not render private contents under the old public CSP');
  assert.equal(ui.replacements.length, 1);
});
test('private CRM navigation reuses its strict document; returning to public games reloads the document', () => {
  const ui = boundary('/crm/dashboard');
  assert.equal(ui.navigate('/crm/settings'), false);
  assert.equal(ui.render('/crm/settings'), ui.children);
  assert.equal(ui.navigate('/jeux'), true);
});
