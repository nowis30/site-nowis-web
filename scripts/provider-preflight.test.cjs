const test = require('node:test');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { runPreflight, policyAssessment, signingCheck } = require('./provider-preflight.cjs');

const bucket = 'NEVER_OUTPUT_BUCKET';
const fixture = () => ({
  JWT_SECRET: 'isolated-private-jwt-fixture-longer-than-32-bytes',
  CLIENT_PORTAL_JWT_SECRET: 'isolated-private-portal-fixture-longer-than-32-bytes',
  CALENDAR_TOKEN_ENCRYPTION_KEY: 'isolated-private-calendar-fixture-longer-than-32-bytes',
  RESEND_API_KEY: 'NEVER_OUTPUT_RESEND_CREDENTIAL',
  S3_BUCKET: bucket, S3_REGION: 'us-east-1', S3_ACCESS_KEY_ID: 'NEVER_OUTPUT_ACCESS_KEY',
  S3_SECRET_ACCESS_KEY: 'NEVER_OUTPUT_SECRET_KEY', S3_PUBLIC_BASE_URL: 'https://NEVER_OUTPUT_HOST.example',
});
const jsonResponse = value => new Response(JSON.stringify(value), { status: 200 });
const verified = () => jsonResponse({ has_more: false, data: [
  { name: 'NEVER_OUTPUT_OTHER_DOMAIN', id: 'NEVER_OUTPUT_DOMAIN_ID', status: 'verified' },
  { name: 'nowis.store', id: 'NEVER_OUTPUT_NOWIS_ID', status: 'verified', capabilities: { sending: 'enabled' } },
] });
const policy = (resource, extra = {}) => JSON.stringify({ Version: '2012-10-17', Statement: [{
  Effect: 'Allow', Principal: '*', Action: 's3:GetObject', Resource: 'arn:aws:s3:::' + bucket + '/' + resource, ...extra,
}] });
const basicResponses = () => ({
  HeadBucket: { secretMetadata: 'NEVER_OUTPUT_SDK_METADATA' },
  GetPublicAccessBlock: { PublicAccessBlockConfiguration: { BlockPublicAcls: true, IgnorePublicAcls: true, BlockPublicPolicy: false, RestrictPublicBuckets: false } },
  GetBucketPolicyStatus: { PolicyStatus: { IsPublic: true } },
  GetBucketAcl: { Owner: { ID: 'NEVER_OUTPUT_OWNER' }, Grants: [] },
  GetBucketPolicy: { Policy: policy('audio/*') },
});
const sdkError = (name, status) => Object.assign(new Error('NEVER_OUTPUT_RAW_ERROR'), { name, $metadata: { httpStatusCode: status } });
async function mocked({ env = fixture(), fetchImpl = verified, responses = basicResponses(), timeoutMs = 100 } = {}) {
  const calls = []; let closed = false;
  const report = await runPreflight({ env, fetchImpl: async (url, options) => {
    calls.push({ url, method: options.method, redirect: options.redirect }); return fetchImpl(url, options);
  }, timeoutMs, createS3Client: () => ({
    async read(operation, signal) {
      calls.push(operation); const result = responses[operation];
      if (typeof result === 'function') return result(signal);
      if (result instanceof Error) throw result;
      return result;
    },
    close() { closed = true; },
  }) });
  return { report, calls, closed };
}

test('successful readonly preflight emits only statuses, booleans and the intended domain; exactly five S3 reads and one GET', async () => {
  const { report, calls, closed } = await mocked();
  assert.equal(report.status, 'passed_with_limits');
  assert.equal(report.blocked, false);
  assert.equal(report.resend.verified, true);
  assert.equal(report.s3.policy.mediaOnly, true);
  assert.equal(report.s3.privateReadPolicyRisk, false);
  assert.equal(closed, true);
  assert.deepEqual(calls.filter(c => typeof c === 'string').sort(),
    ['GetBucketAcl', 'GetBucketPolicy', 'GetBucketPolicyStatus', 'GetPublicAccessBlock', 'HeadBucket']);
  assert.deepEqual(calls.filter(c => typeof c === 'object'), [{ url: 'https://api.resend.com/domains?limit=100', method: 'GET', redirect: 'error' }]);
  assert.ok(!JSON.stringify(report).includes('NEVER_OUTPUT'));
  const leaves = value => typeof value === 'object' && value !== null ? Object.values(value).flatMap(leaves) : [value];
  assert.ok(leaves(report).every(value => typeof value === 'boolean' || typeof value === 'string'));
});

