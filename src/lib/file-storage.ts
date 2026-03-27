import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { sanitizeFileBaseName } from '@/lib/file-documents';

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
  const endpoint = process.env.S3_ENDPOINT;

  s3Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: requireEnv('S3_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('S3_SECRET_ACCESS_KEY'),
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  });

  return s3Client;
}

function getPublicBaseUrl() {
  return normalizeBaseUrl(requireEnv('S3_PUBLIC_BASE_URL'));
}

function buildStorageKey(folder: string, originalName: string) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const safeName = sanitizeFileBaseName(originalName);
  return `${folder}/${year}/${month}/${Date.now()}-${randomUUID()}-${safeName}`;
}

export async function storeFileInPersistentStorage(file: File, options?: { folder?: string }) {
  const bucket = requireEnv('S3_BUCKET');
  const folder = options?.folder || 'crm-files';
  const key = buildStorageKey(folder, file.name || 'file');

  const buffer = Buffer.from(await file.arrayBuffer());

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
      ContentDisposition: `inline; filename="${sanitizeFileBaseName(file.name || 'file')}"`,
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
