import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'dashboard', 'read');
  if (guard.error) return guard.error;

  const query = request.nextUrl.searchParams.get('q')?.trim() || '';
  if (query.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const [contacts, cases, songRequests, submissions] = await Promise.all([
    prisma.contact.findMany({
      where: {
        crmStatus: { not: 'DELETED' },
        fullName: { contains: query, mode: 'insensitive' },
      },
      take: 5,
      select: { id: true, fullName: true },
    }),
    prisma.caseRecord.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
      take: 5,
      select: { id: true, title: true },
    }),
    prisma.songRequest.findMany({
      where: {
        status: { not: 'DELETED' },
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { occasion: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: { id: true, fullName: true },
    }),
    prisma.inquiry.findMany({
      where: {
        submissionStatus: { not: 'SUPPRIME' },
        OR: [
          { subject: { contains: query, mode: 'insensitive' } },
          { message: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: { id: true, subject: true },
    }),
  ]);

  const items = [
    ...contacts.map((item) => ({ label: `Contact · ${item.fullName}`, href: '/crm/contacts' })),
    ...cases.map((item) => ({ label: `Dossier · ${item.title}`, href: '/crm/cases' })),
    ...songRequests.map((item) => ({ label: `Demande chanson · ${item.fullName}`, href: `/crm/song-requests/${item.id}` })),
    ...submissions.map((item) => ({ label: `Soumission · ${item.subject}`, href: `/crm/submissions?focus=${item.id}` })),
  ].slice(0, 15);

  return NextResponse.json({ items });
}
