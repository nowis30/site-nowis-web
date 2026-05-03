import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { invoiceInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';
import { z } from 'zod';

const invoiceStatusFilterSchema = z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'ARCHIVED', 'DELETED']);

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'invoices', 'read');
  if (guard.error) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const status = request.nextUrl.searchParams.get('status');
  const parsedStatus = status ? invoiceStatusFilterSchema.safeParse(status) : null;

  const items = await prisma.invoice.findMany({
    where: {
      ...(q ? { OR: [{ number: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}),
      ...(parsedStatus?.success ? { status: parsedStatus.data } : { status: { not: 'DELETED' } }),
    },
    include: { contact: { select: { fullName: true, email: true } } },
    orderBy: { issueDate: 'desc' },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'invoices', 'create');
  if (guard.error) return guard.error;

  try {
    const rawPayload = await request.json();
    const sourceWorkshopRequestId = typeof rawPayload?.sourceWorkshopRequestId === 'string' ? rawPayload.sourceWorkshopRequestId : null;
    const sourceSongRequestId = typeof rawPayload?.sourceSongRequestId === 'string' ? rawPayload.sourceSongRequestId : null;
    const payload = invoiceInputSchema.parse(rawPayload);
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          number: payload.number.trim(),
          contactId: payload.contactId,
          issueDate: payload.issueDate ? new Date(payload.issueDate) : new Date(),
          dueDate: new Date(payload.dueDate),
          amount: payload.amount,
          status: payload.status,
          description: normalizeOptionalString(payload.description),
        },
      });

      if (sourceSongRequestId) {
        await tx.songRequest.updateMany({
          where: { id: sourceSongRequestId, contactId: payload.contactId },
          data: { convertedInvoiceId: created.id },
        });
      }

      return created;
    });

    if (sourceWorkshopRequestId) {
      await prisma.activity.create({
        data: {
          type: 'INVOICE',
          title: 'Facture créée depuis l’atelier',
          description: `Facture ${item.number} créée depuis un atelier.`,
          contactId: item.contactId,
          invoiceId: item.id,
          relatedType: 'WORKSHOP_REQUEST',
          relatedId: sourceWorkshopRequestId,
          relatedUrl: `/crm/workshop-requests/${sourceWorkshopRequestId}`,
          userId: guard.session.sub,
        },
      }).catch(() => undefined);
    }

    if (sourceSongRequestId) {
      await prisma.activity.create({
        data: {
          type: 'INVOICE',
          title: 'Facture créée depuis la demande chanson',
          description: `Facture ${item.number} créée depuis une demande de chanson.`,
          contactId: item.contactId,
          songRequestId: sourceSongRequestId,
          invoiceId: item.id,
          relatedType: 'SONG_REQUEST',
          relatedId: sourceSongRequestId,
          relatedUrl: `/crm/song-requests/${sourceSongRequestId}`,
          userId: guard.session.sub,
        },
      }).catch(() => undefined);
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}
