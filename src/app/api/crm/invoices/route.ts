import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { invoiceInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';
import { createWithSequentialDocumentNumber } from '@/features/crm/server/document-numbers';
import { findExistingInvoiceForSongRequest } from '@/features/crm/server/song-request-quote-guards';
import { z } from 'zod';
import {
  buildCustomerSnapshotFromContact,
  buildCustomerSnapshotFromOrganization,
  getBillingIssuerSnapshot,
} from '@/lib/billing-profile';
import { ensureCrmTask } from '@/features/crm/server/task-automation';

const invoiceStatusFilterSchema = z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'ARCHIVED', 'DELETED']);

const organizationBillingSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  city: true,
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
  contacts: {
    select: { id: true, contactId: true, role: true },
    orderBy: [{ isPrimary: 'desc' as const }, { createdAt: 'asc' as const }],
  },
} satisfies Prisma.OrganizationSelect;

async function resolveOrganizationInvoiceRecipient(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: organizationBillingSelect,
  });

  if (!organization) return null;

  const existingBillingLink = organization.contacts.find(
    (link) => link.role?.trim().toLowerCase() === 'facturation',
  );

  let contactId = existingBillingLink?.contactId || null;

  if (!contactId) {
    contactId = await prisma.$transaction(async (tx) => {
      const billingName = organization.billingLegalName || organization.billingCompanyName || organization.name;
      const billingEmail = organization.billingEmail || organization.email;
      const billingPhone = organization.billingPhone || organization.phone;

      const contact = await tx.contact.create({
        data: {
          type: 'ORGANIZATION',
          fullName: billingName,
          companyName: organization.name,
          email: billingEmail,
          phone: billingPhone,
          billingCompanyName: organization.billingCompanyName || organization.name,
          billingLegalName: organization.billingLegalName,
          billingEmail,
          billingPhone,
          billingAddressLine1: organization.billingAddressLine1 || organization.address,
          billingAddressLine2: organization.billingAddressLine2,
          billingCity: organization.billingCity || organization.city,
          billingState: organization.billingState,
          billingPostalCode: organization.billingPostalCode,
          billingCountry: organization.billingCountry,
          billingTaxId: organization.billingTaxId,
          billingNotes: organization.billingNotes,
          source: 'Organisation CRM - facturation automatique',
          tags: ['facturation-organisation'],
        },
      });

      if (existingBillingLink) {
        await tx.organizationContact.update({
          where: { id: existingBillingLink.id },
          data: { contactId: contact.id },
        });
      } else {
        await tx.organizationContact.create({
          data: {
            organizationId: organization.id,
            contactId: contact.id,
            fullName: billingName,
            role: 'Facturation',
            email: billingEmail,
            phone: billingPhone,
            isPrimary: organization.contacts.length === 0,
          },
        });
      }

      return contact.id;
    });
  }

  return {
    contactId,
    customerSnapshot: buildCustomerSnapshotFromOrganization(organization),
  };
}

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
    const organizationId = typeof rawPayload?.organizationId === 'string' && rawPayload.organizationId.trim()
      ? rawPayload.organizationId.trim()
      : null;

    let resolvedContactId = typeof rawPayload?.contactId === 'string' && rawPayload.contactId.trim()
      ? rawPayload.contactId.trim()
      : null;
    let customerSnapshot: ReturnType<typeof buildCustomerSnapshotFromContact> | ReturnType<typeof buildCustomerSnapshotFromOrganization> | null = null;

    if (organizationId) {
      const organizationRecipient = await resolveOrganizationInvoiceRecipient(organizationId);
      if (!organizationRecipient) {
        return NextResponse.json({ error: 'Organisation de facturation introuvable.' }, { status: 404 });
      }
      resolvedContactId = organizationRecipient.contactId;
      customerSnapshot = organizationRecipient.customerSnapshot;
    }

    if (!resolvedContactId) {
      return NextResponse.json({ error: 'Choisis une organisation ou un contact à facturer.' }, { status: 400 });
    }

    const payload = invoiceInputSchema.parse({ ...rawPayload, contactId: resolvedContactId });

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

    if (!customerSnapshot) {
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

      if (!contact) {
        return NextResponse.json({ error: 'Contact de facturation introuvable.' }, { status: 404 });
      }

      customerSnapshot = buildCustomerSnapshotFromContact(contact);
    }

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
          customerSnapshot: customerSnapshot as Prisma.InputJsonValue,
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données de facture invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Création de facture impossible.' }, { status: 400 });
  }
}
