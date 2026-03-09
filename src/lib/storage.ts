import path from 'path';

const DEFAULT_DB_FILE = path.join(process.cwd(), 'data', 'db.json');
const DEFAULT_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export function getDatabaseFilePath(): string {
  return process.env.DB_FILE_PATH || DEFAULT_DB_FILE;
}

export function getUploadsDirectory(): string {
  return process.env.UPLOAD_DIR || DEFAULT_UPLOADS_DIR;
}

export function getPublicUploadsBaseUrl(): string {
  return process.env.UPLOAD_PUBLIC_BASE_URL || '/uploads';
}

export function getStoredUploadUrl(fileName: string): string {
  const baseUrl = getPublicUploadsBaseUrl().replace(/\/+$/, '');
  return `${baseUrl}/${encodeURIComponent(fileName)}`;
}

export function isUsingDefaultPublicUploadsDir(): boolean {
  return path.resolve(getUploadsDirectory()) === path.resolve(DEFAULT_UPLOADS_DIR);
}