test('missing/short/published signing keys block; production fallback selection exactly follows the app and exposes no value or length', async () => {
  assert.equal(signingCheck({ JWT_SECRET: 'too_short' }, ['JWT_SECRET']).status, 'too_short');
  assert.equal(signingCheck({ JWT_SECRET: 'dev-only-secret-must-change-before-prod' }, ['JWT_SECRET']).status, 'development_key');
  assert.equal(signingCheck({ JWT_SECRET: '😀'.repeat(8) }, ['JWT_SECRET']).valid, true);
  const env = fixture(); delete env.CLIENT_PORTAL_JWT_SECRET;
  const { report } = await mocked({ env });
  assert.equal(report.signing.portal.fallbackUsed, true);
  assert.equal(report.signing.portal.configured, false);
  assert.equal(report.signing.portal.valid, true);
  const missing = fixture(); delete missing.CALENDAR_TOKEN_ENCRYPTION_KEY;
  assert.equal((await mocked({ env: missing })).report.blocked, true);
  assert.ok(!JSON.stringify(report).includes(env.JWT_SECRET));
});

test('Resend unverified/disabled/missing domains and invalid credentials block without mail or exposing response/errors', async () => {
  for (const domain of [
    { name: 'nowis.store', status: 'pending', capabilities: { sending: 'enabled' } },
    { name: 'nowis.store', status: 'verified', capabilities: { sending: 'disabled' } },
  ]) assert.equal((await mocked({ fetchImpl: () => jsonResponse({ has_more: false, data: [domain] }) })).report.blocked, true);
  const none = (await mocked({ fetchImpl: () => jsonResponse({ has_more: false, data: [] }) })).report;
  assert.equal(none.resend.status, 'not_found');
  assert.equal(none.blocked, true);
  const invalid = (await mocked({ fetchImpl: () => new Response('NEVER_OUTPUT_PROVIDER_BODY', { status: 401 }) })).report;
  assert.equal(invalid.resend.status, 'invalid_credentials');
  assert.ok(!JSON.stringify(invalid).includes('NEVER_OUTPUT'));
  const forbidden = (await mocked({ fetchImpl: () => new Response('NEVER_OUTPUT_PROVIDER_BODY', { status: 403 }) })).report;
  assert.equal(forbidden.resend.status, 'forbidden');
  assert.equal(forbidden.blocked, false);
  assert.equal(forbidden.status, 'review_required');
  const paged = (await mocked({ fetchImpl: () => jsonResponse({ has_more: true, data: [] }) })).report;
  assert.equal(paged.resend.status, 'not_established');
  assert.equal(paged.blocked, false);
});

test('metadata read denied does not become a false private-bucket claim or forced build failure', async () => {
  const responses = basicResponses(); responses.GetBucketPolicy = sdkError('AccessDenied', 403);
  const { report } = await mocked({ responses });
  assert.equal(report.s3.policy.status, 'forbidden');
  assert.equal(report.s3.status, 'not_established');
  assert.equal(report.status, 'review_required');
  assert.equal(report.blocked, false);
  assert.ok(!JSON.stringify(report).includes('NEVER_OUTPUT'));
  responses.HeadBucket = sdkError('AccessDenied', 403);
  assert.equal((await mocked({ responses })).report.blocked, false);
  responses.HeadBucket = sdkError('NoSuchBucket', 404);
  assert.equal((await mocked({ responses })).report.blocked, true);
});

