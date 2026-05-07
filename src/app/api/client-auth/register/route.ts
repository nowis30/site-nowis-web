import { NextRequest, NextResponse } from 'next/server';
import { Prisma, UserRole } from '@prisma/client';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { createClientPortalSessionCookie, signClientPortalSession } from '@/features/client-portal/auth/session';
import { clientRegisterSchema } from '@/features/client-portal/auth/validators';
import { consumeRateLimit, getRequestClientIp, sanitizeRateLimitIdentifier } from '@/lib/rate-limit';
import { sanitizeNextPath } from '@/lib/safe-next';
import { ensureCrmTask } from '@/features/crm/server/task-automation';

export async function POST(request: NextRequest) {
  try {
    const payload = clientRegisterSchema.parse(await request.json());
    const redirectTo = sanitizeNextPath(payload.next, '/client/dashboard');
    const email = payload.email.toLowerCase();
    const clientIp = getRequestClientIp(request.headers);
    const limiter = consumeRateLimit(
      `client-register:${sanitizeRateLimitIdentifier(clientIp)}:${sanitizeRateLimitIdentifier(email)}`,
      4,
      15 * 60 * 1000,
    );

    if (!limiter.allowed) {
      return NextResponse.json(
        {
          error: 'Trop de tentatives d’inscription. Réessayez dans quelques minutes.',
          code: 'RATE_LIMITED',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(limiter.retryAfterSeconds), 'Cache-Control': 'no-store' },
        },
      );
    }

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
          role: UserRole.PORTAL_USER,
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

    const sessionToken = signClientPortalSession({
      contactId: result.contact.id,
      tenantId: null,
      email,
      fullName: result.contact.fullName,
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
