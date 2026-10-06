import { NextRequest, NextResponse } from 'next/server';
import { comparePassword, signToken, createSessionCookie } from '@/lib/auth';
import { getUserByEmail } from '@/lib/db';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Cet accès historique nécessite une migration et une validation de l’adresse courriel. Utilisez le portail client sécurisé.', code: 'LEGACY_AUTH_DISABLED' }, { status: 410, headers: { 'Cache-Control': 'no-store' } });
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Email ou mot de passe invalide.' }, { status: 401 });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Email ou mot de passe invalide.' }, { status: 401 });
    }

    const token = await signToken(user);
    const response = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    response.headers.set('Set-Cookie', createSessionCookie(token));
    return response;
  } catch (error) {
    console.error('auth/login error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
