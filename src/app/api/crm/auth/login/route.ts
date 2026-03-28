import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createCrmOtpCookie, createCrmSessionCookie, signCrmOtpToken, signCrmToken } from '@/features/crm/auth/session';
import { generateSmsOtpCode, getCrmOtpTargetPhone, sendSmsMessage } from '@/lib/sms';

function canUseEmergencyCrmLogin(email: string, password: string) {
  const demoPassword = String(process.env.CRM_DEMO_PASSWORD || '').trim();
  const adminEmail = String(process.env.ADMIN_EMAIL || 'simonmorin30@gmail.com').toLowerCase().trim();
  return Boolean(demoPassword) && email === adminEmail && password === demoPassword;
}

function buildEmergencyCrmLoginResponse(email: string) {
  const fullName = process.env.ADMIN_DISPLAY_NAME || 'Admin Nowis';
  const sessionToken = signCrmToken({
    sub: 'emergency-admin',
    role: 'ADMIN',
    email,
    fullName,
  });
  const response = NextResponse.json({ ok: true, redirectTo: '/crm', emergency: true });
  response.headers.set('Set-Cookie', createCrmSessionCookie(sessionToken));
  return response;
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Corps de requete JSON invalide' }, { status: 400 });
    }

    const payload = (body && typeof body === 'object') ? (body as { email?: string; password?: string }) : {};
    const email = String(payload.email || '').toLowerCase().trim();
    const password = String(payload.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientInitializationError && canUseEmergencyCrmLogin(email, password)) {
        console.warn('[CRM_LOGIN] Mode secours actif: connexion admin sans DB');
        return buildEmergencyCrmLoginResponse(email);
      }
      throw error;
    }
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    // Certains comptes historiques peuvent avoir un hash invalide: on repond 401 au lieu d'un 500.
    let validPassword = false;
    try {
      validPassword = await bcrypt.compare(password, user.passwordHash);
    } catch {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    if (!validPassword) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    const otpTargetPhone = getCrmOtpTargetPhone();
    const smsConfigured = Boolean(
      otpTargetPhone &&
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_PHONE,
    );

    // Si Twilio n'est pas configuré, connexion directe (mode dégradé sans SMS)
    if (!smsConfigured) {
      console.warn('[CRM_LOGIN] Twilio non configuré – connexion sans SMS OTP (mode dégradé)');
      const sessionToken = signCrmToken({ sub: user.id, role: user.role, email: user.email, fullName: user.fullName });
      const response = NextResponse.json({ ok: true, redirectTo: '/crm' });
      response.headers.set('Set-Cookie', createCrmSessionCookie(sessionToken));
      return response;
    }

    const otpCode = generateSmsOtpCode();
    await sendSmsMessage(
      otpTargetPhone,
      `Code de vérification CRM: ${otpCode}. Ce code expire dans 10 minutes.`,
    );

    const otpToken = signCrmOtpToken({
      sub: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      otpCode,
    });

    const response = NextResponse.json({
      requiresOtp: true,
      message: 'Un code SMS vient d etre envoyé.',
    });

    response.headers.set('Set-Cookie', createCrmOtpCookie(otpToken));
    return response;
  } catch (error) {
    console.error('crm auth login error', error);
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 503 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: 'Erreur base de donnees' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
