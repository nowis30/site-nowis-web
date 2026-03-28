import { NextRequest, NextResponse } from 'next/server';
import {
  createCrmSessionCookie,
  clearCrmOtpCookie,
  getOtpTokenFromCookie,
  signCrmToken,
  verifyCrmOtpToken,
} from '@/features/crm/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = String(body?.code || '').trim();

    if (!code) {
      return NextResponse.json({ error: 'Code SMS requis' }, { status: 400 });
    }

    const otpCookieToken = getOtpTokenFromCookie(request.headers.get('cookie') ?? undefined);
    if (!otpCookieToken) {
      return NextResponse.json({ error: 'Session OTP expirée. Recommence la connexion.' }, { status: 401 });
    }

    const otpPayload = verifyCrmOtpToken(otpCookieToken);
    if (!otpPayload) {
      return NextResponse.json({ error: 'Session OTP invalide ou expirée.' }, { status: 401 });
    }

    if (otpPayload.otpCode !== code) {
      return NextResponse.json({ error: 'Code SMS invalide' }, { status: 401 });
    }

    const token = signCrmToken({
      sub: otpPayload.sub,
      role: otpPayload.role,
      email: otpPayload.email,
      fullName: otpPayload.fullName,
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
    console.error('crm auth verify-sms error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
