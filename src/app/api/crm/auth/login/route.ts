import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createCrmSessionCookie, signCrmToken } from '@/features/crm/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').toLowerCase().trim();
    const password = String(body?.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    const token = signCrmToken({
      sub: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });

    response.headers.set('Set-Cookie', createCrmSessionCookie(token));
    return response;
  } catch (error) {
    console.error('crm auth login error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
