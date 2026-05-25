import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { buildErrorPayload, ensureAuthConfig, logApiDiagnostic } from '@/lib/api-diagnostics';
import { prisma } from '@/lib/prisma';
import { createCrmOtpCookie, createCrmSessionCookie, signCrmOtpToken, signCrmToken } from '@/features/crm/auth/session';
import { generateSmsOtpCode, getCrmOtpTargetPhone, sendSmsMessage } from '@/lib/sms';

function errorResponse(
  code: 'DB_INIT' | 'DB_SCHEMA' | 'CONFIG_MISSING' | 'AUTH_FAIL' | 'USER_DATA_INVALID' | 'UNKNOWN',
  message: string,
  status: number,
) {
  return NextResponse.json(buildErrorPayload(code, message), { status });
}

function canUseEmergencyCrmLogin(email: string, password: string) {
  if (process.env.NODE_ENV === 'production' && process.env.CRM_ALLOW_EMERGENCY_LOGIN !== 'true') {
    return false;
  }

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
  const config = ensureAuthConfig('crm');
  if (!config.ok) {
    logApiDiagnostic('[CRM_AUTH_LOGIN]', 'CONFIG_MISSING', 'Missing CRM login config', undefined, {
      missing: config.missing,
    });
    return NextResponse.json(config.payload, { status: 500 });
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('UNKNOWN', 'Invalid JSON body', 400);
    }

    const payload = (body && typeof body === 'object') ? (body as { email?: string; password?: string }) : {};
    const email = String(payload.email || '').toLowerCase().trim();
    const password = String(payload.password || '');

    if (!email || !password) {
      return errorResponse('UNKNOWN', 'Email and password are required', 400);
    }

    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientInitializationError && canUseEmergencyCrmLogin(email, password)) {
        console.warn('[CRM_AUTH_LOGIN]', {
          code: 'DB_INIT',
          message: 'Emergency login used because database is unavailable',
        });
        return buildEmergencyCrmLoginResponse(email);
      }
      throw error;
    }
    if (!user || !user.isActive) {
      return errorResponse('AUTH_FAIL', 'Invalid credentials', 401);
    }

    // Certains comptes historiques peuvent avoir un hash invalide: on repond 401 au lieu d'un 500.
    let validPassword = false;
    try {
      validPassword = await bcrypt.compare(password, user.passwordHash);
    } catch {
      return errorResponse('AUTH_FAIL', 'Invalid credentials', 401);
    }

    if (!validPassword) {
      return errorResponse('AUTH_FAIL', 'Invalid credentials', 401);
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
      console.warn('[CRM_AUTH_LOGIN]', {
        code: 'CONFIG_MISSING',
        message: 'Twilio is not configured, using degraded login mode without OTP',
      });
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
    if (error instanceof Prisma.PrismaClientInitializationError) {
      logApiDiagnostic('[CRM_AUTH_LOGIN]', 'DB_INIT', 'Database initialization failed', error);
      return errorResponse('DB_INIT', 'Database initialization failed', 503);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logApiDiagnostic('[CRM_AUTH_LOGIN]', 'DB_SCHEMA', 'Database schema query failed', error);
      return errorResponse('DB_SCHEMA', 'Database schema query failed', 500);
    }

    logApiDiagnostic('[CRM_AUTH_LOGIN]', 'UNKNOWN', 'Unexpected CRM login error', error);
    return errorResponse('UNKNOWN', 'Unexpected server error', 500);
  }
}
