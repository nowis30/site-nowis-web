'use strict';

/**
 * Read-only native-environment preflight. Never loads .env files, prints values,
 * queries the database, sends mail, lists/reads objects, or writes providers.
 * See docs/provider-preflight.md for interpretation and permission limits.
 */
const DOMAIN = 'nowis.store';
const TIMEOUT_MS = 10_000;
const MAX_JSON_BYTES = 256 * 1024;
const DEVELOPMENT_KEYS = new Set([
  'change-me-in-production', 'dev-only-secret-must-change-before-prod',
  'dev-only-portal-secret-must-change', 'change-me-before-production', 'your-secret-key',
  'dev-calendar-token-encryption-key-change-me',
]);
const S3_OPERATIONS = ['HeadBucket', 'GetPublicAccessBlock', 'GetBucketPolicyStatus', 'GetBucketAcl', 'GetBucketPolicy'];
const asArray = value => value === undefined ? [] : Array.isArray(value) ? value : [value];

function signingCheck(env, names) {
  const index = names.findIndex(name => typeof env[name] === 'string' && env[name].trim());
  const value = index < 0 ? '' : env[names[index]].trim();
  const status = !value ? 'missing' : Buffer.byteLength(value, 'utf8') < 32 ? 'too_short'
    : DEVELOPMENT_KEYS.has(value) ? 'development_key' : 'ok';
  return { status, configured: index === 0, fallbackUsed: index > 0, valid: status === 'ok' };
}

async function bounded(action, timeoutMs) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => action(controller.signal)),
      new Promise((_, reject) => { timer = setTimeout(() => {
        controller.abort(); const error = new Error(); error.name = 'PreflightTimeout'; reject(error);
      }, timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}

function providerErrorStatus(error) {
  const name = error && (error.name || error.Code);
  const code = error && error.$metadata && error.$metadata.httpStatusCode;
  if (name === 'PreflightTimeout' || name === 'AbortError' || name === 'TimeoutError') return 'timeout';
  if (['InvalidAccessKeyId', 'SignatureDoesNotMatch', 'ExpiredToken', 'InvalidToken'].includes(name) || code === 401) return 'invalid_credentials';
  if (['AccessDenied', 'Forbidden'].includes(name) || code === 403) return 'forbidden';
  if (['NoSuchBucketPolicy', 'NoSuchPublicAccessBlockConfiguration'].includes(name)) return 'absent';
  if (name === 'NoSuchBucket' || name === 'NotFound' || code === 404) return 'not_found';
  if (name === 'NotImplemented' || code === 405 || code === 501) return 'not_supported';
  return 'provider_error';
}

// IAM '*'/'?' matching without an attacker-controlled regular expression.
function wildcardMatch(pattern, value) {
  if (typeof pattern !== 'string' || pattern.length > 8192) return false;
  let p = 0, v = 0, star = -1, retry = 0;
  while (v < value.length) {
    if (pattern[p] === '?' || pattern[p] === value[v]) { p++; v++; }
    else if (pattern[p] === '*') { star = p++; retry = v; }
    else if (star >= 0) { p = star + 1; v = ++retry; }
    else return false;
  }
  while (pattern[p] === '*') p++;
  return p === pattern.length;
}

function keyPattern(resource, bucket) {
  if (resource === '*') return '*';
  if (typeof resource !== 'string' || resource.length > 8192) return null;
  const match = /^arn:[a-z0-9-]+:s3:::([^/]+)\/(.*)$/.exec(resource);
  return match && wildcardMatch(match[1], bucket) ? match[2] : null;
}

function privateOverlap(pattern) {
  // A wildcard before a fixed private prefix is conservatively uncertain.
  const literal = pattern.split(/[*?]/, 1)[0];
  return ['client-files/', 'crm-files/', 'legacy-uploads/'].some(prefix =>
    literal.startsWith(prefix) || prefix.startsWith(literal));
}

function policyAssessment(text, bucket) {
  let policy;
  try {
    if (typeof text !== 'string' || Buffer.byteLength(text, 'utf8') > MAX_JSON_BYTES) throw new Error();
    policy = JSON.parse(text);
    if (!policy || typeof policy !== 'object' || !policy.Statement) throw new Error();
  } catch { return { status: 'invalid_response', publicReadGrant: false, privateReadGrant: false, mediaOnly: false, requiresReview: true }; }
  const statements = asArray(policy.Statement);
  if (statements.length > 1000 || statements.some(s => !s || typeof s !== 'object')) {
    return { status: 'invalid_response', publicReadGrant: false, privateReadGrant: false, mediaOnly: false, requiresReview: true };
  }
  let publicReadGrant = false, privateReadGrant = false, mediaOnly = true, requiresReview = false;
  const hasDeny = statements.some(s => s.Effect === 'Deny');
  for (const statement of statements) {
    if (statement.Effect !== 'Allow') continue;
    if (statement.NotPrincipal || statement.NotResource) requiresReview = true;
    const principal = statement.Principal;
    const publicPrincipal = principal === '*' || (principal && typeof principal === 'object' && asArray(principal.AWS).includes('*'));
    if (!publicPrincipal && !statement.NotPrincipal) continue;
    const reads = ['s3:getobject', 's3:getobjectversion'].some(action =>
      statement.NotAction ? !asArray(statement.NotAction).some(p => wildcardMatch(String(p).toLowerCase(), action))
        : asArray(statement.Action).some(p => wildcardMatch(String(p).toLowerCase(), action)));
    if (!reads) continue;
    for (const resource of asArray(statement.Resource)) {
      if (typeof resource !== 'string' || resource.length > 8192) { requiresReview = true; continue; }
      const pattern = keyPattern(resource, bucket);
      if (pattern === null) continue;
      publicReadGrant = true;
      privateReadGrant ||= privateOverlap(pattern);
      const literal = pattern.split(/[*?]/, 1)[0];
      mediaOnly &&= literal.startsWith('audio/') || literal.startsWith('games/');
      if (!privateOverlap(pattern) && !literal.startsWith('audio/') && !literal.startsWith('games/')) requiresReview = true;
      if (statement.Condition || hasDeny || statement.NotPrincipal || statement.NotResource) requiresReview = true;
    }
  }
  return { status: requiresReview ? 'review_required' : 'ok', publicReadGrant, privateReadGrant,
    mediaOnly: publicReadGrant && mediaOnly && !requiresReview, requiresReview };
}

async function readSmallJson(response) {
  if (Number(response.headers.get('content-length')) > MAX_JSON_BYTES || !response.body) throw new Error();
  const reader = response.body.getReader();
  const chunks = []; let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_JSON_BYTES) { await reader.cancel(); throw new Error(); }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally { reader.releaseLock(); }
}

async function resendCheck(env, fetchImpl, timeoutMs) {
  if (!env.RESEND_API_KEY || !env.RESEND_API_KEY.trim()) return { status: 'missing', domain: DOMAIN, verified: false, sendingEnabled: false };
  try {
    return await bounded(async signal => {
      // Fixed HTTPS origin/path; redirects are refused and body size is bounded.
      const response = await fetchImpl('https://api.resend.com/domains?limit=100', {
        method: 'GET', redirect: 'error', signal, headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY.trim() },
      });
      if (!response.ok) return { status: response.status === 401 ? 'invalid_credentials' : response.status === 403 ? 'forbidden' : 'provider_error',
        domain: DOMAIN, verified: false, sendingEnabled: false };
      const payload = await readSmallJson(response);
      if (!payload || !Array.isArray(payload.data)) return { status: 'invalid_response', domain: DOMAIN, verified: false, sendingEnabled: false };
      const domain = payload.data.find(entry => entry && entry.name === DOMAIN);
      if (!domain) return { status: payload.has_more === false ? 'not_found' : 'not_established', domain: DOMAIN, verified: false, sendingEnabled: false };
      const verified = domain.status === 'verified';
      const sendingEnabled = domain.capabilities && domain.capabilities.sending === 'enabled';
      return { status: !verified ? 'not_verified' : sendingEnabled ? 'ok'
        : domain.capabilities && domain.capabilities.sending === 'disabled' ? 'sending_disabled' : 'not_established',
      domain: DOMAIN, verified, sendingEnabled: Boolean(sendingEnabled) };
    }, timeoutMs);
  } catch (error) {
    return { status: providerErrorStatus(error), domain: DOMAIN, verified: false, sendingEnabled: false };
  }
}

