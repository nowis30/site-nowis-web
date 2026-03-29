import { z } from 'zod';
import { ALLOWED_UPLOAD_MIME_TYPES, FILE_CATEGORY_OPTIONS, fileVisibilitySchema, formatBytes, getMaxUploadSizeBytes } from '@/lib/file-documents';

export const uploadFileMetadataSchema = z.object({
  contactId: z.string().uuid().optional(),
  songRequestId: z.string().uuid().optional(),
  category: z
    .string()
    .trim()
    .min(2, 'Categorie invalide')
    .max(80, 'Categorie trop longue')
    .default(FILE_CATEGORY_OPTIONS[4]),
  visibility: fileVisibilitySchema.default('client_visible'),
});

export function validateUploadFile(file: File) {
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number])) {
    throw new Error('Type de fichier non autorise. Formats: MP3, WAV, M4A, MP4, PDF, TXT, DOC, DOCX.');
  }

  const maxSize = getMaxUploadSizeBytes();
  if (file.size > maxSize) {
    throw new Error(`Fichier trop volumineux. Taille max: ${formatBytes(maxSize)}.`);
  }
}

export function validateUploadDescriptor(descriptor: { mimeType: string; size: number }) {
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(descriptor.mimeType as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number])) {
    throw new Error('Type de fichier non autorise. Formats: MP3, WAV, M4A, MP4, PDF, TXT, DOC, DOCX.');
  }

  const maxSize = getMaxUploadSizeBytes();
  if (descriptor.size > maxSize) {
    throw new Error(`Fichier trop volumineux. Taille max: ${formatBytes(maxSize)}.`);
  }
}
