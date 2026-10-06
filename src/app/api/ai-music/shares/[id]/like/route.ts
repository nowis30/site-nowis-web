import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getRadioUser, radioError, radioJson } from '@/lib/radio-api';

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const shareId = z.string().uuid().parse(params.id);
    const user = await getRadioUser(request);
    if (!user) return radioJson({ message: 'Connectez-vous pour aimer une chanson.' }, 401);

    const share = await prisma.aiMusicShare.findFirst({ where: { id: shareId, isPublished: true }, select: { id: true } });
    if (!share) return radioJson({ message: 'Cette création est introuvable.' }, 404);

    const existing = await prisma.aiMusicLike.findUnique({ where: { shareId_userId: { shareId, userId: user.id } } });
    if (existing) {
      await prisma.aiMusicLike.delete({ where: { shareId_userId: { shareId, userId: user.id } } });
    } else {
      await prisma.aiMusicLike.create({ data: { shareId, userId: user.id } });
    }

    const likesCount = await prisma.aiMusicLike.count({ where: { shareId } });
    return radioJson({ liked: !existing, likesCount });
  } catch (error) {
    return radioError(error);
  }
}
