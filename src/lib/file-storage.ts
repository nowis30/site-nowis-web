import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { sanitizeFileBaseName } from '@/lib/file-documents';
import { assertFileContentSignature } from '@/lib/file-content-signature';

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable manquante: ${name}`);
  }
  return value;
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

let s3Client: S3Client | null = null;

function getS3Client() {
  if (s3Client) return s3Client;

  const region = process.env.S3_REGION || 'auto';
  const endpoint = process.env.S3_ENDPOINT?.trim() || undefined;

  s3Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: requireEnv('S3_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('S3_SECRET_ACCESS_KEY'),
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

  return s3Client;
}

function getPublicBaseUrl() {
  return normalizeBaseUrl(requireEnv('S3_PUBLIC_BASE_URL'));
}

export function getStoredFileUrl(storageKey: string) {
  return `${getPublicBaseUrl()}/${encodeURI(storageKey)}`;
}

function buildStorageKey(folder: string, originalName: string) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const safeName = sanitizeFileBaseName(originalName);
  return `${folder}/${year}/${month}/${Date.now()}-${randomUUID()}-${safeName}`;
}

export async function createPresignedUploadUrl(
  file: { originalName: string; mimeType: string; size: number },
  options?: { folder?: string; expiresInSeconds?: number },
) {
  const bucket = requireEnv('S3_BUCKET');
  const folder = options?.folder || 'crm-files';
  const expiresInSeconds = options?.expiresInSeconds ?? 900;
  const storageKey = buildStorageKey(folder, file.originalName || 'file');
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ContentType: file.mimeType || 'application/octet-stream',
    ContentLength: file.size,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  return {
    uploadUrl,
    storageKey,
    url: getStoredFileUrl(storageKey),
    filename: storageKey.split('/').pop() || storageKey,
    originalName: file.originalName || 'file',
    mimeType: file.mimeType || 'application/octet-stream',
    size: file.size,
    expiresInSeconds,
  };
}

export async function createPresignedDownloadUrl(
  storageKey: string,
  options?: {
    expiresInSeconds?: number;
    fileName?: string;
    disposition?: 'inline' | 'attachment';
    responseContentType?: string;
  },
) {
  const bucket = requireEnv('S3_BUCKET');
  const client = getS3Client();

  const disposition = options?.disposition ?? 'attachment';
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ResponseContentType: options?.responseContentType || undefined,
    ResponseContentDisposition: options?.fileName
      ? `${disposition}; filename="${sanitizeFileBaseName(options.fileName)}"`
      : undefined,
  });

  return getSignedUrl(client, command, { expiresIn: options?.expiresInSeconds ?? 300 });
}

export async function getObjectForProxy(
  storageKey: string,
  range?: string | null,
): Promise<{
  body: ReadableStream<Uint8Array> | null;
  contentType?: string;
  contentLength?: number;
  contentRange?: string;
  acceptRanges?: string;
  status: 200 | 206;
}> {
  const bucket = requireEnv('S3_BUCKET');
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ...(range ? { Range: range } : {}),
  });

  const response = await client.send(command);

  return {
    body: response.Body ? (response.Body.transformToWebStream() as ReadableStream<Uint8Array>) : null,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
    contentRange: response.ContentRange,
    acceptRanges: response.AcceptRanges,
    status: range ? 206 : 200,
  };
}

export async function assertStoredObjectMetadata(storageKey: string, expected: { mimeType: string; size: number }) {
  const response = await getS3Client().send(
    new HeadObjectCommand({
      Bucket: requireEnv('S3_BUCKET'),
      Key: storageKey,
    }),
  );

  const actualSize = Number(response.ContentLength || 0);
  const actualType = String(response.ContentType || '').toLowerCase();
  const expectedType = String(expected.mimeType || '').toLowerCase();

  if (actualSize !== expected.size) {
    throw new Error('Fichier invalide: taille differente de celle attendue.');
  }

  if (actualType !== expectedType) {
    throw new Error('Fichier invalide: type MIME different de celui attendu.');
  }
  return response.ETag;
}

/** Copy the checked staging object to a fresh key that has no public PUT grant. */
export async function finalizeUploadedFile(file: { storageKey: string; originalName: string; mimeType: string; size: number }, folder: string) {
  const etag = await assertStoredObjectMetadata(file.storageKey, file);
  if (!etag) throw new Error('Fichier invalide: version stockage indisponible.');
  const bucket = requireEnv('S3_BUCKET');
  // Pin the inspected bytes and the later copy to the same S3 object version.
  const inspected = await getS3Client().send(new GetObjectCommand({ Bucket: bucket, Key: file.storageKey, Range: 'bytes=0-4095', IfMatch: etag }), { abortSignal: AbortSignal.timeout(10_000) });
  const stream = inspected.Body?.transformToWebStream() as ReadableStream<Uint8Array> | undefined;
  if (!stream) throw new Error('FILE_CONTENT_UNAVAILABLE');
  const reader = stream.getReader();
  const bytes = new Uint8Array(4096);
  let length = 0;
  let expired = false;
  const timer = setTimeout(() => { expired = true; void reader.cancel().catch(() => undefined); }, 10_000);
  try {
    while (true) {
      const part = await reader.read();
      if (expired) throw new Error('FILE_INSPECTION_TIMEOUT');
      if (part.done) break;
      if (length + part.value.length > bytes.length) throw new Error('FILE_INSPECTION_TOO_LARGE');
      bytes.set(part.value, length); length += part.value.length;
    }
    if (length !== Math.min(file.size, bytes.length)) throw new Error('FILE_INSPECTION_INCOMPLETE');
    assertFileContentSignature(bytes.subarray(0, length), file.mimeType);
  } finally { clearTimeout(timer); void reader.cancel().catch(() => undefined); reader.releaseLock(); }
  const finalKey = buildStorageKey(folder, file.originalName);
  try {
    await getS3Client().send(new CopyObjectCommand({ Bucket: bucket, Key: finalKey,
      CopySource: `${bucket}/${encodeURIComponent(file.storageKey).replace(/%2F/g, '/')}`,
      CopySourceIfMatch: etag,
      MetadataDirective: 'REPLACE', ContentType: file.mimeType,
      ContentDisposition: `attachment; filename="${sanitizeFileBaseName(file.originalName)}"`,
    }));
  } catch (error) {
    // Only this request's fresh destination key is eligible for orphan cleanup.
    await deleteFileFromPersistentStorage(finalKey).catch(() => undefined);
    throw error;
  }
  await deleteFileFromPersistentStorage(file.storageKey).catch(() => undefined);
  return { storageKey: finalKey, url: getStoredFileUrl(finalKey), filename: finalKey.split('/').pop()! };
}

export async function storeFileInPersistentStorage(file: File, options?: { folder?: string }) {
  const bucket = requireEnv('S3_BUCKET');
  const folder = options?.folder || 'crm-files';
  const key = buildStorageKey(folder, file.name || 'file');

  const buffer = Buffer.from(await file.arrayBuffer());
  assertFileContentSignature(buffer.subarray(0, 4096), file.type);

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
      ContentDisposition: `attachment; filename="${sanitizeFileBaseName(file.name || 'file')}"`,
    }),
  );

  return {
    storageKey: key,
    url: `${getPublicBaseUrl()}/${encodeURI(key)}`,
    filename: key.split('/').pop() || key,
    originalName: file.name || 'file',
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
  };
}

export async function deleteFileFromPersistentStorage(storageKey: string) {
  if (!storageKey) return;
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: requireEnv('S3_BUCKET'),
      Key: storageKey,
    }),
  );
}

export function tryExtractStorageKeyFromUrl(url: string) {
  const base = getPublicBaseUrl();
  if (!url.startsWith(`${base}/`)) return null;
  return decodeURI(url.slice(base.length + 1));
}
