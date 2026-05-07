import { randomBytes } from 'crypto';
import { UserRole } from '@prisma/client';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildClientPortalPath, signClientPortalToken } from '@/lib/client-portal';
import { SongRequestInput } from '@/lib/validators/song-request';
import { ensureCrmTask } from '@/features/crm/server/task-automation';

function normalizeBudget(value?: string) {
  if (!value || value.trim().length === 0) return null;
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function normalizeDeadline(value?: string) {
  if (!value || value.trim().length === 0) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildSongRequestSummary(input: SongRequestInput, requestId: string, portalPath: string) {
  const normalizedBudget = normalizeBudget(input.budget);
  const normalizedDeadline = normalizeDeadline(input.desiredDeadline);

  const lines = [
    `Nouvelle demande de chanson reçue depuis le site web.`,
    `Titre: ${input.title}`,
    `Langue: ${input.language}`,
    `Type: ${input.songType}`,
    `Occasion: ${input.occasion}`,
    `Tempo: ${input.tempo}`,
    `Thème: ${input.theme}`,
    `Personne concernée: ${input.recipientName}`,
    `Style musical: ${input.style}`,
    `Ambiance: ${input.mood}`,
    input.inspirations ? `Inspirations: ${input.inspirations}` : null,
    input.specialMessage ? `Message spécial: ${input.specialMessage}` : null,
    normalizedBudget !== null ? `Budget approximatif: ${normalizedBudget} CAD` : null,
    normalizedDeadline ? `Délai souhaité: ${normalizedDeadline.toLocaleDateString('fr-CA')}` : null,
    `Description: ${input.description}`,
    `Voir la demande: /crm/song-requests/${requestId}`,
    `Portail client: ${portalPath}`,
  ].filter(Boolean);

  return lines.join('\n');
}

function appendContactNote(existingNotes: string | null, requestId: string) {
  const now = new Date().toLocaleString('fr-CA');
  const line = `[${now}] Demande chanson reçue (${requestId}).`;
  return existingNotes ? `${existingNotes.trim()}\n${line}` : line;
}

export async function submitSongRequestFromWebsite(input: SongRequestInput, options?: { contactId?: string }) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedBudget = normalizeBudget(input.budget);
  const normalizedDeadline = normalizeDeadline(input.desiredDeadline);
  const followUpDaysRaw = Number(process.env.SONG_REQUEST_FOLLOWUP_DAYS ?? '2');
  const followUpDays = Number.isFinite(followUpDaysRaw) && followUpDaysRaw > 0 ? followUpDaysRaw : 2;
  const throwawayPasswordHash = await hashPassword(randomBytes(32).toString('hex'));

  return prisma.$transaction(async (tx) => {
    const existingContact = options?.contactId
      ? await tx.contact.findUnique({ where: { id: options.contactId } })
      : await tx.contact.findFirst({ where: { email: normalizedEmail } });

    let contact = existingContact;

    if (existingContact) {
      const nextTags = Array.from(new Set([...(existingContact.tags ?? []), 'song-request']));

      contact = await tx.contact.update({
        where: { id: existingContact.id },
        data: {
          phone: existingContact.phone || input.phone,
          source: existingContact.source || input.source || 'website',
          tags: nextTags,
        },
      });
    } else {
      contact = await tx.contact.create({
        data: {
          type: 'PROSPECT',
          fullName: input.fullName,
          email: normalizedEmail,
          phone: input.phone,
          source: input.source || 'website',
          tags: ['song-request'],
        },
      });
    }

    const linkedUser = await tx.user.findFirst({
      where: {
        role: UserRole.PORTAL_USER,
        isActive: true,
        OR: [
          { contactId: contact.id },
          { email: { equals: normalizedEmail, mode: 'insensitive' } },
        ],
      },
      select: { id: true, contactId: true },
    });

    let ensuredUser = linkedUser;

    if (!ensuredUser) {
      ensuredUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          fullName: input.fullName,
          passwordHash: throwawayPasswordHash,
          role: UserRole.PORTAL_USER,
          isActive: true,
          contactId: contact.id,
        },
        select: { id: true, contactId: true },
      });
    } else if (!ensuredUser.contactId || ensuredUser.contactId !== contact.id) {
      await tx.user.update({
        where: { id: ensuredUser.id },
        data: { contactId: contact.id },
      });
      ensuredUser = { ...ensuredUser, contactId: contact.id };
    }

    const songRequest = await tx.songRequest.create({
      data: {
        contactId: contact.id,
        title: input.title,
        fullName: input.fullName,
        email: normalizedEmail,
        phone: input.phone,
        songType: input.songType,
        language: input.language,
        occasion: input.occasion,
        eventType: input.eventType,
        recipientName: input.recipientName,
        specialMessage: input.specialMessage || null,
        style: input.style,
        mood: input.mood,
        tempo: input.tempo,
        theme: input.theme,
        description: input.description,
        inspirations: input.inspirations || null,
        lyrics: input.lyrics || null,
        structureVerse: input.structureVerse,
        structureChorus: input.structureChorus,
        structureBridge: input.structureBridge || null,
        fileUrl: input.fileUrl || null,
        details: input.description,
        budget: normalizedBudget,
        desiredDeadline: normalizedDeadline,
        source: input.source || 'website',
        status: 'NEW',
      },
    });

    const clientPortalToken = signClientPortalToken({
      contactId: contact.id,
      email: normalizedEmail,
      fullName: contact.fullName,
    });
    const clientPortalPath = buildClientPortalPath(clientPortalToken);

    const summary = buildSongRequestSummary(input, songRequest.id, clientPortalPath);

    const activity = await tx.activity.create({
      data: {
        type: 'FORM_SUBMISSION',
        title: 'Nouvelle demande de chanson',
        description: summary,
        contactId: contact.id,
        songRequestId: songRequest.id,
        userId: ensuredUser.id,
      },
    });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + followUpDays);

    const task = await ensureCrmTask(
      {
        title: 'Préparer la soumission pour la chanson',
        description: `Analyse à faire pour ${input.fullName} (${input.songType} - ${input.eventType}).\nDemande: /crm/song-requests/${songRequest.id}\nPortail client: ${clientPortalPath}`,
        type: 'CREATE_QUOTE',
        priority: 'MEDIUM',
        dueDate,
        songRequestId: songRequest.id,
        linkedType: 'SONG_REQUEST',
        linkedId: songRequest.id,
        createdById: ensuredUser.id,
        contactId: contact.id,
        isAutoCreated: true,
      },
      tx,
    );

    await tx.contact.update({
      where: { id: contact.id },
      data: {
        notes: appendContactNote(contact.notes, songRequest.id),
      },
    });

    return {
      isNewContact: !existingContact,
      contactId: contact.id,
      songRequestId: songRequest.id,
      activityId: activity.id,
      taskId: task.taskId,
      userId: ensuredUser.id,
      clientPortalPath,
    };
  });
}
