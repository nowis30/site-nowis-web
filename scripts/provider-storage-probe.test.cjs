const test = require('node:test');
const assert = require('node:assert/strict');
const { runStorageProbe } = require('./provider-storage-probe.cjs');
const UUID = '11111111-1111-4111-8111-111111111111';
const env = { VERCEL: '1', VERCEL_ENV: 'production', S3_BUCKET: 'NEVER_OUTPUT_BUCKET', S3_REGION: 'us-east-1',
  S3_ACCESS_KEY_ID: 'NEVER_OUTPUT_ACCESS', S3_SECRET_ACCESS_KEY: 'NEVER_OUTPUT_SECRET', S3_PUBLIC_BASE_URL: 'https://public.example/base' };
const error = (name, status) => Object.assign(new Error('NEVER_OUTPUT_PROVIDER_ERROR'), { name, $metadata: { httpStatusCode: status } });
function fixture({ expose = false, conditions = true, failures = {}, deleteFails = false, versioned = false, fetchImpl } = {}) {
  const objects = new Map(), calls = [], anonymousCalls = []; let closed = false;
  const client = {
    async run(operation, input, signal) {
      calls.push({ operation, input });
      if (failures[operation]) return failures[operation](input, signal, objects);
      if (operation === 'PutObject') {
        objects.set(input.Key, { data: Buffer.from(input.Body), ETag: '"fixture-etag"', ContentType: input.ContentType });
        return versioned ? { VersionId: 'NEVER_OUTPUT_SOURCE_VERSION' } : {};
      }
      if (operation === 'HeadObject') {
        const value = objects.get(input.Key); if (!value) throw error('NotFound', 404);
        return { ContentLength: value.data.length, ContentType: value.ContentType, ETag: value.ETag };
      }
      if (operation === 'CopyObject') {
        const source = decodeURIComponent(input.CopySource.slice(env.S3_BUCKET.length + 1));
        const value = objects.get(source); if (!value) throw error('NoSuchKey', 404);
        if (conditions && input.CopySourceIfMatch !== value.ETag) throw error('PreconditionFailed', 412);
        objects.set(input.Key, value);
        return versioned ? { VersionId: 'NEVER_OUTPUT_COPY_VERSION' } : {};
      }
      if (operation === 'GetObject') {
        const value = objects.get(input.Key); if (!value) throw error('NoSuchKey', 404);
        return { ContentLength: value.data.length, Body: (async function* () { yield value.data; })() };
      }
      if (operation === 'DeleteObject') {
        if (deleteFails) throw error('AccessDenied', 403);
        objects.delete(input.Key); return {};
      }
      throw new Error('Unexpected provider operation');
    },
    unsignedUrl(key) { return 'https://direct.example/' + key; },
    close() { closed = true; },
  };
  const fakeFetch = async (url, options) => {
    anonymousCalls.push({ url, options });
    if (fetchImpl) return fetchImpl(url, options, objects);
    if (!expose) return new Response('NEVER_OUTPUT_ERROR_BODY', { status: 403 });
    const path = decodeURI(new URL(url).pathname).replace(/^\/base\//, '').replace(/^\//, '');
    return new Response(objects.get(path).data, { status: 200 });
  };
  return { objects, calls, anonymousCalls, client, fakeFetch, closed: () => closed };
}
async function run(options = {}) {
  const state = fixture(options);
  const report = await runStorageProbe({ argv: ['--probe-authorized-test'], env, uuid: () => UUID,
    createClient: () => state.client, fetchImpl: state.fakeFetch, timeoutMs: 30 });
  return { state, report };
}

test('explicit CLI/native guard and fixed UUID ownership reject accidental local or malformed probes before any provider operation', async () => {
  let calls = 0;
  const createClient = () => { calls++; throw new Error(); };
  for (const argv of [[], ['--other'], ['--probe-authorized-test', '--other']]) {
    assert.equal((await runStorageProbe({ argv, env, createClient })).status, 'not_authorized');
  }
  assert.equal((await runStorageProbe({ argv: ['--probe-authorized-test'], env: {}, createClient })).status, 'not_native_production_build');
  assert.equal((await runStorageProbe({ argv: ['--probe-authorized-test'], env, uuid: () => '../third-party', createClient })).status, 'internal_error');
  assert.equal(calls, 0);
});

test('successful probe verifies upload/head/ETag conditional copy/read and deletes only exact reserved keys; anonymous requests contain no credentials', async () => {
  const { state, report } = await run();
  assert.equal(report.status, 'passed_with_limits');
  assert.equal(report.blocked, false);
  assert.equal(state.objects.size, 0);
  assert.equal(state.closed(), true);
  for (const check of Object.values(report.checks)) {
    for (const name of ['upload', 'metadata', 'conditionalCopy', 'copy', 'authenticatedRead']) assert.equal(check[name], 'ok');
    assert.equal(check.cleanup.complete, true);
  }
  assert.ok(state.calls.every(({ input }) => /^(client-files|crm-files)\/__nowis_security_check__\/11111111-1111-4111-8111-111111111111\/(source|final|rejected-copy)\.txt$/.test(input.Key)));
  assert.ok(state.calls.every(({ operation }) => ['PutObject', 'HeadObject', 'CopyObject', 'GetObject', 'DeleteObject'].includes(operation)));
  assert.equal(state.calls.filter(c => c.operation === 'PutObject').length, 2);
  assert.equal(state.calls.filter(c => c.operation === 'CopyObject').length, 4);
  assert.equal(state.calls.filter(c => c.operation === 'DeleteObject').length, 4);
  assert.equal(state.anonymousCalls.length, 8);
  for (const { url, options } of state.anonymousCalls) {
    assert.equal(new URL(url).search, '');
    assert.equal(options.method, 'GET');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'manual');
    assert.equal(options.headers, undefined);
  }
  const output = JSON.stringify(report);
  assert.ok(!output.includes('NEVER_OUTPUT'));
  assert.ok(!output.includes(UUID));
  assert.ok(!output.includes('https://'));
});

