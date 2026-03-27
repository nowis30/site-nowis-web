import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'dashboard', 'read');
  if (guard.error) return guard.error;

  const [contacts, openCases, properties, units, activeTenants, openMaintenance] = await Promise.all([
    prisma.contact.count(),
    prisma.caseRecord.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD'] } } }),
    prisma.property.count(),
    prisma.unit.count(),
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.maintenanceTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
  ]);

  return NextResponse.json({
    kpis: {
      contacts,
      openCases,
      properties,
      units,
      activeTenants,
      openMaintenance,
    },
  });
}
