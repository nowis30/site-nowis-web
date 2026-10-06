const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const source = readFileSync(join(__dirname, 'prisma-safe-prebuild.js'), 'utf8');

test('build ignores recovery instructions and only generates the locked client', () => {
  const calls = [];
  const fakeRequire = (name) => {
    assert.equal(name, 'node:child_process');
    return { spawnSync: (command, args, options) => { calls.push({ command, args, options }); return { status: 0 }; } };
  };
  fakeRequire.resolve = () => '/isolated/node_modules/prisma/build/index.js';
  let status;
  vm.runInNewContext(source, { require: fakeRequire, console, process: {
    execPath: '/isolated/node', env: { NODE_ENV: 'production', VERCEL_ENV: 'preview',
      DATABASE_URL: 'postgresql://unreachable.invalid/private', PRISMA_RECOVERY_MIGRATIONS: 'sensitive-migration' },
    exit: (code) => { status = code; },
  } });
  assert.equal(status, 0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, '/isolated/node');
  assert.deepEqual(Array.from(calls[0].args), ['/isolated/node_modules/prisma/build/index.js', 'generate']);
  assert.equal(calls[0].options.shell, false);
});

test('client generation failure stops the build without a database repair retry', () => {
  let attempts = 0;
  let status;
  const fakeRequire = () => ({ spawnSync: () => { attempts += 1; return { status: 1 }; } });
  fakeRequire.resolve = () => '/isolated/node_modules/prisma/build/index.js';
  vm.runInNewContext(source, { require: fakeRequire, console, process: { execPath: '/isolated/node', env: {}, exit: (code) => { status = code; } } });
  assert.equal(status, 1);
  assert.equal(attempts, 1);
});
