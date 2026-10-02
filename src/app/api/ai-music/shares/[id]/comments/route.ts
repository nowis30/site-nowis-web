import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { consumeContactRateLimit } from '@/lib/contact-rate-limit';
import { getRadioUser, radioError, radioJson, readRadioJson } from '@/lib/radio-api';

const schema = z.object({
  message: z.string().trim().min(2, 'Écrivez au moins quelques mots.').max(500),
}).strict();

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const shareId = z.string().uuid().parse(params.id);
    const user = await getRadioUser(request);
    if (!user) return radioJson({ message: 'Connectez-vous pour commenter.' }, 401);

    const payload = schema.parse(await readRadioJson(request));
    const share = await prisma.aiMusicShare.findFirst({ where: { id: shareId, isPublished: true }, select: { id: true } });
    if (!share) return radioJson({ message: 'Cette création est introuvable.' }, 404);

    const rateLimit = await consumeContactRateLimit({
      scope: 'ai-music:comment',
      identifier: user.id,
      max: 8,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.allowed) return radioJson({ message: 'Trop de commentaires envoyés. Réessayez un peu plus tard.' }, 429);

    const profile = await prisma.aiArtistProfile.findUnique({ where: { userId: user.id }, select: { displayName: true } });
    const comment = await prisma.aiMusicComment.create({
      data: {
        shareId,
        userId: user.id,
        displayName: profile?.displayName || user.fullName,
        message: payload.message,
      },
      select: { id: true, displayName: true, message: true, createdAt: true },
    });
    const commentsCount = await prisma.aiMusicComment.count({ where: { shareId } });

    return radioJson({ comment, commentsCount }, 201);
  } catch (error) {
    return radioError(error);
  }
}
