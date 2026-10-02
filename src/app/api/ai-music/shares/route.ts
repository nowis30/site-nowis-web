import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { consumeContactRateLimit } from '@/lib/contact-rate-limit';
import { radioError, RadioHttpError, radioIpHash, radioJson, readRadioJson } from '@/lib/radio-api';

export const dynamic = 'force-dynamic';

const publicShareSelect = {
  id: true,
  artistName: true,
  title: true,
  aiTool: true,
  genre: true,
  listenUrl: true,
  description: true,
  createdAt: true,
} as const;

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
  description: z.string().trim().max(800).nullable().optional(),
  rightsConfirmed: z.boolean().refine(Boolean, 'Vous devez confirmer que vous avez le droit de partager cette création.'),
  website: z.string().max(0).optional(),
}).strict();

export async function GET() {
  try {
    const shares = await prisma.aiMusicShare.findMany({
      where: { isPublished: true, rightsConfirmed: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 60,
      select: publicShareSelect,
    });

    return radioJson({ shares });
  } catch (error) {
    return radioError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = shareSchema.parse(await readRadioJson(request));
    const rateLimit = await consumeContactRateLimit({
      scope: 'ai-music:share',
      identifier: radioIpHash(request),
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
        artistName: payload.artistName,
        title: payload.title,
        aiTool: payload.aiTool,
        genre: payload.genre || null,
        listenUrl: payload.listenUrl,
        description: payload.description || null,
        rightsConfirmed: true,
        isPublished: true,
        ipHash: radioIpHash(request),
      },
      select: publicShareSelect,
    });

    return radioJson({ share }, 201);
  } catch (error) {
    return radioError(error);
  }
}
