import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { logCleanupActivity } from '@/lib/cleanup-actions';
import { z } from 'zod';

const bodySchema = z.object({ reason: z.string().optional() });

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'songRequests', 'update');
  if (guard.error) return guard.error;

  const body = bodySchema.safeParse(await request.json().catch(() => ({})));

  const item = await prisma.songRequest.findUnique({
    where: { id: params.id },
    select: { id: true, fullName: true, deletedAt: true, contactId: true },
  });
  if (!item) return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 });
  if (item.deletedAt) return NextResponse.json({ error: 'Demande déjà supprimée.' }, { status: 409 });

  const updated = await prisma.songRequest.update({
    where: { id: params.id },
    data: {
      isTest: true,
      testReason: body.success ? (body.data.reason ?? null) : null,
      archivedAt: null,
      restoredAt: null,
    },
  });

  await logCleanupActivity({
    action: 'MARK_TEST',
    module: 'SONG_REQUEST',
    itemId: item.id,
    itemLabel: item.fullName,
    userId: guard.session.sub,
    reason: body.success ? body.data.reason : undefined,
    contactId: item.contactId,
  });

  return NextResponse.json({ item: updated });
}
