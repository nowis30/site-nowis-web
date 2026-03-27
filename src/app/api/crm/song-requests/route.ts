import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { crmSongRequestListQuerySchema } from '@/lib/validators/song-request';

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'songRequests', 'read');
  if (guard.error) return guard.error;

  const parsed = crmSongRequestListQuerySchema.parse({
    q: request.nextUrl.searchParams.get('q') ?? '',
    status: request.nextUrl.searchParams.get('status') ?? '',
  });

  const q = parsed.q?.trim();
  const status = parsed.status || undefined;

  const items = await prisma.songRequest.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { occasion: { contains: q, mode: 'insensitive' } },
              { recipientName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
    },
    include: {
      contact: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({ items });
}
