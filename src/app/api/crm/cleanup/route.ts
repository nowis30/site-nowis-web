/**
 * GET /api/crm/cleanup
 * Agrège toutes les données test/archivées/supprimées pour la page admin de nettoyage.
 * Réservé ADMIN.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'invoices', 'read');
  if (guard.error) return guard.error;

  if (guard.session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès réservé à un administrateur.' }, { status: 403 });
  }

  const [songRequests, workshopRequests, submissions, invoices] = await Promise.all([
    prisma.songRequest.findMany({
      where: { OR: [{ isTest: true }, { archivedAt: { not: null } }, { deletedAt: { not: null } }] },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        isTest: true,
        testReason: true,
        archivedAt: true,
        deletedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),

    prisma.workshopRequest.findMany({
      where: { OR: [{ isTest: true }, { archivedAt: { not: null } }, { deletedAt: { not: null } }] },
      select: {
        id: true,
        title: true,
        workshopTheme: true,
        status: true,
        isTest: true,
        testReason: true,
        archivedAt: true,
        deletedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),

    prisma.inquiry.findMany({
      where: { OR: [{ isTest: true }, { archivedAt: { not: null } }, { deletedAt: { not: null } }] },
      select: {
        id: true,
        subject: true,
        submissionStatus: true,
        isTest: true,
        testReason: true,
        archivedAt: true,
        deletedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),

    prisma.invoice.findMany({
      where: { OR: [{ isTest: true }, { archivedAt: { not: null } }, { deletedAt: { not: null } }] },
      select: {
        id: true,
        number: true,
        status: true,
        paypalStatus: true,
        paypalInvoiceId: true,
        isTest: true,
        testReason: true,
        archivedAt: true,
        deletedAt: true,
        createdAt: true,
        contact: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ]);

  return NextResponse.json({ songRequests, workshopRequests, submissions, invoices });
}
