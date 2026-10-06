import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { hasEnvVar, logApiDiagnostic } from '@/lib/api-diagnostics';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  const hasDatabaseUrl = hasEnvVar('DATABASE_URL');

  if (!hasDatabaseUrl) {
    logApiDiagnostic('[HEALTH_DB]', 'DB_FAIL', 'DATABASE_URL is missing');
    return NextResponse.json(
      {
        ok: false,
        code: 'DB_FAIL',
        message: 'Database unreachable',
      },
      { status: 503, headers },
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        ok: true,
        code: 'DB_OK',
        message: 'Database reachable',
      },
      { status: 200, headers },
    );
  } catch (error) {
    const status = error instanceof Prisma.PrismaClientInitializationError ? 503 : 500;

    logApiDiagnostic('[HEALTH_DB]', 'DB_FAIL', 'Database health check failed', error);

    return NextResponse.json(
      {
        ok: false,
        code: 'DB_FAIL',
        message: 'Database unreachable',
      },
      { status, headers },
    );
  }
}
