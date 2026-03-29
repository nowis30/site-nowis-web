import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { comparePassword } from '@/lib/auth';
import { buildErrorPayload, ensureAuthConfig, logApiDiagnostic } from '@/lib/api-diagnostics';
import { prisma } from '@/lib/prisma';
import { createClientPortalSessionCookie, signClientPortalSession } from '@/features/client-portal/auth/session';
import { clientLoginSchema } from '@/features/client-portal/auth/validators';
import { sanitizeNextPath } from '@/lib/safe-next';

function errorResponse(
  code: 'DB_INIT' | 'DB_SCHEMA' | 'CONFIG_MISSING' | 'AUTH_FAIL' | 'USER_DATA_INVALID' | 'UNKNOWN',
  message: string,
  status: number,
) {
  return NextResponse.json(buildErrorPayload(code, message), { status });
}

export async function POST(request: NextRequest) {
  const config = ensureAuthConfig('client');
  if (!config.ok) {
    logApiDiagnostic('[CLIENT_AUTH_LOGIN]', 'CONFIG_MISSING', 'Missing login config', undefined, {
      missing: config.missing,
    });
    return NextResponse.json(config.payload, { status: 500 });
  }

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return errorResponse('UNKNOWN', 'Invalid JSON body', 400);
    }

    const payload = clientLoginSchema.parse(rawBody);
    const email = payload.email.toLowerCase();
    const redirectTo = sanitizeNextPath(payload.next, '/client/dashboard');

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email },
        role: 'TENANT',
        isActive: true,
      },
      include: {
        contact: true,
      },
    });

    if (!user) {
      return errorResponse('AUTH_FAIL', 'Invalid credentials', 401);
    }

    if (!user.contactId || !user.contact) {
      logApiDiagnostic('[CLIENT_AUTH_LOGIN]', 'USER_DATA_INVALID', 'User account is missing contact linkage', undefined, {
        userId: user.id,
      });
      return errorResponse('USER_DATA_INVALID', 'User account data is inconsistent', 500);
    }

    let isValid = false;
    try {
      isValid = await comparePassword(payload.password, user.passwordHash);
    } catch {
      return errorResponse('AUTH_FAIL', 'Invalid credentials', 401);
    }

    if (!isValid) {
      return errorResponse('AUTH_FAIL', 'Invalid credentials', 401);
    }

    const sessionToken = signClientPortalSession({
      contactId: user.contact.id,
      tenantId: null,
      email: user.email,
      fullName: user.contact.fullName,
    });

    const response = NextResponse.json({ ok: true, redirectTo });
    response.headers.append('Set-Cookie', createClientPortalSessionCookie(sessionToken));
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      logApiDiagnostic('[CLIENT_AUTH_LOGIN]', 'DB_INIT', 'Database initialization failed', error);
      return errorResponse('DB_INIT', 'Database initialization failed', 503);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logApiDiagnostic('[CLIENT_AUTH_LOGIN]', 'DB_SCHEMA', 'Database schema query failed', error);
      return errorResponse('DB_SCHEMA', 'Database schema query failed', 500);
    }

    if (error instanceof ZodError) {
      return errorResponse('UNKNOWN', 'Invalid request payload', 400);
    }

    logApiDiagnostic('[CLIENT_AUTH_LOGIN]', 'UNKNOWN', 'Unexpected login error', error);
    return errorResponse('UNKNOWN', 'Unexpected server error', 500);
  }
}