function nativeS3(env) {
  const sdk = require('@aws-sdk/client-s3');
  const client = new sdk.S3Client({
    region: env.S3_REGION || 'auto', endpoint: env.S3_ENDPOINT && env.S3_ENDPOINT.trim() || undefined,
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
    forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true', maxAttempts: 1,
    requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
  });
  return { read: (operation, signal) => client.send(new sdk[operation + 'Command']({ Bucket: env.S3_BUCKET }), { abortSignal: signal }),
    close: () => client.destroy() };
}

async function s3Check(env, createClient, timeoutMs) {
  const configured = ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_PUBLIC_BASE_URL']
    .every(name => typeof env[name] === 'string' && env[name].trim());
  const report = { status: configured ? 'not_established' : 'missing', configured };
  if (!configured) return report;
  if (env.S3_ENDPOINT) {
    try { if (new URL(env.S3_ENDPOINT).protocol !== 'https:') throw new Error(); }
    catch { report.status = 'invalid_configuration'; return report; }
  }
  let client;
  try { client = createClient(env); } catch { report.status = 'invalid_configuration'; return report; }
  try {
    const checks = await Promise.all(S3_OPERATIONS.map(async operation => {
      try { return [operation, { status: 'ok', value: await bounded(signal => client.read(operation, signal), timeoutMs) }]; }
      catch (error) { return [operation, { status: providerErrorStatus(error) }]; }
    }));
    const results = Object.fromEntries(checks);
    const head = results.HeadBucket;
    report.headBucket = { status: head.status };
    const access = results.GetPublicAccessBlock;
    const bpa = access.value && access.value.PublicAccessBlockConfiguration || {};
    const accessStatus = access.status === 'ok' && (!access.value || !access.value.PublicAccessBlockConfiguration
      || ['BlockPublicAcls', 'IgnorePublicAcls', 'BlockPublicPolicy', 'RestrictPublicBuckets'].some(key => typeof bpa[key] !== 'boolean'))
      ? 'invalid_response' : access.status;
    report.publicAccessBlock = { status: accessStatus,
      blockPublicAcls: bpa.BlockPublicAcls === true, ignorePublicAcls: bpa.IgnorePublicAcls === true,
      blockPublicPolicy: bpa.BlockPublicPolicy === true, restrictPublicBuckets: bpa.RestrictPublicBuckets === true };
    const status = results.GetBucketPolicyStatus;
    const policyStatus = status.value && status.value.PolicyStatus;
    report.policyStatus = { status: status.status === 'ok' && (!policyStatus || typeof policyStatus.IsPublic !== 'boolean') ? 'invalid_response' : status.status,
      public: Boolean(policyStatus && policyStatus.IsPublic) };
    const acl = results.GetBucketAcl;
    const grants = acl.value && Array.isArray(acl.value.Grants) ? acl.value.Grants : [];
    const publicGrants = grants.filter(g => g.Grantee && ['http://acs.amazonaws.com/groups/global/AllUsers',
      'http://acs.amazonaws.com/groups/global/AuthenticatedUsers'].includes(g.Grantee.URI));
    report.bucketAcl = { status: acl.status === 'ok' && (!acl.value || !Array.isArray(acl.value.Grants)) ? 'invalid_response' : acl.status,
      publicListGrant: publicGrants.some(g => ['READ', 'FULL_CONTROL'].includes(g.Permission)),
      publicWriteGrant: publicGrants.some(g => ['WRITE', 'FULL_CONTROL'].includes(g.Permission)) };
    const policy = results.GetBucketPolicy;
    report.policy = policy.status === 'ok' ? policyAssessment(policy.value && policy.value.Policy, env.S3_BUCKET)
      : { status: policy.status, publicReadGrant: false, privateReadGrant: false, mediaOnly: false, requiresReview: policy.status !== 'absent' };
    report.privateReadPolicyRisk = report.policy.privateReadGrant && !report.policy.requiresReview && !report.publicAccessBlock.restrictPublicBuckets;
    report.publicWriteAclRisk = report.bucketAcl.publicWriteGrant && !report.publicAccessBlock.ignorePublicAcls;
    report.blocking = ['not_found', 'invalid_credentials'].includes(head.status) || report.privateReadPolicyRisk || report.publicWriteAclRisk;
    const established = [report.headBucket, report.publicAccessBlock, report.policyStatus, report.bucketAcl, report.policy]
      .every(check => ['ok', 'absent'].includes(check.status)) && !report.policy.requiresReview;
    report.status = report.blocking ? 'blocked' : established ? 'passed_with_limits' : 'not_established';
    return report;
  } finally { if (client.close) { try { client.close(); } catch {} } }
}

