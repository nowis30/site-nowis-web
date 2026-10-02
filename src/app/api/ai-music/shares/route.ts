import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { consumeContactRateLimit } from '@/lib/contact-rate-limit';
import { getRadioUser, radioError, RadioHttpError, radioIpHash, radioJson, readRadioJson } from '@/lib/radio-api';

export const dynamic = 'force-dynamic';

const httpsUrl = z
  .string()
  .trim()
  .url('Ajoutez un lien valide vers votre chanson.')
  .max(1000, 'Le lien est trop long.')
  .refine((value) => {
    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Le lien doit commencer par https://');

const shareSchema = z.object({
  artistName: z.string().trim().min(2, 'Indiquez votre nom d’artiste ou votre pseudo.').max(80),
  title: z.string().trim().min(2, 'Indiquez le titre de la chanson.').max(120),
  aiTool: z.string().trim().min(2, 'Indiquez l’outil IA utilisé.').max(80),
  genre: z.string().trim().max(80).nullable().optional(),
  listenUrl: httpsUrl,
  coverUrl: httpsUrl.nullable().optional(),
  description: z.string().trim().max(800).nullable().optional(),
  rightsConfirmed: z.boolean().refine(Boolean, 'Vous devez confirmer que vous avez le droit de partager cette création.'),
  website: z.string().max(0).optional(),
}).strict();

async function listPublicShares(userId?: string) {
  const shares = await prisma.aiMusicShare.findMany({
    where: { isPublished: true, rightsConfirmed: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 60,
    select: {
      id: true,
      artistName: true,
      title: true,
      aiTool: true,
      genre: true,
      listenUrl: true,
      coverUrl: true,
      description: true,
      createdAt: true,
      artistProfile: {
        select: {
          slug: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      _count: { select: { likes: true, comments: true } },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, displayName: true, message: true, createdAt: true },
      },
    },
  });

  const likedIds = userId && shares.length
    ? new Set((await prisma.aiMusicLike.findMany({
        where: { userId, shareId: { in: shares.map((share) => share.id) } },
        select: { shareId: true },
      })).map((like) => like.shareId))
    : new Set<string>();

  return shares.map((share) => ({
    id: share.id,
    artistName: share.artistName,
    title: share.title,
    aiTool: share.aiTool,
    genre: share.genre,
    listenUrl: share.listenUrl,
    coverUrl: share.coverUrl,
    description: share.description,
    createdAt: share.createdAt,
    artistProfile: share.artistProfile,
    likesCount: share._count.likes,
    commentsCount: share._count.comments,
    likedByMe: likedIds.has(share.id),
    comments: share.comments,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const user = await getRadioUser(request);
    return radioJson({ shares: await listPublicShares(user?.id) });
  } catch (error) {
    return radioError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = shareSchema.parse(await readRadioJson(request));
    const user = await getRadioUser(request);
    const profile = user
      ? await prisma.aiArtistProfile.findUnique({ where: { userId: user.id }, select: { id: true, displayName: true, slug: true, avatarUrl: true } })
      : null;

    const rateLimit = await consumeContactRateLimit({
      scope: 'ai-music:share',
      identifier: user?.id || radioIpHash(request),
      max: 3,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      throw new RadioHttpError(
        429,
        'Vous avez publié plusieurs créations récemment. Réessayez dans quelques minutes.',
        rateLimit.retryAfterSeconds,
      );
    }

    const share = await prisma.aiMusicShare.create({
      data: {
        artistName: profile?.displayName || payload.artistName,
        artistProfileId: profile?.id || null,
        title: payload.title,
        aiTool: payload.aiTool,
        genre: payload.genre || null,
        listenUrl: payload.listenUrl,
        coverUrl: payload.coverUrl || null,
        description: payload.description || null,
        rightsConfirmed: true,
        isPublished: true,
        ipHash: radioIpHash(request),
      },
      select: {
        id: true,
        artistName: true,
        title: true,
        aiTool: true,
        genre: true,
        listenUrl: true,
        coverUrl: true,
        description: true,
        createdAt: true,
      },
    });

    return radioJson({
      share: {
        ...share,
        artistProfile: profile ? { slug: profile.slug, displayName: profile.displayName, avatarUrl: profile.avatarUrl } : null,
        likesCount: 0,
        commentsCount: 0,
        likedByMe: false,
        comments: [],
      },
    }, 201);
  } catch (error) {
    return radioError(error);
  }
}
