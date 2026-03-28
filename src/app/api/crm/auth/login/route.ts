import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createCrmOtpCookie, createCrmSessionCookie, signCrmOtpToken, signCrmToken } from '@/features/crm/auth/session';
import { generateSmsOtpCode, getCrmOtpTargetPhone, sendSmsMessage } from '@/lib/sms';

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
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
