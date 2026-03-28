import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { hasEnvVar, logApiDiagnostic, toErrorMetadata, getRuntimeEnv } from '@/lib/api-diagnostics';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const hasDatabaseUrl = hasEnvVar('DATABASE_URL');
  const environment = getRuntimeEnv();

  if (!hasDatabaseUrl) {
    logApiDiagnostic('[HEALTH_DB]', 'DB_FAIL', 'DATABASE_URL is missing');
    return NextResponse.json(
      {
        ok: false,
        code: 'DB_FAIL',
        message: 'Database unreachable',
        environment,
        hasDatabaseUrl,
      },
      { status: 500 },
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        ok: true,
        code: 'DB_OK',
        message: 'Database reachable',
        environment,
        hasDatabaseUrl,
      },
      { status: 200 },
    );
  } catch (error) {
    const meta = toErrorMetadata(error);
    const status = error instanceof Prisma.PrismaClientInitializationError ? 503 : 500;

    logApiDiagnostic('[HEALTH_DB]', 'DB_FAIL', 'Database health check failed', error);

    return NextResponse.json(
      {
        ok: false,
        code: 'DB_FAIL',
        message: 'Database unreachable',
        environment,
        hasDatabaseUrl,
        errorName: meta.errorName,
      },
      { status },
    );
  }
}