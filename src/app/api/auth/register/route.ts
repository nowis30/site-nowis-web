import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { hashPassword, signToken, createSessionCookie } from '@/lib/auth';
import { getUserByEmail, upsertUser } from '@/lib/db';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Cet accès historique nécessite une migration et une validation de l’adresse courriel. Utilisez le portail client sécurisé.', code: 'LEGACY_AUTH_DISABLED' }, { status: 410, headers: { 'Cache-Control': 'no-store' } });
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = {
      id: randomUUID(),
      name,
      email,
      passwordHash,
      role: 'owner' as const,
      createdAt: new Date().toISOString(),
    };

    await upsertUser(user);

    const token = await signToken(user);
    const response = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    response.headers.set('Set-Cookie', createSessionCookie(token));
    return response;
  } catch (error) {
    console.error('auth/register error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