test('public private-prefix policy grants are detected while media-only grants remain permitted; conditional/deny rules require manual review', async () => {
  for (const resource of ['*', 'client-files/*', 'crm-files/actor/*', 'legacy-uploads/*', 'c*']) {
    const responses = basicResponses(); responses.GetBucketPolicy = { Policy: policy(resource) };
    const report = (await mocked({ responses })).report;
    assert.equal(report.s3.privateReadPolicyRisk, true, resource);
    assert.equal(report.blocked, true);
  }
  const privateGrant = basicResponses(); privateGrant.GetBucketPolicy = { Policy: policy('client-files/*') };
  privateGrant.GetPublicAccessBlock.PublicAccessBlockConfiguration.RestrictPublicBuckets = true;
  assert.equal((await mocked({ responses: privateGrant })).report.blocked, false);
  for (const resource of ['audio/*', 'games/*']) {
    const assessment = policyAssessment(policy(resource), bucket);
    assert.equal(assessment.mediaOnly, true);
    assert.equal(assessment.privateReadGrant, false);
  }
  const condition = policyAssessment(policy('*', { Condition: { IpAddress: { 'aws:SourceIp': '192.0.2.0/24' } } }), bucket);
  assert.equal(condition.requiresReview, true);
  const deny = JSON.stringify({ Statement: [
    { Effect: 'Allow', Principal: '*', Action: 's3:GetObject', Resource: '*' },
    { Effect: 'Deny', Principal: '*', Action: 's3:GetObject', Resource: 'arn:aws:s3:::' + bucket + '/client-files/*' },
  ] });
  assert.equal(policyAssessment(deny, bucket).requiresReview, true);
  assert.equal(policyAssessment(policy('unclassified-prefix/*'), bucket).requiresReview, true);
});

test('bucket ACL public writes block unless IgnorePublicAcls applies; public listing never claims object read permissions', async () => {
  const responses = basicResponses();
  responses.GetBucketAcl.Grants = [{ Grantee: { URI: 'http://acs.amazonaws.com/groups/global/AllUsers' }, Permission: 'READ' }];
  let report = (await mocked({ responses })).report;
  assert.equal(report.s3.bucketAcl.publicListGrant, true);
  assert.equal(report.s3.privateReadPolicyRisk, false);
  responses.GetBucketAcl.Grants[0].Permission = 'WRITE';
  responses.GetPublicAccessBlock.PublicAccessBlockConfiguration.IgnorePublicAcls = false;
  report = (await mocked({ responses })).report;
  assert.equal(report.blocked, true);
  responses.GetPublicAccessBlock.PublicAccessBlockConfiguration.IgnorePublicAcls = true;
  assert.equal((await mocked({ responses })).report.blocked, false);
});

test('every network operation including body reading has an abortable deadline and no raw timeout/error output', async () => {
  const responses = basicResponses(); let aborts = 0;
  for (const operation of Object.keys(responses)) responses[operation] = signal => {
    signal.addEventListener('abort', () => { aborts++; }); return new Promise(() => {});
  };
  const started = performance.now();
  const { report } = await mocked({ responses, timeoutMs: 20, fetchImpl: (_url, options) => {
    options.signal.addEventListener('abort', () => { aborts++; }); return new Promise(() => {});
  } });
  assert.ok(performance.now() - started < 1000);
  assert.equal(aborts, 6);
  assert.equal(report.resend.status, 'timeout');
  assert.equal(report.s3.headBucket.status, 'timeout');
  assert.equal(report.status, 'review_required');
  const stalledBody = (await mocked({ timeoutMs: 20, fetchImpl: () => new Response(new ReadableStream({ start() {} })) })).report;
  assert.equal(stalledBody.resend.status, 'timeout');
});

test('malformed/oversized provider payloads and incomplete S3 metadata cannot establish a clean result', async () => {
  const oversized = (await mocked({ fetchImpl: () => new Response('a'.repeat(256 * 1024 + 1)) })).report;
  assert.equal(oversized.status, 'review_required');
  const malformed = (await mocked({ fetchImpl: () => new Response('{invalid-json') })).report;
  assert.equal(malformed.status, 'review_required');
  const responses = basicResponses();
  responses.GetBucketPolicyStatus = {};
  responses.GetBucketAcl = {};
  responses.GetPublicAccessBlock = {};
  const report = (await mocked({ responses })).report;
  for (const check of ['policyStatus', 'bucketAcl', 'publicAccessBlock']) assert.equal(report.s3[check].status, 'invalid_response');
  assert.equal(report.status, 'review_required');
  assert.equal(policyAssessment('NEVER_OUTPUT_INVALID_JSON', bucket).status, 'invalid_response');
});

