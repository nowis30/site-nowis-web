const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const { ESLint } = require('eslint');

test('local ESLint 10 adapters retain every original rule, schema and configuration severity', () => {
  const configRequire = createRequire(require.resolve('eslint-config-next'));
  for (const short of ['import', 'jsx-a11y', 'react']) {
    const name = `eslint-plugin-${short}`;
    const manifest = configRequire(`${name}/package.json`);
    assert.equal(manifest.name, `@nowis/${name}-compat`);
    assert.equal(manifest.peerDependencies.eslint, '^10.0.0');
    const plugin = configRequire(name);
    const upstream = require(path.join(path.dirname(configRequire.resolve(`${name}/package.json`)), manifest.nowisUpstream.main));
    assert.deepEqual(Object.keys(plugin.rules).sort(), Object.keys(upstream.rules).sort());
    for (const rule of Object.keys(upstream.rules)) {
      assert.equal(plugin.rules[rule].meta, upstream.rules[rule].meta, `${name}/${rule}`);
    }
    for (const [config, value] of Object.entries(upstream.configs || {})) {
      if (value.rules) assert.deepEqual(plugin.configs[config].rules, value.rules);
    }
  }
});

test('adapted React, accessibility and import rules report invalid code and accept its corrected version on actual ESLint 10', async () => {
  const plugins = { react: require('eslint-plugin-react'), 'jsx-a11y': require('eslint-plugin-jsx-a11y'), import: require('eslint-plugin-import') };
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: [{
    files: ['**/*.jsx'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins,
    settings: { react: { version: '19.3' } },
    rules: { 'react/jsx-key': 'error', 'react/no-unknown-property': 'error', 'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'error', 'import/no-unresolved': 'error', 'import/no-duplicates': 'error' },
  }] });
  const [invalid] = await eslint.lintText("import missing from './missing-compat-test-file.js';\nexport const view = <div class='bad'><img src='/test.png'/><a href='#'>Go</a>{[1,2].map(n => <span>{n}</span>)}</div>;", { filePath: 'compat-fixture.jsx' });
  for (const rule of ['react/jsx-key', 'react/no-unknown-property', 'jsx-a11y/alt-text', 'jsx-a11y/anchor-is-valid', 'import/no-unresolved']) {
    assert.ok(invalid.messages.some(message => message.ruleId === rule), rule);
  }
  assert.equal(invalid.fatalErrorCount, 0);
  const [valid] = await eslint.lintText("export const view = <div className='good'><img src='/test.png' alt='Test'/><a href='/contact'>Go</a>{[1,2].map(n => <span key={n}>{n}</span>)}</div>;", { filePath: 'compat-fixture.jsx' });
  assert.deepEqual(valid.messages, []);
});

test('flat configurations also expose adapted plugins without dropping recommended rules', async () => {
  const react = require('eslint-plugin-react');
  const a11y = require('eslint-plugin-jsx-a11y');
  const imports = require('eslint-plugin-import');
  assert.equal(react.configs.flat.recommended.plugins.react, react);
  assert.equal(a11y.flatConfigs.recommended.plugins['jsx-a11y'], a11y);
  assert.equal(imports.flatConfigs.recommended.plugins.import, imports);
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: [{
    files: ['**/*.jsx'], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { react: react.configs.flat.recommended.plugins.react }, rules: { 'react/no-unknown-property': 'error' },
  }] });
  const [result] = await eslint.lintText('const view = <div class="wrong"/>;', { filePath: 'compat-flat-fixture.jsx' });
  assert.equal(result.fatalErrorCount, 0);
  assert.ok(result.messages.some(message => message.ruleId === 'react/no-unknown-property'));
});
