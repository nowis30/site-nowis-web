import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

const ALLOWED_STATUSES = new Set(['NOUVEAU', 'LU', 'TRAITE', 'ARCHIVE', 'SUPPRIME']);

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'activities', 'read');
  if (guard.error) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const statusParam = request.nextUrl.searchParams.get('status')?.trim().toUpperCase();
  const status = statusParam && ALLOWED_STATUSES.has(statusParam) ? statusParam : null;

  const where = {
    ...(status ? { submissionStatus: status as 'NOUVEAU' | 'LU' | 'TRAITE' | 'ARCHIVE' | 'SUPPRIME' } : { submissionStatus: { not: 'SUPPRIME' as const } }),
    ...(q
      ? {
          OR: [
            { subject: { contains: q, mode: 'insensitive' as const } },
            { message: { contains: q, mode: 'insensitive' as const } },
            { contact: { fullName: { contains: q, mode: 'insensitive' as const } } },
            { contact: { email: { contains: q, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };

  const items = await prisma.inquiry.findMany({
    where,
    include: {
      contact: { select: { id: true, fullName: true, email: true, phone: true } },
    },
    orderBy: [{ receivedAt: 'desc' }],
    take: 200,
  });

  return NextResponse.json({ items });
}
