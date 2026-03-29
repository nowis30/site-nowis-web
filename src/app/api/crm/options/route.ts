import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'dashboard', 'read');
  if (guard.error) return guard.error;

  try {
    const [contacts, organizations, organizationContacts] = await Promise.all([
      prisma.contact.findMany({
        orderBy: { fullName: 'asc' },
        select: { id: true, fullName: true, type: true },
      }),
      prisma.organization.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, type: true },
      }).catch(() => []),
      prisma.organizationContact.findMany({
        orderBy: { fullName: 'asc' },
        select: { id: true, fullName: true, organization: { select: { name: true } } },
      }).catch(() => []),
    ]);

    return NextResponse.json({
      contacts,
      properties: [],
      units: [],
      tenants: [],
      organizations,
      organizationContacts: organizationContacts.map((item) => ({
        id: item.id,
        fullName: `${item.fullName}${item.organization?.name ? ` · ${item.organization.name}` : ''}`,
      })),
    });
  } catch (error) {
    console.error('[CRM_OPTIONS_GET]', error);
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { contacts: [], properties: [], units: [], tenants: [], organizations: [], organizationContacts: [], dbUnavailable: true },
        { status: 200 },
      );
    }
    return NextResponse.json({ error: 'Impossible de charger les options CRM' }, { status: 500 });
  }
}
