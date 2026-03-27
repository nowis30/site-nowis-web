import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionServer } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { isPortalNotificationChannel } from '@/lib/portal-notifications';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCrmSessionServer();
  if (!session) {
    return NextResponse.json({ error: 'Session CRM invalide' }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as { handled?: boolean };
    if (typeof payload.handled !== 'boolean') {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const communication = await prisma.communication.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        channel: true,
        direction: true,
        contactId: true,
        linkedType: true,
        linkedId: true,
        subject: true,
      },
    });

    if (!communication || communication.direction !== 'INBOUND' || !isPortalNotificationChannel(communication.channel)) {
      return NextResponse.json({ error: 'Notification introuvable' }, { status: 404 });
    }

    const updated = await prisma.communication.update({
      where: { id: params.id },
      data: {
        handledAt: payload.handled ? new Date() : null,
        handledById: payload.handled ? session.sub : null,
      },
      select: {
        id: true,
        handledAt: true,
        handledById: true,
      },
    });

    await prisma.activity.create({
      data: {
        type: 'NOTE',
        title: payload.handled
          ? `Notification traitée : ${communication.subject || communication.linkedType}`
          : `Notification rouverte : ${communication.subject || communication.linkedType}`,
        description: payload.handled
          ? 'Élément portail marqué comme traité depuis le centre de notifications.'
          : 'Élément portail remis à traiter depuis le centre de notifications.',
        contactId: communication.contactId,
        userId: session.sub,
      },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error('[CRM_NOTIFICATION_UPDATE]', error);
    return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 500 });
  }
}