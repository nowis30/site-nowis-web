import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { createClientPortalSessionCookie, signClientPortalSession } from '@/features/client-portal/auth/session';
import { clientRegisterSchema } from '@/features/client-portal/auth/validators';
import { sanitizeNextPath } from '@/lib/safe-next';

export async function POST(request: NextRequest) {
  try {
    const payload = clientRegisterSchema.parse(await request.json());
    const redirectTo = sanitizeNextPath(payload.next, '/client/dashboard');
    const email = payload.email.toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, role: true },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'Un compte existe deja avec cet email.',
          code: 'EMAIL_EXISTS',
          suggestedAction: 'login',
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(payload.password);

    const result = await prisma.$transaction(async (tx) => {
      const existingContact = await tx.contact.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });

      const baseNotes = [
        existingContact?.notes?.trim(),
        payload.address ? `Adresse: ${payload.address}` : null,
        payload.message ? `Message inscription: ${payload.message}` : null,
      ].filter(Boolean).join('\n\n');

      const contact = existingContact
        ? await tx.contact.update({
            where: { id: existingContact.id },
            data: {
              fullName: payload.fullName,
              phone: payload.phone,
              type: 'CLIENT',
              source: existingContact.source || 'website',
              tags: Array.from(new Set([...(existingContact.tags || []), 'portal-client', 'website'])),
              notes: baseNotes || null,
            },
          })
        : await tx.contact.create({
            data: {
              type: 'CLIENT',
              fullName: payload.fullName,
              email,
              phone: payload.phone,
              source: 'website',
              tags: ['portal-client', 'website'],
              notes: baseNotes || null,
            },
          });

      const user = await tx.user.create({
        data: {
          email,
          fullName: payload.fullName,
          passwordHash,
          role: 'TENANT',
          isActive: true,
          contactId: contact.id,
        },
      });

      await tx.activity.create({
        data: {
          type: 'FORM',
          title: 'Client inscrit via le site',
          description: payload.message || payload.address || 'Creation automatique du compte client depuis le site.',
          contactId: contact.id,
          userId: user.id,
        },
      });

      const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await tx.task.create({
        data: {
          title: 'Contacter le client sous 24h',
          description: `Nouveau client inscrit via le site: ${payload.fullName} (${email}). Premier contact requis dans les 24 heures.`,
          status: 'TODO',
          priority: 'HIGH',
          dueDate,
          linkedType: 'CONTACT',
          linkedId: contact.id,
          createdById: null,
        },
      });

      return { user, contact };
    });

    const sessionToken = signClientPortalSession({
      contactId: result.contact.id,
      tenantId: null,
      email,
      fullName: result.contact.fullName,
    });

    const response = NextResponse.json({
      ok: true,
      message: 'Compte client cree avec succes.',
      redirectTo,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
      },
    });
    response.headers.append('Set-Cookie', createClientPortalSessionCookie(sessionToken));
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Un compte existe deja avec cet email.', code: 'EMAIL_EXISTS', suggestedAction: 'login' }, { status: 409 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message || 'Donnees invalides',
          code: 'VALIDATION_ERROR',
          details: error.issues,
        },
        { status: 400 },
      );
    }

    console.error('[CLIENT_AUTH_REGISTER]', error);
    return NextResponse.json({ error: 'Inscription impossible pour le moment.' }, { status: 500 });
  }
}
