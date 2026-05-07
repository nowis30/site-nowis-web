import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { invoiceInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';
import { createWithSequentialDocumentNumber } from '@/features/crm/server/document-numbers';
import { findExistingInvoiceForSongRequest } from '@/features/crm/server/song-request-quote-guards';
import { z } from 'zod';
import { buildCustomerSnapshotFromContact, getBillingIssuerSnapshot } from '@/lib/billing-profile';
import { ensureCrmTask } from '@/features/crm/server/task-automation';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error:
        'Les factures doivent être créées à partir d\'une soumission acceptée. Utilisez : POST /api/crm/commercial-quotes/:id/convert-to-invoice',
      code: 'INVOICE_DIRECT_CREATION_DISABLED',
    },
    { status: 405 },
  );
}

// Kept for reference — replaced by POST above which enforces the business rule.
async function _disabledDirectInvoiceCreate(request: NextRequest) {
  const guard = requireApiPermission(request, 'invoices', 'create');
  if (guard.error) return guard.error;

  try {
    const rawPayload = await request.json();
    const sourceWorkshopRequestId = typeof rawPayload?.sourceWorkshopRequestId === 'string' ? rawPayload.sourceWorkshopRequestId : null;
    const sourceSongRequestId = typeof rawPayload?.sourceSongRequestId === 'string' ? rawPayload.sourceSongRequestId : null;
    const payload = invoiceInputSchema.parse(rawPayload);

    if (sourceSongRequestId) {
      const existingInvoice = await findExistingInvoiceForSongRequest(sourceSongRequestId);
      if (existingInvoice) {
        return NextResponse.json(
          {
            item: existingInvoice,
            message: 'Une facture existe déjà pour cette chanson.',
          },
          { status: 200 },
        );
      }
    }

    const issuerSnapshot = await getBillingIssuerSnapshot();
    const contact = await prisma.contact.findUnique({
      where: { id: payload.contactId },
      select: {
        fullName: true,
        companyName: true,
        email: true,
        phone: true,
        billingCompanyName: true,
        billingLegalName: true,
        billingEmail: true,
        billingPhone: true,
        billingAddressLine1: true,
        billingAddressLine2: true,
        billingCity: true,
        billingState: true,
        billingPostalCode: true,
        billingCountry: true,
        billingTaxId: true,
        billingNotes: true,
      },
    });
    const customerSnapshot = contact ? buildCustomerSnapshotFromContact(contact) : null;
    const createInvoiceWithNumber = (invoiceNumber: string) => prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          number: invoiceNumber,
          contactId: payload.contactId,
          issueDate: payload.issueDate ? new Date(payload.issueDate) : new Date(),
          dueDate: new Date(payload.dueDate),
          amount: payload.amount,
          subtotal: payload.amount,
          taxAmount: 0,
          totalAmount: payload.amount,
          issuerSnapshot: issuerSnapshot as unknown as Prisma.InputJsonValue,
          customerSnapshot: customerSnapshot
            ? (customerSnapshot as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          taxesEnabled: issuerSnapshot.taxesEnabled,
          taxRateGst: issuerSnapshot.taxRateGst,
          taxRateQst: issuerSnapshot.taxRateQst,
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

    const manualNumber = payload.number?.trim();
    const item = manualNumber
      ? await createInvoiceWithNumber(manualNumber)
      : await createWithSequentialDocumentNumber({
        type: 'invoice',
        create: (invoiceNumber) => createInvoiceWithNumber(invoiceNumber),
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

    try {
      if (sourceSongRequestId) {
        await ensureCrmTask({
          type: 'CREATE_SONG',
          title: 'Créer la chanson et déposer les fichiers',
          description: `Facture ${item.number} créée pour la demande chanson.`,
          priority: 'HIGH',
          linkedType: 'SONG_REQUEST',
          linkedId: sourceSongRequestId,
          songRequestId: sourceSongRequestId,
          invoiceId: item.id,
          contactId: item.contactId,
          createdById: guard.session.sub,
          isAutoCreated: true,
        });
      } else if (sourceWorkshopRequestId) {
        await ensureCrmTask({
          type: 'SCHEDULE_WORKSHOP',
          title: "Planifier l'atelier au calendrier",
          description: `Facture ${item.number} créée depuis l'atelier.`,
          priority: 'HIGH',
          linkedType: 'WORKSHOP_REQUEST',
          linkedId: sourceWorkshopRequestId,
          workshopRequestId: sourceWorkshopRequestId,
          invoiceId: item.id,
          contactId: item.contactId,
          createdById: guard.session.sub,
          isAutoCreated: true,
        });
      }
    } catch (error) {
      console.error('Erreur création tâche post-facture:', error);
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}
