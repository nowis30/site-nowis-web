import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getRadioUser, radioError, radioJson, readRadioJson } from '@/lib/radio-api';

const httpsUrl = z.string().trim().url().max(1200).refine((value) => new URL(value).protocol === 'https:', 'Le lien doit utiliser HTTPS.');

const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Indiquez un nom d’artiste.').max(80),
  bio: z.string().trim().max(600).nullable().optional(),
  avatarUrl: httpsUrl.nullable().optional(),
  bannerUrl: httpsUrl.nullable().optional(),
}).strict();

function makeSlug(displayName: string) {
  const base = displayName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'artiste';
  return `${base}-${randomUUID().slice(0, 6)}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getRadioUser(request);
    if (!user) return radioJson({ authenticated: false, user: null, profile: null });

    const profile = await prisma.aiArtistProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        slug: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        bannerUrl: true,
        _count: { select: { shares: true } },
      },
    });

    return radioJson({ authenticated: true, user, profile });
  } catch (error) {
    return radioError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getRadioUser(request);
    if (!user) return radioJson({ message: 'Connectez-vous pour créer votre profil d’artiste.' }, 401);

    const payload = profileSchema.parse(await readRadioJson(request));
    const existing = await prisma.aiArtistProfile.findUnique({ where: { userId: user.id }, select: { id: true, slug: true } });

    const profile = existing
      ? await prisma.aiArtistProfile.update({
          where: { id: existing.id },
          data: {
            displayName: payload.displayName,
            bio: payload.bio || null,
            avatarUrl: payload.avatarUrl || null,
            bannerUrl: payload.bannerUrl || null,
          },
          select: { id: true, slug: true, displayName: true, bio: true, avatarUrl: true, bannerUrl: true },
        })
      : await prisma.aiArtistProfile.create({
          data: {
            userId: user.id,
            slug: makeSlug(payload.displayName),
            displayName: payload.displayName,
            bio: payload.bio || null,
            avatarUrl: payload.avatarUrl || null,
            bannerUrl: payload.bannerUrl || null,
          },
          select: { id: true, slug: true, displayName: true, bio: true, avatarUrl: true, bannerUrl: true },
        });

    return radioJson({ profile });
  } catch (error) {
    return radioError(error);
  }
}