test('a provider ignoring the wrong ETag is blocked and its unexpected own copy is cleaned', async () => {
  const { state, report } = await run({ conditions: false });
  assert.equal(report.blocked, true);
  assert.equal(report.checks.client.conditionalCopy, 'condition_not_enforced');
  assert.equal(state.objects.size, 0);
  assert.equal(state.calls.filter(c => c.operation === 'GetObject').length, 0);
});

test('anonymous accessibility of the same harmless fixture proves the private-prefix risk and never prints content/URLs', async () => {
  const { state, report } = await run({ expose: true });
  assert.equal(report.blocked, true);
  for (const check of Object.values(report.checks)) assert.equal(check.exposed, true);
  assert.equal(state.objects.size, 0);
  assert.ok(!JSON.stringify(report).includes('No private data'));
});

test('provider failures preserve the primary failure and attempt bounded cleanup, with no other objects or policies touched', async () => {
  const { state, report } = await run({ failures: { CopyObject: async () => { throw error('AccessDenied', 403); } }, deleteFails: true });
  assert.equal(report.blocked, true);
  assert.equal(report.checks.client.conditionalCopy, 'forbidden');
  assert.equal(report.checks.client.cleanup.complete, false);
  assert.ok(state.calls.filter(c => c.operation === 'DeleteObject').every(c => c.input.Key.includes('/__nowis_security_check__/' + UUID + '/')));
  assert.ok(!JSON.stringify(report).includes('NEVER_OUTPUT_PROVIDER_ERROR'));
});

test('known created object versions are cleaned with their exact returned version ids instead of adding delete markers', async () => {
  const { state, report } = await run({ versioned: true });
  assert.equal(report.blocked, false);
  const deletes = state.calls.filter(c => c.operation === 'DeleteObject');
  assert.equal(deletes.length, 4);
  assert.ok(deletes.every(c => ['NEVER_OUTPUT_SOURCE_VERSION', 'NEVER_OUTPUT_COPY_VERSION'].includes(c.input.VersionId)));
  assert.ok(!JSON.stringify(report).includes('VERSION'));
});

test('anonymous body limits, redirects and timeouts do not falsely establish privacy and still clean owned files', async () => {
  for (const fetchImpl of [
    async () => new Response('a'.repeat(4097)),
    async () => new Response(null, { status: 302, headers: { Location: 'https://NEVER_OUTPUT_REDIRECT.example' } }),
    async () => new Promise(() => {}),
  ]) {
    const { state, report } = await run({ fetchImpl });
    assert.equal(report.status, 'review_required');
    assert.equal(report.blocked, false);
    assert.equal(state.objects.size, 0);
    assert.ok(!JSON.stringify(report).includes('NEVER_OUTPUT'));
  }
});

test('a timed out owned upload still triggers deletion and cannot hang the probe or leak an error', async () => {
  let aborts = 0;
  const { state, report } = await run({ failures: { PutObject: async (_input, signal) => {
    signal.addEventListener('abort', () => { aborts++; }); return new Promise(() => {});
  } } });
  assert.equal(aborts, 2);
  assert.equal(report.blocked, true);
  assert.equal(report.checks.client.upload, 'timeout');
  assert.equal(state.calls.filter(c => c.operation === 'DeleteObject').length, 2);
});

