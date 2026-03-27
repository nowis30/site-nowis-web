import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { prisma } from '@/lib/prisma';

const baseSchema = z.object({
  action: z.enum(['note', 'task', 'invoice', 'appointment', 'lease', 'song-request']),
  title: z.string().trim().max(200).optional(),
  description: z.string().trim().max(4000).optional(),
  songTitle: z.string().trim().max(160).optional(),
  songType: z.string().trim().max(80).optional(),
  eventType: z.string().trim().max(120).optional(),
  recipientName: z.string().trim().max(160).optional(),
  style: z.string().trim().max(120).optional(),
  mood: z.string().trim().max(120).optional(),
  language: z.string().trim().max(80).optional(),
  theme: z.string().trim().max(120).optional(),
  songBudget: z.coerce.number().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  number: z.string().trim().max(80).optional(),
  amount: z.coerce.number().optional(),
  dueDateInvoice: z.string().datetime().optional(),
  appointmentStart: z.string().datetime().optional(),
  appointmentEnd: z.string().datetime().optional(),
  appointmentType: z.enum(['VISIT', 'CALL', 'FOLLOWUP', 'MEETING', 'INSPECTION', 'DEADLINE', 'REMINDER']).optional(),
  propertyId: z.string().uuid().optional().or(z.literal('')),
  leaseNumber: z.string().trim().max(80).optional(),
  leaseStart: z.string().datetime().optional(),
  leaseEnd: z.string().datetime().optional(),
  rentAmount: z.coerce.number().optional(),
  securityDeposit: z.coerce.number().optional(),
  frequency: z.string().trim().max(40).optional(),
  leaseStatus: z.enum(['DRAFT', 'ACTIVE', 'ENDED', 'TERMINATED']).optional(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'contacts', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = baseSchema.parse(await request.json());
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: { tenantProfile: { select: { id: true, unitId: true } } },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
    }

    if (payload.action === 'note') {
      if (!payload.title || payload.title.trim().length < 2) {
        return NextResponse.json({ error: 'Titre requis' }, { status: 400 });
      }
      const item = await prisma.activity.create({
        data: {
          type: 'NOTE',
          title: payload.title.trim(),
          description: payload.description?.trim() || null,
          contactId: contact.id,
          userId: guard.session.sub,
        },
      });
      return NextResponse.json({ item }, { status: 201 });
    }

    if (payload.action === 'task') {
      if (!payload.title || payload.title.trim().length < 2) {
        return NextResponse.json({ error: 'Titre requis' }, { status: 400 });
      }
      const task = await prisma.task.create({
        data: {
          title: payload.title.trim(),
          description: payload.description?.trim() || null,
          status: 'TODO',
          priority: payload.priority || 'MEDIUM',
          dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
          linkedType: 'CONTACT',
          linkedId: contact.id,
          createdById: guard.session.sub,
        },
      });
      await prisma.activity.create({
        data: {
          type: 'TASK',
          title: `Tâche créée: ${task.title}`,
          description: task.description,
          contactId: contact.id,
          userId: guard.session.sub,
        },
      });
      return NextResponse.json({ item: task }, { status: 201 });
    }

    if (payload.action === 'invoice') {
      if (!payload.number || payload.amount === undefined || !payload.dueDateInvoice) {
        return NextResponse.json({ error: 'Numéro, montant et échéance requis' }, { status: 400 });
      }
      const invoice = await prisma.invoice.create({
        data: {
          number: payload.number.trim(),
          contactId: contact.id,
          amount: payload.amount,
          dueDate: new Date(payload.dueDateInvoice),
          issueDate: new Date(),
          status: 'SENT',
          description: payload.description?.trim() || null,
        },
      });
      await prisma.activity.create({
        data: {
          type: 'INVOICE',
          title: `Facture créée: ${invoice.number}`,
          description: payload.description?.trim() || null,
          contactId: contact.id,
          invoiceId: invoice.id,
          userId: guard.session.sub,
        },
      });
      return NextResponse.json({ item: invoice }, { status: 201 });
    }

    if (payload.action === 'appointment') {
      if (!payload.title || !payload.appointmentStart || !payload.appointmentEnd) {
        return NextResponse.json({ error: 'Titre, début et fin requis' }, { status: 400 });
      }
      const appointment = await prisma.appointment.create({
        data: {
          title: payload.title.trim(),
          description: payload.description?.trim() || null,
          startAt: new Date(payload.appointmentStart),
          endAt: new Date(payload.appointmentEnd),
          type: payload.appointmentType || 'MEETING',
          status: 'PENDING',
          contactId: contact.id,
          propertyId: payload.propertyId || null,
          userId: guard.session.sub,
        },
      });
      await prisma.activity.create({
        data: {
          type: 'APPOINTMENT',
          title: `Rendez-vous créé: ${appointment.title}`,
          description: payload.description?.trim() || null,
          contactId: contact.id,
          appointmentId: appointment.id,
          userId: guard.session.sub,
        },
      });
      return NextResponse.json({ item: appointment }, { status: 201 });
    }

    if (payload.action === 'song-request') {
      if (!contact.email || !contact.phone) {
        return NextResponse.json({ error: 'Le contact doit avoir un email et un téléphone pour créer une demande chanson' }, { status: 400 });
      }
      if (!payload.songType || !payload.eventType || !payload.recipientName || !payload.style || !payload.mood || !payload.description) {
        return NextResponse.json({ error: 'Type, occasion, destinataire, style, ambiance et description sont requis' }, { status: 400 });
      }

      const songRequest = await prisma.songRequest.create({
        data: {
          contactId: contact.id,
          title: payload.songTitle?.trim() || 'Demande de chanson',
          fullName: contact.fullName,
          email: contact.email,
          phone: contact.phone,
          songType: payload.songType.trim(),
          language: payload.language?.trim() || 'Français',
          occasion: payload.eventType.trim(),
          eventType: payload.eventType.trim(),
          recipientName: payload.recipientName.trim(),
          style: payload.style.trim(),
          mood: payload.mood.trim(),
          theme: payload.theme?.trim() || null,
          description: payload.description.trim(),
          details: payload.description.trim(),
          budget: payload.songBudget,
          source: 'crm',
          status: 'NEW',
        },
      });

      await prisma.activity.create({
        data: {
          type: 'FORM_SUBMISSION',
          title: 'Demande chanson créée depuis la fiche contact',
          description: `${songRequest.songType} · ${songRequest.occasion}`,
          contactId: contact.id,
          songRequestId: songRequest.id,
          userId: guard.session.sub,
        },
      });

      await prisma.task.create({
        data: {
          title: `Analyser demande chanson - ${contact.fullName}`,
          description: payload.description.trim(),
          status: 'TODO',
          priority: 'MEDIUM',
          linkedType: 'SONG_REQUEST',
          linkedId: songRequest.id,
          songRequestId: songRequest.id,
          createdById: guard.session.sub,
        },
      });

      return NextResponse.json({ item: songRequest }, { status: 201 });
    }

    if (!contact.tenantProfile?.id || !contact.tenantProfile.unitId) {
      return NextResponse.json({ error: 'Aucun profil locataire rattaché pour créer un bail' }, { status: 400 });
    }
    if (!payload.leaseNumber || !payload.leaseStart || !payload.leaseEnd || payload.rentAmount === undefined) {
      return NextResponse.json({ error: 'Numéro, dates et loyer requis' }, { status: 400 });
    }

    const lease = await prisma.lease.create({
      data: {
        leaseNumber: payload.leaseNumber.trim(),
        tenantId: contact.tenantProfile.id,
        unitId: contact.tenantProfile.unitId,
        startDate: new Date(payload.leaseStart),
        endDate: new Date(payload.leaseEnd),
        rentAmount: payload.rentAmount,
        securityDeposit: payload.securityDeposit,
        frequency: payload.frequency?.trim() || 'MONTHLY',
        status: payload.leaseStatus || 'ACTIVE',
      },
    });
    await prisma.activity.create({
      data: {
        type: 'NOTE',
        title: `Bail créé: ${lease.leaseNumber}`,
        description: payload.description?.trim() || `Bail du ${lease.startDate.toISOString()} au ${lease.endDate.toISOString()}.`,
        contactId: contact.id,
        userId: guard.session.sub,
      },
    });
    return NextResponse.json({ item: lease }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    console.error('[CRM_CONTACT_ACTION_CREATE]', error);
    return NextResponse.json({ error: 'Création impossible' }, { status: 500 });
  }
}
