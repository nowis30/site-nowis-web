import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

export async function GET(request: NextRequest) {
  const { error } = requireApiPermission(request, 'reviews', 'read');
  if (error) return error;

  const comments = await prisma.publicComment.findMany({
    orderBy: [{ createdAt: 'desc' }],
    select: {
      id: true,
      displayName: true,
      email: true,
      message: true,
      rating: true,
      status: true,
      sourcePage: true,
      approvedAt: true,
      rejectedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ comments });
}
