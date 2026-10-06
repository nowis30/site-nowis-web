const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');
const { createRequire } = require('node:module');
const braces = require('../vendor/braces');
const limits = require('../vendor/braces/lib/limits');

const safeFailure = action => assert.throws(action, error => error instanceof RangeError && error.code === 'BRACES_COMPLEXITY_LIMIT');

test('brace compile and expansion retain escaped, invalid, nested, set and range semantics', () => {
  for (const fixture of require('./braces-compatibility-fixtures.json')) {
    assert.deepEqual(braces(fixture.pattern), fixture.compiled, fixture.pattern);
    assert.deepEqual(braces.expand(fixture.pattern), fixture.expanded, fixture.pattern);
  }
  assert.deepEqual(braces.expand('{a,a,b,}', { nodupes: true, noempty: true }), ['a', 'b']);
});

test('official upstream compile, parse, regression, README, minimatch and multiple-pattern fixtures still pass', t => {
  let assertions = 0;
  const failures = [];
  const run = (name, action) => { try { action(); assertions++; } catch (error) { failures.push(`${name}: ${error.message}`); } };
  const context = {
    describe: (_name, action) => action(),
    it: run,
    require: name => {
      if (name === 'mocha') return {};
      if (name === 'assert') return require('node:assert');
      if (name === '..') return braces;
      if (name.startsWith('../lib/')) return require(`../vendor/braces/lib/${name.slice('../lib/'.length)}`);
      throw new Error(`Unexpected upstream dependency: ${name}`);
    },
  };
  for (const file of ['braces.compile.js', 'braces.parse.js', 'regression.js', 'readme.js', 'minimatch.js', 'multiples.js']) {
    // Keep expected arrays in the same realm as Node assert and isolate each
    // original MIT test file's lexical declarations in its own module wrapper.
    const source = fs.readFileSync(path.join(__dirname, '../vendor/braces/test/upstream', file), 'utf8');
    vm.runInThisContext(`(function(require, describe, it) { ${source}\n})`, { filename: file, timeout: 5000 })(context.require, context.describe, context.it);
  }
  assert.deepEqual(failures, []);
  assert.ok(assertions > 50, `upstream tests run: ${assertions}`);
  t.diagnostic(`${assertions} original upstream test cases passed`);
});

test('fixed depth guards cover every public API and direct parser even when options try to disable them', () => {
  const patterns = [
    '{'.repeat(4000) + 'a,b' + '}'.repeat(4000),
    '('.repeat(4000) + 'a' + ')'.repeat(4000),
    '{('.repeat(1000) + 'a,b' + ')}'.repeat(1000),
    '{'.repeat(4000),
  ];
  const started = performance.now();
  for (const pattern of patterns) for (const action of [braces, braces.create, braces.parse, braces.compile, braces.expand, braces.stringify]) {
    safeFailure(() => action(pattern, { maxDepth: Infinity, depthLimit: false, maxLength: Infinity, rangeLimit: false }));
  }
  safeFailure(() => require('../vendor/braces/lib/parse')(patterns[0]));
  assert.throws(() => braces.parse('a'.repeat(10001), { maxLength: NaN }), SyntaxError);
  assert.ok(performance.now() - started < 2000, 'deep rejection must be prompt');
  // Quoted/escaped delimiters are literals, not artificial AST nesting.
  assert.equal(braces.stringify('"' + '{'.repeat(1000) + '"'), '{'.repeat(1000));
});

test('prebuilt ASTs, cycles, deep parent chains, output products and nested arrays cannot bypass budgets', () => {
  let deep = { type: 'text', value: 'a' };
  for (let index = 0; index < 2000; index++) deep = { type: 'root', nodes: [deep] };
  const cycle = { type: 'root', nodes: [] }; cycle.nodes.push(cycle);
  const parentCycle = { type: 'root', nodes: [] }; parentCycle.parent = parentCycle;
  const broad = { type: 'root', nodes: Array.from({ length: limits.MAX_NODES + 1 }, () => ({ type: 'text', value: 'a' })) };
  for (const ast of [deep, cycle, parentCycle, broad, { type: 'text', value: 'a'.repeat(limits.MAX_OUTPUT_LENGTH + 1) }]) {
    for (const action of [braces.compile, braces.expand, braces.stringify]) safeFailure(() => action(ast, { maxDepth: Infinity }));
    for (const name of ['compile', 'expand', 'stringify']) safeFailure(() => require(`../vendor/braces/lib/${name}`)(ast));
  }
  for (const pattern of ['{a,b}'.repeat(15), '{1..10000000}', '{10000000..1}', '{a..z}'.repeat(4)]) {
    safeFailure(() => braces.expand(pattern, { rangeLimit: false, maxDepth: Infinity }));
  }
  safeFailure(() => braces.compile('{1..10000000..2}', { rangeLimit: false }));
  safeFailure(() => braces(Array(limits.MAX_RESULTS + 1).fill('a')));
  safeFailure(() => braces.expand('a'.repeat(200) + '{1..10000}', { rangeLimit: false }));
  const arrayCycle = []; arrayCycle.push(arrayCycle);
  safeFailure(() => require('../vendor/braces/lib/utils').flatten(arrayCycle));
  let deepArray = ['a']; for (let index = 0; index < 2000; index++) deepArray = [deepArray];
  safeFailure(() => require('../vendor/braces/lib/utils').flatten(deepArray));
});

test('the installed transitive callers resolve the patched fork and reject the original stack-overflow pattern', () => {
  for (const caller of ['micromatch', 'tailwindcss', 'eslint-config-next']) {
    const callerRequire = createRequire(require.resolve(caller));
    const manifest = callerRequire('braces/package.json');
    assert.equal(manifest.name, '@nowis/braces-safe', caller);
    const installed = callerRequire('braces');
    safeFailure(() => installed('{'.repeat(4000) + 'a,b' + '}'.repeat(4000)));
  }
});
