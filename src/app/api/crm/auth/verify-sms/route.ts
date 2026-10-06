import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { consumeContactRateLimit } from '@/lib/contact-rate-limit';
import { consumeAuthGrant } from '@/lib/auth-grants';
import { readAuthJson, authRequestErrorResponse } from '@/lib/auth-request-security';
import {
  createCrmSessionCookie,
  clearCrmOtpCookie,
  getOtpTokenFromCookie,
  signCrmToken,
  verifyCrmOtpToken,
  matchesCrmOtpCode,
} from '@/features/crm/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await readAuthJson(request) as { code?: unknown };
    const code = String(body?.code || '').trim();

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Code de vérification à six chiffres requis' }, { status: 400 });
    }

    const otpCookieToken = getOtpTokenFromCookie(request.headers.get('cookie') ?? undefined);
    if (!otpCookieToken) {
      return NextResponse.json({ error: 'Session OTP expirée. Recommence la connexion.' }, { status: 401 });
    }

    const otpPayload = await verifyCrmOtpToken(otpCookieToken);
    if (!otpPayload) {
      return NextResponse.json({ error: 'Session OTP invalide ou expirée.' }, { status: 401 });
    }

    const attempts = await consumeContactRateLimit({
      scope: 'crm:otp', identifier: createHash('sha256').update(otpPayload.sub).digest('hex'),
      max: 5, windowMs: 10 * 60 * 1000,
    });
    if (!attempts.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives de code. Réessayez dans quelques minutes.' }, {
        status: 429, headers: { 'Retry-After': String(attempts.retryAfterSeconds), 'Cache-Control': 'no-store' },
      });
    }

    if (!matchesCrmOtpCode(otpPayload, code)) {
      return NextResponse.json({ error: 'Code de vérification invalide' }, { status: 401 });
    }
    if (!await consumeAuthGrant(otpCookieToken, 'crm-otp')) {
      return NextResponse.json({ error: 'Ce code a déjà été utilisé. Recommencez la connexion.' }, { status: 401 });
    }

    const token = await signCrmToken({
      sub: otpPayload.sub,
      role: otpPayload.role,
      email: otpPayload.email,
      fullName: otpPayload.fullName,
      authVersion: otpPayload.authVersion,
      authIdentityHash: otpPayload.authIdentityHash,
    });

    const response = NextResponse.json({
      user: {
        id: otpPayload.sub,
        fullName: otpPayload.fullName,
        email: otpPayload.email,
        role: otpPayload.role,
      },
    });

    response.headers.append('Set-Cookie', createCrmSessionCookie(token));
    response.headers.append('Set-Cookie', clearCrmOtpCookie());
    return response;
  } catch (error) {
    const securityError = authRequestErrorResponse(error);
    if (securityError) return securityError;
    console.error('crm auth verify-sms error', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'Vérification momentanément indisponible. Réessayez plus tard.' }, {
      status: 503, headers: { 'Cache-Control': 'no-store' },
    });
  }
}
