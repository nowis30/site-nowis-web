import { FileContentTypeError } from '@/lib/file-content-signature';
export const MAX_UPLOAD_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOAD_BODY_BYTES = MAX_UPLOAD_FILE_BYTES + 64 * 1024;

export class UploadBodyError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Check metadata without reading the caller's body. Authentication must run first. */
export function assertUploadMultipartHeaders(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  if (!/^multipart\/form-data(?:\s*;|$)/i.test(contentType)) {
    throw new UploadBodyError(415, 'Le fichier doit être envoyé au format multipart.');
  }
  const match = /(?:^|;)\s*boundary\s*=\s*(?:"([^"]+)"|([^;\s]+))/i.exec(contentType);
  const boundary = match?.[1] || match?.[2];
  if (!boundary || boundary.length > 200 || /[\u0000-\u001f\u007f]/.test(boundary)) {
    throw new UploadBodyError(400, 'Format de dépôt invalide.');
  }
  const length = request.headers.get('content-length');
  if (length !== null) {
    if (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length))) {
      throw new UploadBodyError(400, 'Taille de dépôt invalide.');
    }
    if (Number(length) > MAX_UPLOAD_BODY_BYTES) {
      throw new UploadBodyError(413, 'Dépôt trop volumineux. Le fichier est limité à 10 Mo.');
    }
  }
}

/** Bound actual bytes before the multipart parser can allocate the entire upload. */
export async function readBoundedUploadFormData(request: Request): Promise<FormData> {
  assertUploadMultipartHeaders(request);
  const reader = request.body?.getReader();
  if (!reader) throw new UploadBodyError(400, 'Aucun fichier reçu.');
  const chunks: Uint8Array[] = [];
  // Coalesce tiny transport chunks so a fragmented body cannot grow this array indefinitely.
  let block = new Uint8Array(64 * 1024);
  let blockBytes = 0;
  let bytes = 0;
  let expired = false;
  const timer = setTimeout(() => { expired = true; void reader.cancel().catch(() => undefined); }, 15_000);
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (expired) throw new UploadBodyError(503, 'Le dépôt a été interrompu. Réessayez plus tard.');
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_UPLOAD_BODY_BYTES) {
        void reader.cancel().catch(() => undefined);
        throw new UploadBodyError(413, 'Dépôt trop volumineux. Le fichier est limité à 10 Mo.');
      }
      for (let offset = 0; offset < value.byteLength;) {
        const length = Math.min(block.byteLength - blockBytes, value.byteLength - offset);
        block.set(value.subarray(offset, offset + length), blockBytes);
        offset += length; blockBytes += length;
        if (blockBytes === block.byteLength) {chunks.push(block); block = new Uint8Array(64 * 1024); blockBytes = 0;}
      }
    }
  } catch (error) {
    void reader.cancel().catch(() => undefined);
    if (error instanceof UploadBodyError) throw error;
    throw new UploadBodyError(503, 'Le dépôt a été interrompu. Réessayez plus tard.');
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
  try {
    // Parse only a fresh, already bounded buffer. Never call request.formData().
    if (blockBytes) chunks.push(block.subarray(0, blockBytes));
    const body = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {body.set(chunk, offset); offset += chunk.byteLength;}
    chunks.length = 0;
    return await new Response(body, {headers: {'Content-Type': request.headers.get('content-type')!}}).formData();
  } catch {
    throw new UploadBodyError(400, 'Format de dépôt invalide.');
  }
}

export function legacyUploadError(error: unknown): {status: number; message: string} {
  if (error instanceof FileContentTypeError) return { status: 400, message: error.message };
  if (error instanceof UploadBodyError) return {status:error.status, message:error.message};
  // The file validator has fixed messages; never expose a storage/provider error.
  if (error instanceof Error && error.message.startsWith('Type de fichier non accepte.')) {
    return {status:400, message:'Type de fichier non accepté.'};
  }
  return {status:503, message:'Dépôt temporairement indisponible. Réessayez plus tard.'};
}
