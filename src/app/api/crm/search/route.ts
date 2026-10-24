import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission(request, 'dashboard', 'read');
  if (guard.error) return guard.error;

  const query = (request.nextUrl.searchParams.get('q')?.trim() || '').slice(0, 80);
  if (query.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const contains = { contains: query, mode: 'insensitive' as const };
  const [contacts, organizations, cases, songRequests, workshopRequests, invoices, submissions] = await Promise.all([
    prisma.contact.findMany({
      where: {
        crmStatus: { not: 'DELETED' },
        OR: [
          { fullName: contains },
          { email: contains },
          { phone: contains },
        ],
      },
      take: 5,
      select: { id: true, fullName: true, email: true },
    }),
    prisma.organization.findMany({
      where: { deletedAt: null, name: contains },
      take: 4,
      select: { id: true, name: true },
    }),
    prisma.caseRecord.findMany({
      where: { title: contains },
      take: 4,
      select: { id: true, title: true },
    }),
    prisma.songRequest.findMany({
      where: {
        deletedAt: null,
        status: { not: 'DELETED' },
        OR: [
          { fullName: contains },
          { email: contains },
          { occasion: contains },
          { title: contains },
        ],
      },
      take: 4,
      select: { id: true, fullName: true, title: true },
    }),
    prisma.workshopRequest.findMany({
      where: {
        deletedAt: null,
        status: { not: 'DELETED' },
        OR: [
          { title: contains },
          { organizationName: contains },
          { contactPerson: contains },
          { contactEmail: contains },
        ],
      },
      take: 4,
      select: { id: true, title: true },
    }),
    prisma.invoice.findMany({
      where: {
        deletedAt: null,
        OR: [
          { number: contains },
          { contact: { fullName: contains } },
        ],
      },
      take: 4,
      select: { id: true, number: true, contact: { select: { fullName: true } } },
    }),
    prisma.inquiry.findMany({
      where: {
        deletedAt: null,
        submissionStatus: { not: 'SUPPRIME' },
        OR: [
          { subject: contains },
          { message: contains },
        ],
      },
      take: 4,
      select: { id: true, subject: true },
    }),
  ]);

  const items = [
    ...contacts.map((item) => ({ label: `Contact · ${item.fullName}${item.email ? ` · ${item.email}` : ''}`, href: `/crm/contacts/${item.id}` })),
    ...organizations.map((item) => ({ label: `Organisation · ${item.name}`, href: `/crm/organizations/${item.id}` })),
    ...cases.map((item) => ({ label: `Dossier · ${item.title}`, href: `/crm/cases/${item.id}` })),
    ...songRequests.map((item) => ({ label: `Demande chanson · ${item.title || item.fullName}`, href: `/crm/song-requests/${item.id}` })),
    ...workshopRequests.map((item) => ({ label: `Atelier · ${item.title}`, href: `/crm/workshop-requests/${item.id}` })),
    ...invoices.map((item) => ({ label: `Facture · ${item.number}${item.contact?.fullName ? ` · ${item.contact.fullName}` : ''}`, href: `/crm/invoices/${item.id}` })),
    ...submissions.map((item) => ({ label: `Soumission · ${item.subject}`, href: `/crm/submissions?focus=${item.id}` })),
  ].slice(0, 15);

  return NextResponse.json({ items });
}
