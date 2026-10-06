import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureAuthConfig } from '@/lib/api-diagnostics';
import { newUnusablePasswordHash, sendPortalEmailVerification } from '@/lib/verified-account';
import { limitAuth, authRequestErrorResponse } from '@/lib/auth-request-security';
import { limitRadio, radioError, RadioHttpError, radioJson, readRadioJson } from '@/lib/radio-api';

export async function POST(request: NextRequest) {
  try {
    if (!ensureAuthConfig('client').ok) throw new RadioHttpError(503, 'La création de comptes est momentanément indisponible.');
    const payload = z.object({
      fullName: z.string().trim().min(2, 'Indiquez un prénom ou pseudo.').max(80),
      email: z.string().trim().toLowerCase().email('Vérifiez votre adresse courriel.').max(254),
      password: z.string().min(8, 'Utilisez au moins 8 caractères.').max(72)
        .regex(/[A-Z]/, 'Ajoutez une majuscule.').regex(/[a-z]/, 'Ajoutez une minuscule.').regex(/[0-9]/, 'Ajoutez un chiffre.')
        .refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Le mot de passe est trop long.'),
      website: z.string().max(0).optional(),
    }).strict().parse(await readRadioJson(request));
    await limitRadio(request, 'radio:register');
    await limitAuth(request, 'register', payload.email, 4);
    if (await prisma.user.findUnique({ where: { email: payload.email }, select: { id: true } })) {
      throw new RadioHttpError(409, 'Un compte existe déjà pour ce courriel. Connectez-vous ou réinitialisez votre mot de passe.');
    }
    const passwordHash = await newUnusablePasswordHash();
    // Never attach an unverified signup to an existing CRM contact or their invoices.
    const user = await prisma.user.create({ data: { email: payload.email, fullName: payload.fullName, passwordHash, role: 'PORTAL_USER',
      contact: { create: { type: 'PARTICIPANT', fullName: payload.fullName, email: payload.email, source: 'radio', tags: ['radio-listener'] } } },
      select: { id: true, authVersion: true, contactId: true, email: true, fullName: true } });
    await sendPortalEmailVerification(user, request.nextUrl.origin);
    return radioJson({ ok: true, verificationRequired: true, message: 'Vérifiez votre courriel pour activer votre compte et définir votre mot de passe.', redirectTo: '/connexion?verification=sent' }, 201);
  } catch (error) {
    const securityError = authRequestErrorResponse(error);
    if (securityError) return securityError;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return radioJson({ message: 'Un compte existe déjà pour ce courriel. Connectez-vous.' }, 409);
    }
    return radioError(error);
  }
}
