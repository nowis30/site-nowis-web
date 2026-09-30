import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getRadioUser, limitRadio, radioError, RadioHttpError, radioJson, radioTrackIdSchema, readRadioJson } from '@/lib/radio-api';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const user = await getRadioUser(request);
    if (!user) return radioJson({ user: null, trackIds: [] });
    const favorites = await prisma.radioFavorite.findMany({ where: { userId: user.id }, orderBy: [{ createdAt: 'asc' }, { trackId: 'asc' }], select: { trackId: true } });
    return radioJson({ user: { id: user.id, displayName: user.fullName }, trackIds: favorites.map(item => item.trackId) });
  } catch (error) { return radioError(error); }
}
async function mutate(request: NextRequest, remove: boolean) {
  try {
    const { trackId } = z.object({ trackId: radioTrackIdSchema }).strict().parse(await readRadioJson(request));
    const user = await getRadioUser(request);
    if (!user) throw new RadioHttpError(401, 'Connectez-vous pour enregistrer vos favoris.');
    await limitRadio(request, 'radio:favorite', user.id);
    if (remove) await prisma.radioFavorite.deleteMany({ where: { userId: user.id, trackId } });
    else await prisma.radioFavorite.upsert({ where: { userId_trackId: { userId: user.id, trackId } }, create: { userId: user.id, trackId }, update: {} });
    return radioJson({ ok: true });
  } catch (error) { return radioError(error); }
}
export const PUT = (request: NextRequest) => mutate(request, false);
export const DELETE = (request: NextRequest) => mutate(request, true);
