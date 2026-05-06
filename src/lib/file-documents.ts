import { z } from 'zod';
import { OFFICIAL_DOCUMENT_CATEGORIES } from '@/features/documents/document-categories';

export const fileVisibilitySchema = z.enum(['admin_only', 'client_visible']);
export type FileVisibilityInput = z.infer<typeof fileVisibilitySchema>;

export const FILE_VISIBILITY_DB: Record<FileVisibilityInput, 'ADMIN_ONLY' | 'CLIENT_VISIBLE'> = {
  admin_only: 'ADMIN_ONLY',
  client_visible: 'CLIENT_VISIBLE',
};

export const FILE_VISIBILITY_FROM_DB: Record<'ADMIN_ONLY' | 'CLIENT_VISIBLE', FileVisibilityInput> = {
  ADMIN_ONLY: 'admin_only',
  CLIENT_VISIBLE: 'client_visible',
};

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'video/mp4',
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
] as const;

export const ALLOWED_UPLOAD_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.mp4', '.pdf', '.txt', '.doc', '.docx'] as const;

export const FILE_CATEGORY_OPTIONS = OFFICIAL_DOCUMENT_CATEGORIES;

export const DEFAULT_MAX_UPLOAD_SIZE_BYTES = 250 * 1024 * 1024;

export function getMaxUploadSizeBytes() {
  const raw = Number(process.env.MAX_FILE_UPLOAD_BYTES ?? process.env.NEXT_PUBLIC_MAX_FILE_UPLOAD_BYTES ?? DEFAULT_MAX_UPLOAD_SIZE_BYTES);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_UPLOAD_SIZE_BYTES;
}

export function getClientMaxUploadSizeBytes() {
  const raw = Number(process.env.NEXT_PUBLIC_MAX_FILE_UPLOAD_BYTES ?? DEFAULT_MAX_UPLOAD_SIZE_BYTES);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_UPLOAD_SIZE_BYTES;
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
  return `${(size / 1024 / 1024).toFixed(1)} Mo`;
}

export function sanitizeFileBaseName(input: string) {
  return input.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 120) || 'file';
}
