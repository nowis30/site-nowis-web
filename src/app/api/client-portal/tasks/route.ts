import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyClientPortalToken } from '@/lib/client-portal';
import { sendPortalEventNotificationEmail } from '@/lib/email-service';

const clientTaskSchema = z.object({
  token: z.string().trim().min(1),
  songRequestId: z.string().uuid(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  dueDate: z.string().trim().optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  try {
    const payload = clientTaskSchema.parse(await request.json());
    const session = verifyClientPortalToken(payload.token);

    if (!session) {
      return NextResponse.json({ error: 'Lien client invalide' }, { status: 401 });
    }

    const songRequest = await prisma.songRequest.findFirst({
      where: {
        id: payload.songRequestId,
        contactId: session.contactId,
      },
      select: {
        id: true,
        contactId: true,
        fullName: true,
        songType: true,
        occasion: true,
      },
    });

    if (!songRequest) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    const dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
    if (payload.dueDate && (!dueDate || Number.isNaN(dueDate.getTime()))) {
      return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
    }

    const item = await prisma.task.create({
      data: {
        title: payload.title,
        description: payload.description?.trim() ? payload.description.trim() : 'Tâche créée depuis le portail client.',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate,
        songRequestId: songRequest.id,
        linkedType: 'SONG_REQUEST',
        linkedId: songRequest.id,
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
        title: `Nouvelle tâche demandée par le client : ${payload.title}`,
        description: payload.description?.trim()
          ? payload.description.trim()
          : `Tâche créée par ${songRequest.fullName} depuis le portail client pour ${songRequest.songType} / ${songRequest.occasion}.`,
        contactId: songRequest.contactId,
        songRequestId: songRequest.id,
      },
    });

    await prisma.communication.create({
      data: {
        contactId: songRequest.contactId,
        channel: 'portal-task',
        subject: payload.title,
        body: payload.description?.trim() || 'Tâche créée depuis le portail client.',
        direction: 'INBOUND',
        linkedType: 'SONG_REQUEST',
        linkedId: songRequest.id,
      },
    });

    await sendPortalEventNotificationEmail({
      eventLabel: 'Portail client',
      subject: `Nouvelle tâche client : ${payload.title}`,
      headline: payload.title,
      lines: [
        `Client: ${songRequest.fullName}`,
        `Email: ${session.email}`,
        `Demande: ${songRequest.songType} / ${songRequest.occasion}`,
        payload.description?.trim() || 'Aucune description fournie.',
      ],
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    console.error('[CLIENT_PORTAL_TASK_CREATE]', error);
    return NextResponse.json({ error: 'Création de la tâche impossible' }, { status: 500 });
  }
}