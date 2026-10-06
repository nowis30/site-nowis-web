'use strict';
/**
 * Opt-in native Vercel production test. Writes only three exact, owned keys
 * under each reserved client/CRM check prefix. No lists, policies or third-party
 * objects. All provider errors/objects/URLs/keys/signatures remain unprinted.
 */
const { randomUUID } = require('node:crypto');
const TIMEOUT_MS = 10_000;
const BODY_LIMIT = 4096;
const PAYLOAD = Buffer.from('NOWIS security storage test. No private data or account access.\n', 'utf8');
const OPERATIONS = new Set(['PutObject', 'HeadObject', 'CopyObject', 'GetObject', 'DeleteObject']);
const PREFIXES = ['client-files', 'crm-files'];

async function bounded(action, milliseconds) {
  const controller = new AbortController(); let timer;
  try {
    return await Promise.race([Promise.resolve().then(() => action(controller.signal)),
      new Promise((_, reject) => { timer = setTimeout(() => {
        controller.abort(); const error = new Error(); error.name = 'ProbeTimeout'; reject(error);
      }, milliseconds); })]);
  } finally { clearTimeout(timer); }
}
function safeStatus(error) {
  const name = error && error.name;
  const status = error && error.$metadata && error.$metadata.httpStatusCode;
  if (['ProbeTimeout', 'AbortError', 'TimeoutError'].includes(name)) return 'timeout';
  if (name === 'BodyLimit') return 'body_limit';
  if (name === 'InvalidResponse') return 'invalid_response';
  if (name === 'UnsafeOwnedKey') return 'ownership_guard_rejected';
  if (name === 'PreconditionFailed' || status === 412) return 'precondition_failed';
  if (name === 'NotFound' || name === 'NoSuchKey' || status === 404) return 'not_found';
  if (name === 'AccessDenied' || status === 403 || status === 401) return 'forbidden';
  return 'provider_error';
}
const fail = name => { const error = new Error(); error.name = name; throw error; };
function publicUrl(base, key) {
  const url = new URL(base);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) fail('InvalidResponse');
  return url.href.replace(/\/+$/, '') + '/' + encodeURI(key);
}
async function responseBytes(response) {
  if (Number(response.headers.get('content-length')) > BODY_LIMIT || !response.body) fail('BodyLimit');
  const reader = response.body.getReader(); const chunks = []; let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > BODY_LIMIT) { await reader.cancel(); fail('BodyLimit'); }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally { reader.releaseLock(); }
}
async function objectBytes(object) {
  if (!object || !object.Body || object.ContentLength > BODY_LIMIT) fail('BodyLimit');
  const chunks = []; let length = 0;
  try {
    for await (const chunk of object.Body) {
      const bytes = Buffer.from(chunk); length += bytes.byteLength;
      if (length > BODY_LIMIT) fail('BodyLimit');
      chunks.push(bytes);
    }
    return Buffer.concat(chunks);
  } finally { if (object.Body.destroy) object.Body.destroy(); }
}
async function anonymousCheck(urlAction, fetchImpl, timeoutMs) {
  try {
    return await bounded(async signal => {
      const url = await urlAction(signal);
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) fail('InvalidResponse');
      const response = await fetchImpl(url, { method: 'GET', signal, redirect: 'manual', credentials: 'omit', cache: 'no-store' });
      if ([401, 403, 404].includes(response.status)) {
        if (response.body) await response.body.cancel();
        return { status: 'access_denied', exposed: false };
      }
      if (!response.ok) {
        if (response.body) await response.body.cancel();
        return { status: response.status >= 300 && response.status < 400 ? 'redirect_not_followed' : 'not_established', exposed: false };
      }
      const body = await responseBytes(response);
      const exposed = body.equals(PAYLOAD);
      return { status: exposed ? 'object_exposed' : 'response_not_object', exposed };
    }, timeoutMs);
  } catch (error) { return { status: safeStatus(error), exposed: false }; }
}
function nativeClient(env) {
  const sdk = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  const client = new sdk.S3Client({
    region: env.S3_REGION || 'auto', endpoint: env.S3_ENDPOINT && env.S3_ENDPOINT.trim() || undefined,
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
    forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true', maxAttempts: 1,
    requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
  });
  return {
    run(operation, input, signal) {
      if (!OPERATIONS.has(operation)) fail('UnsafeOwnedKey');
      return client.send(new sdk[operation + 'Command'](input), { abortSignal: signal });
    },
    async unsignedUrl(key, signal) {
      // Resolve the SDK's actual endpoint/path without a network call. Immediately
      // discard every signed query parameter before any anonymous HTTP request.
      const signed = new URL(await getSignedUrl(client, new sdk.GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
        { expiresIn: 60, abortSignal: signal }));
      return signed.origin + signed.pathname;
    },
    close() { client.destroy(); },
  };
}
async function runStorageProbe({ argv = process.argv.slice(2), env = process.env, fetchImpl = globalThis.fetch,
  createClient = nativeClient, uuid = randomUUID, timeoutMs = TIMEOUT_MS } = {}) {
  if (argv.length !== 1 || argv[0] !== '--probe-authorized-test') return { status: 'not_authorized', blocked: true, attempted: false };
  if (env.VERCEL !== '1' || env.VERCEL_ENV !== 'production') return { status: 'not_native_production_build', blocked: true, attempted: false };
  if (!['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_PUBLIC_BASE_URL'].every(name => typeof env[name] === 'string' && env[name].trim())) {
    return { status: 'missing_configuration', blocked: true, attempted: false };
  }
  try {
    publicUrl(env.S3_PUBLIC_BASE_URL, 'owned-test-placeholder');
    if (env.S3_ENDPOINT) publicUrl(env.S3_ENDPOINT, 'owned-test-placeholder');
  } catch { return { status: 'invalid_configuration', blocked: true, attempted: false }; }
  let runId, client;
  try {
    runId = uuid();
    if (typeof runId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(runId)) fail('UnsafeOwnedKey');
    client = createClient(env);
  } catch { return { status: 'internal_error', blocked: true, attempted: false }; }
  timeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? Math.min(timeoutMs, TIMEOUT_MS) : TIMEOUT_MS;
  const results = {}; let blocked = false, uncertain = false;
  try {
    for (const prefix of PREFIXES) {
      const base = prefix + '/__nowis_security_check__/' + runId + '/';
      const source = base + 'source.txt', final = base + 'final.txt', rejected = base + 'rejected-copy.txt';
      const owned = new Set([source, final, rejected]);
      const attemptedKeys = new Set();
      const createdVersions = new Map();
      const report = { status: 'not_established', upload: 'not_attempted', metadata: 'not_attempted',
        conditionalCopy: 'not_attempted', copy: 'not_attempted', authenticatedRead: 'not_attempted',
        anonymous: {}, cleanup: { status: 'not_attempted', complete: false }, exposed: false };
      results[prefix === 'client-files' ? 'client' : 'crm'] = report;
      const assertOwned = key => { if (!owned.has(key) || !key.startsWith(base)) fail('UnsafeOwnedKey'); };
      const send = (operation, key, extra = {}) => bounded(signal => {
        assertOwned(key);
        if ((operation === 'PutObject' || operation === 'CopyObject')) attemptedKeys.add(key);
        return Promise.resolve(client.run(operation, { ...extra, Bucket: env.S3_BUCKET, Key: key }, signal)).then(value => {
          if (['PutObject', 'CopyObject', 'HeadObject'].includes(operation) && value
            && typeof value.VersionId === 'string' && value.VersionId && value.VersionId.length <= 1024) {
            const versions = createdVersions.get(key) || new Set(); versions.add(value.VersionId); createdVersions.set(key, versions);
          }
          return value;
        });
      }, timeoutMs);
      let step = 'upload', failed = false;
      try {
        await send('PutObject', source, { Body: PAYLOAD, ContentLength: PAYLOAD.byteLength, ContentType: 'text/plain',
          CacheControl: 'no-store', IfNoneMatch: '*' });
        report.upload = 'ok';
        step = 'metadata';
        const metadata = await send('HeadObject', source);
        if (!metadata || metadata.ContentLength !== PAYLOAD.byteLength || metadata.ContentType !== 'text/plain'
          || typeof metadata.ETag !== 'string' || !metadata.ETag || metadata.ETag.length > 256) fail('InvalidResponse');
        report.metadata = 'ok';
        const copySource = env.S3_BUCKET + '/' + encodeURIComponent(source).replace(/%2F/g, '/');
        step = 'conditionalCopy';
        const wrongETag = metadata.ETag === '"00000000000000000000000000000000"' ? '"ffffffffffffffffffffffffffffffff"' : '"00000000000000000000000000000000"';
        let rejectedAsExpected = false;
        try {
          await send('CopyObject', rejected, { CopySource: copySource, CopySourceIfMatch: wrongETag, MetadataDirective: 'COPY' });
        } catch (error) {
          if (safeStatus(error) !== 'precondition_failed') throw error;
          rejectedAsExpected = true; attemptedKeys.delete(rejected);
        }
        if (!rejectedAsExpected) { report.conditionalCopy = 'condition_not_enforced'; fail('InvalidResponse'); }
        report.conditionalCopy = 'ok';
        step = 'copy';
        await send('CopyObject', final, { CopySource: copySource, CopySourceIfMatch: metadata.ETag, MetadataDirective: 'COPY' });
        report.copy = 'ok';
        step = 'authenticatedRead';
        const bytes = await bounded(async signal => {
          assertOwned(final);
          const object = await client.run('GetObject', { Bucket: env.S3_BUCKET, Key: final }, signal);
          return objectBytes(object);
        }, timeoutMs);
        if (!bytes.equals(PAYLOAD)) fail('InvalidResponse');
        report.authenticatedRead = 'ok';
        for (const [name, key] of [['source', source], ['final', final]]) {
          const pair = await Promise.all([
            anonymousCheck(() => { assertOwned(key); return publicUrl(env.S3_PUBLIC_BASE_URL, key); }, fetchImpl, timeoutMs),
            anonymousCheck(signal => { assertOwned(key); return client.unsignedUrl(key, signal); }, fetchImpl, timeoutMs),
          ]);
          report.anonymous[name] = { publicBase: pair[0], s3Endpoint: pair[1] };
          report.exposed ||= pair.some(check => check.exposed);
          uncertain ||= pair.some(check => !['access_denied', 'object_exposed'].includes(check.status));
        }
        report.status = report.exposed ? 'private_object_exposed' : 'checks_completed';
        blocked ||= report.exposed;
      } catch (error) {
        failed = true;
        if (report[step] === 'not_attempted') report[step] = safeStatus(error);
        report.status = 'failed'; blocked = true;
      } finally {
        // Only exact keys whose creation was attempted by this request. A timed
        // out creation may have committed, so cleanup includes that owned key.
        let complete = true;
        for (const key of attemptedKeys) {
          const versions = createdVersions.get(key);
          if (versions && versions.size) {
            for (const version of versions) { try { await send('DeleteObject', key, { VersionId: version }); } catch { complete = false; } }
          } else { try { await send('DeleteObject', key); } catch { complete = false; } }
        }
        report.cleanup = { status: complete ? 'ok' : 'not_established', complete };
        if (!complete) { blocked = true; if (!failed) report.status = 'cleanup_incomplete'; }
      }
    }
    return { status: blocked ? 'blocked' : uncertain ? 'review_required' : 'passed_with_limits',
      blocked, attempted: true, checks: results, limits: { historicalObjects: 'not_checked', lifecycleAfterAmbiguousTimeout: 'not_established',
        thirdPartyData: 'not_checked', mediaPermissions: 'not_changed' } };
  } finally { if (client.close) { try { client.close(); } catch {} } }
}
module.exports = { runStorageProbe };
if (require.main === module) {
  runStorageProbe().then(report => { process.stdout.write(JSON.stringify(report) + '\n'); process.exitCode = report.blocked ? 1 : 0; },
    () => { process.stdout.write(JSON.stringify({ status: 'internal_error', blocked: true, attempted: false }) + '\n'); process.exitCode = 1; });
}

