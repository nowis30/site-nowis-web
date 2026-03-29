import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  return {
    uploadUrl,
    storageKey,
    url: `${getPublicBaseUrl()}/${encodeURI(storageKey)}`,
    filename: storageKey.split('/').pop() || storageKey,
    originalName: file.originalName || 'file',
    mimeType: file.mimeType || 'application/octet-stream',
    size: file.size,
    expiresInSeconds,
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

  if (expectedType && actualType && actualType !== expectedType) {
    throw new Error('Fichier invalide: type MIME different de celui attendu.');
  }
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
