import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { getBillingIssuerSnapshot } from '@/lib/billing-profile';
import { normalizeGstNumber, normalizeNeq, normalizeQstNumber, QuebecRegistrationError } from '@/lib/quebec-fiscal';

const billingProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(160),
  companyName: z.string().trim().min(2).max(160),
  legalLabel: z.string().trim().max(160).optional().or(z.literal('')),
  tradeName: z.string().trim().max(160).optional().or(z.literal('')),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  website: z.string().trim().max(240).optional().or(z.literal('')),
  addressLine1: z.string().trim().max(240).optional().or(z.literal('')),
  addressLine2: z.string().trim().max(240).optional().or(z.literal('')),
  city: z.string().trim().max(120).optional().or(z.literal('')),
  state: z.string().trim().max(120).optional().or(z.literal('')),
  postalCode: z.string().trim().max(40).optional().or(z.literal('')),
  country: z.string().trim().max(120).optional().or(z.literal('')),
  taxId: z.string().trim().max(80).optional().or(z.literal('')),
  neq: z.string().trim().max(20).optional().or(z.literal('')),
  gstNumber: z.string().trim().max(20).optional().or(z.literal('')),
  qstNumber: z.string().trim().max(20).optional().or(z.literal('')),
  paymentTerms: z.string().trim().max(1000).optional().or(z.literal('')),
  footerNote: z.string().trim().max(1000).optional().or(z.literal('')),
  taxesEnabled: z.boolean().default(true),
  taxRateGst: z.coerce.number().min(0).max(1).default(0.05),
  taxRateQst: z.coerce.number().min(0).max(1).default(0.09975),
  currency: z.string().trim().min(3).max(8).default('CAD'),
});

function normalizeOptional(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function ensureAdmin(request: NextRequest, action: 'read' | 'update') {
  const guard = await requireApiPermission(request, 'settings', action);
  if (guard.error) return { error: guard.error, session: null as null };
  if (guard.session.role !== 'ADMIN') {
    return {
      error: NextResponse.json({ error: 'Action reservee a un administrateur.' }, { status: 403 }),
      session: null as null,
    };
  }
  return { error: null, session: guard.session };
}

export async function GET(request: NextRequest) {
  const admin = await ensureAdmin(request, 'read');
  if (admin.error) return admin.error;

  const profile = await getBillingIssuerSnapshot();
  return NextResponse.json({ item: profile });
}

export async function PUT(request: NextRequest) {
  const admin = await ensureAdmin(request, 'update');
  if (admin.error) return admin.error;

  try {
    const payload = billingProfileSchema.parse(await request.json());
    const neq = normalizeNeq(payload.neq, true);
    const gstNumber = normalizeGstNumber(payload.gstNumber, true);
    const qstNumber = normalizeQstNumber(payload.qstNumber, true);

    const current = await prisma.billingProfile.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });

    const item = current
      ? await prisma.billingProfile.update({
          where: { id: current.id },
          data: {
            displayName: payload.displayName.trim(),
            companyName: payload.companyName.trim(),
            legalLabel: normalizeOptional(payload.legalLabel),
            tradeName: normalizeOptional(payload.tradeName),
            email: normalizeOptional(payload.email),
            phone: normalizeOptional(payload.phone),
            website: normalizeOptional(payload.website),
            addressLine1: normalizeOptional(payload.addressLine1),
            addressLine2: normalizeOptional(payload.addressLine2),
            city: normalizeOptional(payload.city),
            state: normalizeOptional(payload.state),
            postalCode: normalizeOptional(payload.postalCode),
            country: normalizeOptional(payload.country) || 'Canada',
            taxId: normalizeOptional(payload.taxId),
            neq,
            gstNumber,
            qstNumber,
            paymentTerms: normalizeOptional(payload.paymentTerms),
            footerNote: normalizeOptional(payload.footerNote),
            taxesEnabled: payload.taxesEnabled,
            taxRateGst: payload.taxRateGst,
            taxRateQst: payload.taxRateQst,
            currency: payload.currency.toUpperCase(),
            isActive: true,
          },
        })
      : await prisma.billingProfile.create({
          data: {
            displayName: payload.displayName.trim(),
            companyName: payload.companyName.trim(),
            legalLabel: normalizeOptional(payload.legalLabel),
            tradeName: normalizeOptional(payload.tradeName),
            email: normalizeOptional(payload.email),
            phone: normalizeOptional(payload.phone),
            website: normalizeOptional(payload.website),
            addressLine1: normalizeOptional(payload.addressLine1),
            addressLine2: normalizeOptional(payload.addressLine2),
            city: normalizeOptional(payload.city),
            state: normalizeOptional(payload.state),
            postalCode: normalizeOptional(payload.postalCode),
            country: normalizeOptional(payload.country) || 'Canada',
            taxId: normalizeOptional(payload.taxId),
            neq,
            gstNumber,
            qstNumber,
            paymentTerms: normalizeOptional(payload.paymentTerms),
            footerNote: normalizeOptional(payload.footerNote),
            taxesEnabled: payload.taxesEnabled,
            taxRateGst: payload.taxRateGst,
            taxRateQst: payload.taxRateQst,
            currency: payload.currency.toUpperCase(),
            isActive: true,
          },
        });

    await prisma.billingProfile.updateMany({
      where: { id: { not: item.id }, isActive: true },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (error instanceof QuebecRegistrationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Les champs du profil de facturation sont invalides.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Enregistrement impossible.' }, { status: 400 });
  }
}
