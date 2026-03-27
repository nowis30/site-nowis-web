import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyTenantPortalToken } from '@/lib/client-portal';
import { sendPortalEventNotificationEmail } from '@/lib/email-service';

const tenantTaskSchema = z.object({
  token: z.string().trim().min(1),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  dueDate: z.string().trim().optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  try {
    const payload = tenantTaskSchema.parse(await request.json());
    const session = verifyTenantPortalToken(payload.token);

    if (!session) {
      return NextResponse.json({ error: 'Lien locataire invalide' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: {
        id: session.tenantId,
        contactId: session.contactId,
      },
      select: {
        id: true,
        contactId: true,
        contact: { select: { fullName: true } },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Locataire introuvable' }, { status: 404 });
    }

    const dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
    if (payload.dueDate && (!dueDate || Number.isNaN(dueDate.getTime()))) {
      return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
    }

    const item = await prisma.task.create({
      data: {
        title: payload.title,
        description: payload.description?.trim() ? payload.description.trim() : 'Tâche créée depuis le portail locataire.',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate,
        linkedType: 'TENANT',
        linkedId: tenant.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
      },
    });

    await prisma.activity.create({
      data: {
        type: 'TASK',
        title: `Nouvelle tâche demandée par le locataire : ${payload.title}`,
        description: payload.description?.trim()
          ? payload.description.trim()
          : `Tâche créée par ${tenant.contact.fullName} depuis le portail locataire.`,
        contactId: tenant.contactId,
      },
    });

    await prisma.communication.create({
      data: {
        contactId: tenant.contactId,
        tenantId: tenant.id,
        channel: 'portal-task',
        subject: payload.title,
        body: payload.description?.trim() || 'Tâche créée depuis le portail locataire.',
        direction: 'INBOUND',
        linkedType: 'TENANT',
        linkedId: tenant.id,
      },
    });

    await sendPortalEventNotificationEmail({
      eventLabel: 'Portail locataire',
      subject: `Nouvelle tâche locataire : ${payload.title}`,
      headline: payload.title,
      lines: [
        `Locataire: ${tenant.contact.fullName}`,
        `Email: ${session.email}`,
        payload.description?.trim() || 'Aucune description fournie.',
      ],
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    console.error('[TENANT_PORTAL_TASK_CREATE]', error);
    return NextResponse.json({ error: 'Création de la tâche impossible' }, { status: 500 });
  }
}