async function runPreflight({ env = process.env, fetchImpl = globalThis.fetch, createS3Client = nativeS3, timeoutMs = TIMEOUT_MS } = {}) {
  timeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? Math.min(timeoutMs, TIMEOUT_MS) : TIMEOUT_MS;
  const signing = {
    jwt: signingCheck(env, ['JWT_SECRET']),
    portal: signingCheck(env, ['CLIENT_PORTAL_JWT_SECRET', 'JWT_SECRET']),
    calendar: signingCheck(env, ['CALENDAR_TOKEN_ENCRYPTION_KEY']),
    publicLinks: signingCheck(env, ['PUBLIC_LINKS_JWT_SECRET', 'CLIENT_PORTAL_JWT_SECRET', 'JWT_SECRET']),
    fileUpload: signingCheck(env, ['FILE_UPLOAD_JWT_SECRET', 'CLIENT_PORTAL_JWT_SECRET', 'JWT_SECRET']),
  };
  const [resend, s3] = await Promise.all([resendCheck(env, fetchImpl, timeoutMs), s3Check(env, createS3Client, timeoutMs)]);
  const blocked = Object.values(signing).some(check => !check.valid)
    || ['missing', 'invalid_credentials', 'not_found', 'not_verified', 'sending_disabled'].includes(resend.status)
    || ['missing', 'invalid_configuration'].includes(s3.status) || s3.blocking === true;
  return { status: blocked ? 'blocked' : resend.status === 'ok' && s3.status === 'passed_with_limits' ? 'passed_with_limits' : 'review_required',
    blocked, signing, resend, s3, limits: { emailDelivery: 'not_checked', s3WritePermissions: 'not_checked',
      accountPublicAccessBlock: 'not_checked', accessPointsOrCdn: 'not_checked', individualObjectAcls: 'not_checked' } };
}

module.exports = { runPreflight, policyAssessment, signingCheck, wildcardMatch };
if (require.main === module) {
  runPreflight().then(report => { process.stdout.write(JSON.stringify(report) + '\n'); process.exitCode = report.blocked ? 1 : 0; },
    () => { process.stdout.write(JSON.stringify({ status: 'internal_error', blocked: true }) + '\n'); process.exitCode = 1; });
}

