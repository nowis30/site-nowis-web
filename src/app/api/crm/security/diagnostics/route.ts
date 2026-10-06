import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { runPreflight } from '../../../../../../scripts/provider-preflight.cjs';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
/** Read only: catalog flags and provider metadata, never credentials or customer data. */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireApiPermission(request, 'settings', 'read');
    if (guard.error) return guard.error;
    if (guard.session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 403, headers });
    const [database, providers] = await Promise.all([
      prisma.$queryRaw<Array<{ superuser: boolean; createRole: boolean; createDatabase: boolean; bypassRls: boolean; encryptedConnection: boolean; ownedTables: number }>>(Prisma.sql`
        SELECT r.rolsuper AS "superuser", r.rolcreaterole AS "createRole", r.rolcreatedb AS "createDatabase", r.rolbypassrls AS "bypassRls",
          COALESCE((SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()), false) AS "encryptedConnection",
          (SELECT COUNT(*)::int FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relowner = r.oid) AS "ownedTables"
        FROM pg_roles r WHERE r.rolname = CURRENT_USER`),
      runPreflight({ timeoutMs: 5000 }),
    ]);
    if (database.length !== 1) throw new Error('DATABASE_DIAGNOSTIC_UNAVAILABLE');
    return NextResponse.json({ checkedAt: new Date().toISOString(), database: database[0], providers }, { headers });
  } catch { return NextResponse.json({ error: 'Diagnostic indisponible. Aucun contrôle confirmé.' }, { status: 503, headers }); }
}
