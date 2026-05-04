import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { getBillingIssuerSnapshot } from '@/lib/billing-profile';

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

function ensureAdmin(request: NextRequest, action: 'read' | 'update') {
  const guard = requireApiPermission(request, 'settings', action);
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
  const admin = ensureAdmin(request, 'read');
  if (admin.error) return admin.error;

  const profile = await getBillingIssuerSnapshot();
  return NextResponse.json({ item: profile });
}

export async function PUT(request: NextRequest) {
  const admin = ensureAdmin(request, 'update');
  if (admin.error) return admin.error;

  try {
    const payload = billingProfileSchema.parse(await request.json());

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
    const message = error instanceof Error ? error.message : 'Donnees invalides';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
