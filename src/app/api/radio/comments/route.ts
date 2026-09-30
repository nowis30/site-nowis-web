import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { limitRadio, radioError, RadioHttpError, radioIpHash, radioJson, radioTrackIdSchema, readRadioJson } from '@/lib/radio-api';

export const dynamic = 'force-dynamic';
const select = { id: true, displayName: true, message: true, radioTrackId: true, createdAt: true } as const;
const cursorSchema = z.object({ id: z.string().uuid(), date: z.string().datetime() });
export async function GET(request: NextRequest) {
  try {
    let cursor: z.infer<typeof cursorSchema> | null = null;
    const raw = request.nextUrl.searchParams.get('cursor');
    if (raw) {
      try {
        if (raw.length > 256) throw new Error();
        cursor = cursorSchema.parse(JSON.parse(Buffer.from(raw, 'base64url').toString()));
      } catch { throw new RadioHttpError(400, 'La page de commentaires demandée est invalide.'); }
    }
    const rows = await prisma.publicComment.findMany({
      where: { sourcePage: '/radio', status: 'APPROVED', ...(cursor ? { OR: [
        { createdAt: { lt: new Date(cursor.date) } }, { createdAt: new Date(cursor.date), id: { lt: cursor.id } },
      ] } : {}) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 6, select,
    });
    const comments = rows.slice(0, 5);
    const last = comments[comments.length - 1];
    return radioJson({ comments, nextCursor: rows.length > 5 && last
      ? Buffer.from(JSON.stringify({ id: last.id, date: last.createdAt.toISOString() })).toString('base64url') : null });
  } catch (error) { return radioError(error); }
}
export async function POST(request: NextRequest) {
  try {
    const payload = z.object({
      displayName: z.string().trim().min(2, 'Indiquez votre prénom ou pseudo.').max(80),
      message: z.string().trim().min(3, 'Écrivez quelques mots sur la musique.').max(1200),
      radioTrackId: radioTrackIdSchema.nullable(),
      website: z.string().max(0).optional(),
    }).strict().parse(await readRadioJson(request));
    await limitRadio(request, 'radio:comment');
    const comment = await prisma.publicComment.create({ data: { displayName: payload.displayName, message: payload.message,
      radioTrackId: payload.radioTrackId, sourcePage: '/radio', status: 'APPROVED', approvedAt: new Date(), ipHash: radioIpHash(request) }, select });
    return radioJson({ comment }, 201);
  } catch (error) { return radioError(error); }
}
