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

  const [contacts, cases, properties, units, tenants, maintenance, songRequests] = await Promise.all([
    prisma.contact.findMany({
      where: { fullName: { contains: query, mode: 'insensitive' } },
      take: 5,
      select: { id: true, fullName: true },
    }),
    prisma.caseRecord.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
      take: 5,
      select: { id: true, title: true },
    }),
    prisma.property.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      take: 5,
      select: { id: true, name: true },
    }),
    prisma.unit.findMany({
      where: { unitNumber: { contains: query, mode: 'insensitive' } },
      take: 5,
      select: { id: true, unitNumber: true },
    }),
    prisma.tenant.findMany({
      where: { contact: { fullName: { contains: query, mode: 'insensitive' } } },
      take: 5,
      select: { id: true, contact: { select: { fullName: true } } },
    }),
    prisma.maintenanceTicket.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
      take: 5,
      select: { id: true, title: true },
    }),
    prisma.songRequest.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { occasion: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: { id: true, fullName: true },
    }),
  ]);

  const items = [
    ...contacts.map((item) => ({ label: `Contact · ${item.fullName}`, href: '/crm/contacts' })),
    ...cases.map((item) => ({ label: `Dossier · ${item.title}`, href: '/crm/cases' })),
    ...properties.map((item) => ({ label: `Immeuble · ${item.name}`, href: '/crm/properties' })),
    ...units.map((item) => ({ label: `Logement · ${item.unitNumber}`, href: '/crm/units' })),
    ...tenants.map((item) => ({ label: `Locataire · ${item.contact.fullName}`, href: '/crm/tenants' })),
    ...maintenance.map((item) => ({ label: `Maintenance · ${item.title}`, href: '/crm/maintenance' })),
    ...songRequests.map((item) => ({ label: `Demande chanson · ${item.fullName}`, href: `/crm/song-requests/${item.id}` })),
  ].slice(0, 15);

  return NextResponse.json({ items });
}
