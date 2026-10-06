import { NextRequest, NextResponse } from 'next/server';
import { Prisma, UserRole } from '@prisma/client';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { createClientPortalSessionCookie, getClientPortalSessionFromCookieHeader, signClientPortalSession } from '@/features/client-portal/auth/session';
import { hasVerifiedContactRegistration } from '@/features/client-portal/auth/registration-security';
import { clientRegisterSchema } from '@/features/client-portal/auth/validators';
import { readAuthJson, limitAuth, authRequestErrorResponse } from '@/lib/auth-request-security';
import { newUnusablePasswordHash, sendPortalEmailVerification } from '@/lib/verified-account';
import { sanitizeNextPath } from '@/lib/safe-next';
import { ensureCrmTask } from '@/features/crm/server/task-automation';
import { sendPortalEventNotificationEmail } from '@/lib/email-service';

class ContactEmailVerificationRequired extends Error {}

export async function POST(request: NextRequest) {
  try {
    const payload = clientRegisterSchema.parse(await readAuthJson(request));
    const redirectTo = sanitizeNextPath(payload.next, '/client/dashboard');
    const email = payload.email.toLowerCase();
    await limitAuth(request, 'register', email, 4);

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
        { status: 409, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const verifiedSession = await getClientPortalSessionFromCookieHeader(request.headers.get('cookie') || undefined);
    const verified = verifiedSession?.email.trim().toLowerCase() === email;
    const passwordHash = verified ? await hashPassword(payload.password) : await newUnusablePasswordHash();

    const result = await prisma.$transaction(async (tx) => {
      const existingContact = await tx.contact.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });

      // An email address in a public signup is not proof of ownership of the existing CRM dossier.
      // A secure emailed login link or verified Google login provides the matching portal session.
      if (existingContact && !hasVerifiedContactRegistration(existingContact, verifiedSession)) {
        throw new ContactEmailVerificationRequired();
      }

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
          role: UserRole.PORTAL_USER,
          isActive: true,
          emailVerifiedAt: verified ? new Date() : null,
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

      await ensureCrmTask(
        {
          type: 'CALLBACK',
          title: 'Rappeler le nouveau client',
          description: `Nouveau client inscrit via le site: ${payload.fullName} (${email}). Premier contact requis dans les 24 heures.`,
          priority: 'HIGH',
          dueDate,
          contactId: contact.id,
          linkedType: 'CONTACT',
          linkedId: contact.id,
          isAutoCreated: true,
        },
        tx,
      );

      return { user, contact };
    });

    try {
      await sendPortalEventNotificationEmail({
        eventLabel: 'NOUVELLE INSCRIPTION CLIENT',
        subject: 'Nouveau client inscrit sur le site',
        headline: 'Un nouveau client vient de creer un compte',
        lines: [
          `Nom: ${result.contact.fullName}`,
          `Email: ${email}`,
          payload.phone ? `Telephone: ${payload.phone}` : null,
          'Source: inscription classique (email/mot de passe)',
        ],
      });
    } catch (notificationError) {
      console.error('[CLIENT_AUTH_REGISTER_NOTIFICATION]', notificationError);
    }

    if (!verified) {
      await sendPortalEmailVerification(result.user, request.nextUrl.origin);
      return NextResponse.json({ ok: true, verificationRequired: true, message: 'Vérifiez votre courriel pour activer votre compte et définir votre mot de passe.', redirectTo: '/connexion?verification=sent' }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
    }

    const sessionToken = await signClientPortalSession({
      contactId: result.contact.id,
      tenantId: null,
      email,
      fullName: result.contact.fullName,
      authVersion: result.user.authVersion,
    });

    const response = NextResponse.json(
      {
        ok: true,
        message: 'Compte client cree avec succes.',
        redirectTo,
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
    response.headers.append('Set-Cookie', createClientPortalSessionCookie(sessionToken));
    return response;
  } catch (error) {
    const securityError = authRequestErrorResponse(error);
    if (securityError) return securityError;
    if (error instanceof ContactEmailVerificationRequired) {
      return NextResponse.json(
        {
          error: 'Cette adresse est déjà liée à un dossier client. Ouvrez le lien sécurisé envoyé par courriel avant de définir votre mot de passe. Vous pouvez aussi utiliser Google pour accéder au portail.',
          code: 'EMAIL_VERIFICATION_REQUIRED',
          suggestedAction: 'request-link',
        },
        { status: 403, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un compte existe deja avec cet email.', code: 'EMAIL_EXISTS', suggestedAction: 'login' },
        { status: 409, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message || 'Donnees invalides',
          code: 'VALIDATION_ERROR',
          details: error.issues,
        },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    console.error('[CLIENT_AUTH_REGISTER]', error);
    return NextResponse.json({ error: 'Inscription impossible pour le moment.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
