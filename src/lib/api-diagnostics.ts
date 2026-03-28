import { Prisma } from '@prisma/client';

export type ApiErrorCode =
  | 'DB_INIT'
  | 'DB_SCHEMA'
  | 'CONFIG_MISSING'
  | 'AUTH_FAIL'
  | 'USER_DATA_INVALID'
  | 'UNKNOWN'
  | 'DB_OK'
  | 'DB_FAIL';

export interface ApiErrorPayload {
  ok: false;
  code: Exclude<ApiErrorCode, 'DB_OK'>;
  message: string;
}

export function buildErrorPayload(code: Exclude<ApiErrorCode, 'DB_OK'>, message: string): ApiErrorPayload {
  return { ok: false, code, message };
}

export function hasEnvVar(name: string): boolean {
  return Boolean(String(process.env[name] || '').trim());
}

export function getRuntimeEnv(): string {
  return process.env.NODE_ENV || 'unknown';
}

export function ensureAuthConfig(context: 'client' | 'crm'):
  | { ok: true }
  | { ok: false; payload: ApiErrorPayload; missing: string[] } {
  const missing: string[] = [];

  if (!hasEnvVar('DATABASE_URL')) {
    missing.push('DATABASE_URL');
  }

  if (context === 'client') {
    const hasClientSecret = hasEnvVar('CLIENT_PORTAL_JWT_SECRET') || hasEnvVar('JWT_SECRET');
    if (!hasClientSecret) {
      missing.push('CLIENT_PORTAL_JWT_SECRET|JWT_SECRET');
    }
  } else if (!hasEnvVar('JWT_SECRET')) {
    missing.push('JWT_SECRET');
  }

  if (missing.length > 0) {
    return {
      ok: false,
      payload: buildErrorPayload('CONFIG_MISSING', 'Required server configuration is missing'),
      missing,
    };
  }

  return { ok: true };
}

export function toErrorMetadata(error: unknown): {
  errorName: string;
  prismaCode?: string;
  safeMessage: string;
} {
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  const safeMessage = error instanceof Error ? error.message : 'Unexpected error';
  const prismaCode = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;

  return { errorName, prismaCode, safeMessage };
}

export function logApiDiagnostic(
  prefix: '[CLIENT_AUTH_LOGIN]' | '[CRM_AUTH_LOGIN]' | '[HEALTH_DB]',
  code: Exclude<ApiErrorCode, 'DB_OK'>,
  message: string,
  error?: unknown,
  extra?: Record<string, unknown>,
) {
  const metadata = toErrorMetadata(error);
  console.error(prefix, {
    code,
    message,
    errorName: metadata.errorName,
    prismaCode: metadata.prismaCode,
    safeMessage: metadata.safeMessage,
    ...extra,
  });
}