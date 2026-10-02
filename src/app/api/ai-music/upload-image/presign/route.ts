import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createPresignedUploadUrl } from '@/lib/file-storage';
import { getRadioUser, radioError, radioJson, readRadioJson } from '@/lib/radio-api';

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const schema = z.object({
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.string().trim().min(3).max(80),
  size: z.number().int().positive().max(MAX_IMAGE_SIZE),
  purpose: z.enum(['avatar', 'banner', 'song-cover']),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const user = await getRadioUser(request);
    if (!user) return radioJson({ message: 'Connectez-vous pour envoyer une image.' }, 401);

    const payload = schema.parse(await readRadioJson(request));
    if (!ALLOWED_IMAGES.has(payload.mimeType)) {
      return radioJson({ message: 'Format accepté : JPG, PNG ou WebP.' }, 400);
    }

    const intent = await createPresignedUploadUrl(
      { originalName: payload.fileName, mimeType: payload.mimeType, size: payload.size },
      { folder: `ai-community/${user.id}/${payload.purpose}` },
    );

    return radioJson({
      uploadUrl: intent.uploadUrl,
      file: { url: intent.url, storageKey: intent.storageKey, mimeType: intent.mimeType, size: intent.size },
    });
  } catch (error) {
    return radioError(error);
  }
}
