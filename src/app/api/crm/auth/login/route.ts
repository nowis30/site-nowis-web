import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { buildErrorPayload, ensureAuthConfig, logApiDiagnostic } from '@/lib/api-diagnostics';
import { prisma } from '@/lib/prisma';
import { createCrmOtpCookie, createCrmSessionCookie, signCrmOtpToken, signCrmToken } from '@/features/crm/auth/session';
import { generateSmsOtpCode, getCrmOtpTargetPhone, isCrmSmsConfigured, sendSmsMessage } from '@/lib/sms';
import { sendEmail } from '@/lib/email-service';
import { consumeContactRateLimit } from '@/lib/contact-rate-limit';
import { getTrustedClientIp } from '@/lib/trusted-client-ip';
import { readAuthJson, authRequestErrorResponse } from '@/lib/auth-request-security';

function errorResponse(
  code: 'DB_INIT' | 'DB_SCHEMA' | 'CONFIG_MISSING' | 'AUTH_FAIL' | 'USER_DATA_INVALID' | 'UNKNOWN',
  message: string,
  status: number,
) {
  return NextResponse.json(buildErrorPayload(code, message), { status, headers: { 'Cache-Control': 'no-store' } });
}

async function sendCrmOtpEmail(email: string, code: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      sendEmail({ to: email, subject: 'Code de vérification CRM Nowis', html:
        `<p>Votre code de vérification CRM est <strong>${code}</strong>.</p><p>Il expire dans 10 minutes. Ne le partagez avec personne.</p>` }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('CRM_OTP_DELIVERY_TIMEOUT')), 15_000); }),
    ]);
    if (!result.success) throw new Error('CRM_OTP_DELIVERY_FAILED');
  } finally {
    if (timer) clearTimeout(timer);
  }
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
      body = await readAuthJson(request);
    } catch (error) {
      const securityError = authRequestErrorResponse(error);
      if (securityError) return securityError;
      return errorResponse('UNKNOWN', 'Invalid JSON body', 400);
    }

    const payload = (body && typeof body === 'object') ? (body as { email?: string; password?: string }) : {};
    const email = String(payload.email || '').toLowerCase().trim();
    const password = String(payload.password || '');

    if (!email || !password) {
      return errorResponse('UNKNOWN', 'Email and password are required', 400);
    }

    // Refuse a blocked source before it can create records for more email variants.
    const ipLimit = await consumeContactRateLimit({
      scope: 'crm:login:ip', identifier: createHash('sha256').update(getTrustedClientIp(request.headers) || 'unknown').digest('hex'),
      max: 30, windowMs: 15 * 60 * 1000,
    });
    const accountLimit = ipLimit.allowed ? await consumeContactRateLimit({
      scope: 'crm:login:account', identifier: createHash('sha256').update(email).digest('hex'),
      max: 10, windowMs: 15 * 60 * 1000,
    }) : ipLimit;
    if (!accountLimit.allowed || !ipLimit.allowed) {
      const blocked = !accountLimit.allowed ? accountLimit : ipLimit;
      return NextResponse.json(buildErrorPayload('AUTH_FAIL', 'Trop de tentatives. Réessayez dans quelques minutes.'), {
        status: 429, headers: { 'Retry-After': String(blocked.retryAfterSeconds), 'Cache-Control': 'no-store' },
      });
    }

    const user = await prisma.user.findUnique({ where: { email }, include: { contact: true } });
    if (!user || !user.isActive || !['ADMIN', 'ASSISTANT'].includes(user.role) || user.contact?.deletedAt) {
      return errorResponse('AUTH_FAIL', 'Invalid credentials', 401);
    }

    // Certains comptes historiques peuvent avoir un hash invalide: on repond 401 au lieu d'un 500.
    let validPassword = false;
    try {
      validPassword = await bcrypt.compare(password, user.passwordHash);
    } catch (error) {
      const securityError = authRequestErrorResponse(error);
      if (securityError) return securityError;
      return errorResponse('AUTH_FAIL', 'Invalid credentials', 401);
    }

    if (!validPassword) {
      return errorResponse('AUTH_FAIL', 'Invalid credentials', 401);
    }

    const otpTargetPhone = getCrmOtpTargetPhone();
    const smsConfigured = isCrmSmsConfigured();

    // Password-only access is limited to explicitly identified local development.
    if (!smsConfigured && process.env.NODE_ENV === 'development') {
      console.warn('[CRM_AUTH_LOGIN]', {
        code: 'CONFIG_MISSING',
        message: 'Twilio is not configured, using degraded login mode without OTP',
      });
      const sessionToken = await signCrmToken({ sub: user.id, role: user.role, email: user.email, fullName: user.fullName, authVersion: user.authVersion });
      const response = NextResponse.json({ ok: true, redirectTo: '/crm' }, { headers: { 'Cache-Control': 'no-store' } });
      response.headers.set('Set-Cookie', createCrmSessionCookie(sessionToken));
      return response;
    }

    const otpCode = generateSmsOtpCode();
    const otpChannel = smsConfigured ? 'sms' : 'email';
    try {
      if (smsConfigured) {
        await sendSmsMessage(otpTargetPhone, `Code de vérification CRM: ${otpCode}. Ce code expire dans 10 minutes.`);
      } else {
        // Use the persisted staff account identity after password verification.
        await sendCrmOtpEmail(user.email, otpCode);
      }
    } catch (error) {
      logApiDiagnostic('[CRM_AUTH_LOGIN]', 'CONFIG_MISSING', 'CRM OTP delivery unavailable', error);
      return errorResponse('CONFIG_MISSING', 'L’envoi du code de vérification est momentanément indisponible. Réessayez plus tard.', 503);
    }

    const otpToken = await signCrmOtpToken({
      sub: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      otpCode,
      authVersion: user.authVersion,
    });

    const response = NextResponse.json({
      requiresOtp: true,
      otpChannel,
      message: otpChannel === 'sms' ? 'Un code de vérification a été envoyé par SMS.' : 'Un code de vérification a été envoyé au courriel de votre compte.',
    }, { headers: { 'Cache-Control': 'no-store' } });

    response.headers.set('Set-Cookie', createCrmOtpCookie(otpToken));
    return response;
  } catch (error) {
    const securityError = authRequestErrorResponse(error);
    if (securityError) return securityError;
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
