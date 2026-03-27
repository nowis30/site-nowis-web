import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyTenantPortalToken } from '@/lib/client-portal';
import { sendPortalEventNotificationEmail } from '@/lib/email-service';

const tenantMaintenanceSchema = z.object({
  token: z.string().trim().min(1),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export async function POST(request: NextRequest) {
  try {
    const payload = tenantMaintenanceSchema.parse(await request.json());
    const session = verifyTenantPortalToken(payload.token);

    if (!session) {
      return NextResponse.json({ error: 'Lien locataire invalide' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { id: session.tenantId, contactId: session.contactId },
      select: { id: true, unitId: true, contactId: true, unit: { select: { propertyId: true } } },
    });

    if (!tenant || !tenant.unit || !tenant.unitId) {
      return NextResponse.json({ error: 'Aucun logement associe au locataire' }, { status: 400 });
    }

    const item = await prisma.maintenanceTicket.create({
      data: {
        propertyId: tenant.unit.propertyId,
        unitId: tenant.unitId,
        tenantId: tenant.id,
        title: payload.title,
        description: payload.description?.trim() || null,
        priority: payload.priority,
        status: 'OPEN',
      },
      select: { id: true },
    });

    await prisma.activity.create({
      data: {
        type: 'NOTE',
        title: `Demande de maintenance locataire : ${payload.title}`,
        description: payload.description?.trim() || 'Demande creee depuis le portail locataire.',
        contactId: tenant.contactId,
      },
    });

    await prisma.communication.create({
      data: {
        contactId: tenant.contactId,
        tenantId: tenant.id,
        channel: 'portal-maintenance',
        subject: payload.title,
        body: payload.description?.trim() || 'Demande creee depuis le portail locataire.',
        direction: 'INBOUND',
        linkedType: 'MAINTENANCE_TICKET',
        linkedId: item.id,
      },
    });

    await sendPortalEventNotificationEmail({
      eventLabel: 'Portail locataire',
      subject: `Nouvelle maintenance : ${payload.title}`,
      headline: payload.title,
      lines: [
        `Locataire: ${session.fullName}`,
        `Email: ${session.email}`,
        `Priorité: ${payload.priority}`,
        payload.description?.trim() || 'Aucune description fournie.',
      ],
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    console.error('[TENANT_PORTAL_MAINTENANCE_CREATE]', error);
    return NextResponse.json({ error: 'Création de la demande impossible' }, { status: 500 });
  }
}