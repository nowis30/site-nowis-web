import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendPortalEventNotificationEmail } from '@/lib/email-service';

const baseSchema = z.object({
  type: z.enum(['song', 'workshop', 'general']),
  fullName: z.string().trim().min(2).max(180),
  email: z.string().trim().email(),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
});

const songSchema = z.object({
  type: z.literal('song'),
  fullName: z.string().trim().min(2).max(180),
  email: z.string().trim().max(180).optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  subject: z.string().trim().max(240).optional().or(z.literal('')),
  recipientName: z.string().trim().max(180).optional().or(z.literal('')),
  style: z.string().trim().max(180).optional().or(z.literal('')),
  details: z.string().trim().max(6000).optional().or(z.literal('')),
  budget: z.coerce.number().min(0).optional(),
  desiredDate: z.string().trim().optional().or(z.literal('')),
  preferCallback: z.boolean().optional(),
}).superRefine((data, ctx) => {
  const emailStr = data.email?.trim() || '';
  const phoneStr = data.phone?.trim() || '';
  if (!emailStr && !phoneStr) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: 'Veuillez fournir un courriel ou un numero de telephone.' });
  }
  if (emailStr && !phoneStr && !z.string().email().safeParse(emailStr).success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: "Format d'email invalide." });
  }
});

const workshopSchema = baseSchema.extend({
  type: z.literal('workshop'),
  organizationName: z.string().trim().min(2).max(240),
  groupType: z.string().trim().max(180).optional().or(z.literal('')),
  participants: z.coerce.number().int().min(1).max(100000).optional(),
  ageRange: z.string().trim().max(120).optional().or(z.literal('')),
  location: z.string().trim().max(240).optional().or(z.literal('')),
  desiredDate: z.string().trim().optional().or(z.literal('')),
  desiredDuration: z.string().trim().max(120).optional().or(z.literal('')),
  details: z.string().trim().min(3).max(6000),
});

const generalSchema = baseSchema.extend({
  type: z.literal('general'),
  subject: z.string().trim().min(2).max(240),
  details: z.string().trim().min(3).max(6000),
});

const submissionRequestSchema = z.union([songSchema, workshopSchema, generalSchema]);

function asIsoDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function compact(value: string | undefined | null) {
  return value && value.trim() ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  try {
    const payload = submissionRequestSchema.parse(await request.json());
    const normalizedEmail = payload.type === 'song'
      ? (payload.email?.trim().toLowerCase() || null)
      : payload.email.trim().toLowerCase();

    const contact =
      (normalizedEmail
        ? await prisma.contact.findFirst({
            where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
          })
        : compact(payload.phone)
          ? await prisma.contact.findFirst({
              where: { phone: compact(payload.phone) },
            })
          : null) ||
      (await prisma.contact.create({
        data: {
          type: 'CLIENT',
          fullName: payload.fullName,
          email: normalizedEmail,
          phone: compact(payload.phone),
          source: 'public-submission-form',
          tags: ['submission', payload.type],
        },
      }));

    if (contact.fullName !== payload.fullName || contact.phone !== compact(payload.phone)) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          fullName: payload.fullName,
          phone: compact(payload.phone) || contact.phone,
          tags: Array.from(new Set([...(contact.tags || []), 'submission', payload.type])),
        },
      });
    }

    let subject = 'Demande generale';
    let message: string = payload.type === 'general' ? payload.details : (payload.details ?? '');

    if (payload.type === 'song') {
      const preferCallbackNote = payload.preferCallback
        ? '⚠️ CLIENT SOUHAITE ETRE CONTACTE POUR DEFINIR LA CHANSON.'
        : null;
      subject = `Demande chanson: ${compact(payload.subject) || 'à définir'}`;
      message = [
        preferCallbackNote,
        `Type: chanson`,
        `Sujet: ${compact(payload.subject) || 'à définir'}`,
        `Destinataire: ${compact(payload.recipientName) || 'non précisé'}`,
        `Style: ${compact(payload.style) || 'non précisé'}`,
        `Budget: ${payload.budget ?? 'non précisé'}`,
        `Date souhaitée: ${compact(payload.desiredDate) || 'non précisée'}`,
        '',
        compact(payload.details) || 'Aucun détail fourni.',
      ].filter((l) => l !== null).join('\n');
    }

    if (payload.type === 'workshop') {
      subject = `Demande atelier: ${payload.organizationName}`;
      message = [
        `Type: atelier`,
        `Organisation: ${payload.organizationName}`,
        `Type de groupe: ${payload.groupType || 'non precise'}`,
        `Participants: ${payload.participants ?? 'non precise'}`,
        `Age: ${payload.ageRange || 'non precise'}`,
        `Lieu: ${payload.location || 'non precise'}`,
        `Date souhaitee: ${payload.desiredDate || 'non precisee'}`,
        `Duree souhaitee: ${payload.desiredDuration || 'non precisee'}`,
        '',
        payload.details ?? '',
      ].join('\n');
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        subject,
        message,
        source: `public:${payload.type}`,
        contactId: contact.id,
        submissionStatus: 'NOUVEAU',
      },
    });

    await prisma.activity.create({
      data: {
        type: 'FORM_SUBMISSION',
        title: 'Nouvelle demande publique',
        description: `${payload.type} · ${payload.fullName} · ${normalizedEmail}`,
        contactId: contact.id,
        relatedType: 'INQUIRY',
        relatedId: inquiry.id,
        relatedUrl: `/crm/submissions?focus=${inquiry.id}`,
      },
    });

    // Optionnel: creation rapide d une demande atelier/song pour le suivi CRM natif.
    if (payload.type === 'song') {
      await prisma.songRequest.create({
        data: {
          contactId: contact.id,
          title: compact(payload.subject) || 'Demande de chanson',
          fullName: payload.fullName,
          email: normalizedEmail ?? '',
          phone: compact(payload.phone) || 'N/A',
          songType: compact(payload.style) || 'PERSONNALISEE',
          occasion: 'DEMANDE_WEB',
          recipientName: compact(payload.recipientName) || payload.fullName,
          style: compact(payload.style) || 'Libre',
          mood: 'A_DETERMINER',
          details: [
            payload.preferCallback ? '⚠️ CLIENT SOUHAITE ETRE CONTACTE POUR DEFINIR LA CHANSON.' : null,
            compact(payload.details),
          ].filter(Boolean).join('\n\n') || 'À définir',
          description: compact(payload.details) || 'À définir',
          budget: payload.budget ?? null,
          desiredDeadline: asIsoDate(payload.desiredDate),
          source: 'public-submission-form',
          status: 'NEW',
        },
      }).catch(() => undefined);
    }

    if (payload.type === 'workshop') {
      await prisma.workshopRequest.create({
        data: {
          contactId: contact.id,
          title: `Atelier ${payload.organizationName}`,
          organizationName: payload.organizationName,
          contactPerson: payload.fullName,
          contactPhone: compact(payload.phone),
          contactEmail: normalizedEmail ?? '',
          addressOrLocation: compact(payload.location),
          estimatedParticipants: payload.participants ?? null,
          ageRange: compact(payload.ageRange),
          requestedDate: asIsoDate(payload.desiredDate),
          requestedTime: null,
          workshopTheme: payload.groupType || 'Atelier creatif',
          objectives: payload.details,
          notes: compact(payload.desiredDuration),
        },
      }).catch(() => undefined);
    }

    const notify = await sendPortalEventNotificationEmail({
      eventLabel: 'Nouvelle demande publique',
      subject: `Nouvelle demande recue sur nowis.store (${payload.type})`,
      headline: `Nouvelle demande ${payload.type}`,
      lines: [
        `Nom: ${payload.fullName}`,
        `Email: ${normalizedEmail ?? 'non fourni'}`,
        `Telephone: ${compact(payload.phone) || 'non fourni'}`,
        `Sujet: ${subject}`,
        `CRM: /crm/submissions?focus=${inquiry.id}`,
      ],
    });

    return NextResponse.json({
      ok: true,
      inquiryId: inquiry.id,
      emailSent: notify.success,
      message: notify.success
        ? 'Demande envoyee avec succes.'
        : 'Email non configure. Le lien a ete genere, mais aucun courriel n a ete envoye.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Donnees invalides', details: error.issues }, { status: 400 });
    }

    console.error('[PUBLIC_SUBMISSION_REQUEST]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
