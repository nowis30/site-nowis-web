import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { maintenanceInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';
import { sendMaintenanceAlertEmail } from '@/lib/email-service';

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'maintenance', 'read');
  if (guard.error) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const items = await prisma.maintenanceTicket.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { property: { name: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : undefined,
    include: {
      property: { select: { id: true, name: true } },
      unit: { select: { id: true, unitNumber: true } },
      tenant: { select: { id: true, contact: { select: { fullName: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'maintenance', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = maintenanceInputSchema.parse(await request.json());
    const item = await prisma.maintenanceTicket.create({
      data: {
        propertyId: payload.propertyId,
        unitId: normalizeOptionalString(payload.unitId),
        tenantId: normalizeOptionalString(payload.tenantId),
        title: payload.title.trim(),
        description: normalizeOptionalString(payload.description),
        priority: payload.priority,
        status: payload.status,
        reportedByUserId: guard.session.sub,
      },
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, unitNumber: true } },
        tenant: { select: { id: true, contact: { select: { fullName: true, email: true } } } },
      },
    });

    // Envoyer alerte maintenance si tenant a email
    if (item.tenant?.contact?.email && (item.priority === 'HIGH' || item.priority === 'URGENT')) {
      await sendMaintenanceAlertEmail(item.title, item.tenant.contact.email, item.priority);
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}
