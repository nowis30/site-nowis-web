import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'dashboard', 'read');
  if (guard.error) return guard.error;

  const [contacts, properties, units, tenants] = await Promise.all([
    prisma.contact.findMany({
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true, type: true },
    }),
    prisma.property.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    }),
    prisma.unit.findMany({
      orderBy: { unitNumber: 'asc' },
      select: { id: true, unitNumber: true, propertyId: true, property: { select: { name: true } } },
    }),
    prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, contact: { select: { fullName: true } } },
    }),
  ]);

  return NextResponse.json({
    contacts,
    properties,
    units,
    tenants: tenants.map((tenant) => ({ id: tenant.id, fullName: tenant.contact.fullName })),
  });
}
