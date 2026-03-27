import { deleteFileFromPersistentStorage, storeFileInPersistentStorage, tryExtractStorageKeyFromUrl } from '@/lib/file-storage';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
]);

export async function persistUploadedFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Type de fichier non accepte. Formats autorises : JPEG, PNG, WebP, MP3, WAV, M4A, PDF, TXT, DOC, DOCX.');
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Fichier trop volumineux (max 10 Mo).');
  }

  const stored = await storeFileInPersistentStorage(file, { folder: 'legacy-uploads' });

  return {
    url: stored.url,
    fileName: stored.originalName,
    sizeBytes: stored.size,
    mimeType: stored.mimeType || null,
  };
}

export async function deleteStoredFileByUrl(fileUrl: string) {
  try {
    const storageKey = tryExtractStorageKeyFromUrl(fileUrl);
    if (!storageKey) return false;
    await deleteFileFromPersistentStorage(storageKey);
    return true;
  } catch {
    return false;
  }
}
