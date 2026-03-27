import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { comparePassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createClientPortalSessionCookie, signClientPortalSession } from '@/features/client-portal/auth/session';
import { clientLoginSchema } from '@/features/client-portal/auth/validators';

export async function POST(request: NextRequest) {
  try {
    const payload = clientLoginSchema.parse(await request.json());
    const email = payload.email.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        role: 'TENANT',
        isActive: true,
      },
      include: {
        contact: {
          include: {
            tenantProfile: { select: { id: true } },
          },
        },
      },
    });

    if (!user || !user.contact) {
      return NextResponse.json({ error: 'Email ou mot de passe invalide.' }, { status: 401 });
    }

    const isValid = await comparePassword(payload.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Email ou mot de passe invalide.' }, { status: 401 });
    }

    const sessionToken = signClientPortalSession({
      contactId: user.contact.id,
      tenantId: user.contact.tenantProfile?.id || null,
      email: user.email,
      fullName: user.contact.fullName,
    });

    const response = NextResponse.json({ ok: true, redirectTo: '/client/dashboard' });
    response.headers.append('Set-Cookie', createClientPortalSessionCookie(sessionToken));
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Donnees invalides', details: error.issues }, { status: 400 });
    }

    console.error('[CLIENT_AUTH_LOGIN]', error);
    return NextResponse.json({ error: 'Connexion impossible pour le moment.' }, { status: 500 });
  }
}
