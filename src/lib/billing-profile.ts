import { prisma } from '@/lib/prisma';
import { getInvoiceBusinessProfile, type InvoiceBusinessProfile } from '@/lib/invoice-profile';

type MaybeString = string | null | undefined;

export type BillingIssuerSnapshot = InvoiceBusinessProfile & {
  profileId: string | null;
  taxesEnabled: boolean;
  taxRateGst: number;
  taxRateQst: number;
  currency: string;
};

export type BillingCustomerSnapshot = {
  fullName: string;
  companyName: string | null;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  taxId: string | null;
  notes: string | null;
};

function normalizeString(value: MaybeString) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toRate(value: unknown, fallback: number) {
  const asNumber = Number(value);
  if (!Number.isFinite(asNumber) || asNumber < 0) return fallback;
  return asNumber;
}

export async function getActiveBillingProfile() {
  return prisma.billingProfile.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getBillingIssuerSnapshot(): Promise<BillingIssuerSnapshot> {
  const dbProfile = await getActiveBillingProfile();
  const envProfile = getInvoiceBusinessProfile();

  if (!dbProfile) {
    return {
      ...envProfile,
      profileId: null,
      taxesEnabled: true,
      taxRateGst: 0.05,
      taxRateQst: 0.09975,
      currency: 'CAD',
    };
  }

  return {
    displayName: dbProfile.displayName,
    companyName: dbProfile.companyName,
    legalLabel: dbProfile.legalLabel || undefined,
    tradeName: dbProfile.tradeName || undefined,
    email: dbProfile.email || undefined,
    phone: dbProfile.phone || undefined,
    website: dbProfile.website || undefined,
    addressLine1: dbProfile.addressLine1 || undefined,
    addressLine2: dbProfile.addressLine2 || undefined,
    city: dbProfile.city || undefined,
    state: dbProfile.state || undefined,
    postalCode: dbProfile.postalCode || undefined,
    country: dbProfile.country || undefined,
    taxId: dbProfile.taxId || undefined,
    paymentTerms: dbProfile.paymentTerms || undefined,
    footerNote: dbProfile.footerNote || undefined,
    profileId: dbProfile.id,
    taxesEnabled: dbProfile.taxesEnabled,
    taxRateGst: toRate(dbProfile.taxRateGst, 0.05),
    taxRateQst: toRate(dbProfile.taxRateQst, 0.09975),
    currency: normalizeString(dbProfile.currency) || 'CAD',
  };
}

export function buildCustomerSnapshotFromContact(input: {
  fullName: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  billingCompanyName?: string | null;
  billingLegalName?: string | null;
  billingEmail?: string | null;
  billingPhone?: string | null;
  billingAddressLine1?: string | null;
  billingAddressLine2?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPostalCode?: string | null;
  billingCountry?: string | null;
  billingTaxId?: string | null;
  billingNotes?: string | null;
}): BillingCustomerSnapshot {
  return {
    fullName: input.fullName,
    companyName: normalizeString(input.billingCompanyName) || normalizeString(input.companyName),
    legalName: normalizeString(input.billingLegalName),
    email: normalizeString(input.billingEmail) || normalizeString(input.email),
    phone: normalizeString(input.billingPhone) || normalizeString(input.phone),
    addressLine1: normalizeString(input.billingAddressLine1),
    addressLine2: normalizeString(input.billingAddressLine2),
    city: normalizeString(input.billingCity),
    state: normalizeString(input.billingState),
    postalCode: normalizeString(input.billingPostalCode),
    country: normalizeString(input.billingCountry) || 'Canada',
    taxId: normalizeString(input.billingTaxId),
    notes: normalizeString(input.billingNotes),
  };
}

export function buildCustomerSnapshotFromOrganization(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  address?: string | null;
  billingCompanyName?: string | null;
  billingLegalName?: string | null;
  billingEmail?: string | null;
  billingPhone?: string | null;
  billingAddressLine1?: string | null;
  billingAddressLine2?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPostalCode?: string | null;
  billingCountry?: string | null;
  billingTaxId?: string | null;
  billingNotes?: string | null;
}): BillingCustomerSnapshot {
  return {
    fullName: input.name,
    companyName: normalizeString(input.billingCompanyName) || input.name,
    legalName: normalizeString(input.billingLegalName),
    email: normalizeString(input.billingEmail) || normalizeString(input.email),
    phone: normalizeString(input.billingPhone) || normalizeString(input.phone),
    addressLine1: normalizeString(input.billingAddressLine1) || normalizeString(input.address),
    addressLine2: normalizeString(input.billingAddressLine2),
    city: normalizeString(input.billingCity) || normalizeString(input.city),
    state: normalizeString(input.billingState),
    postalCode: normalizeString(input.billingPostalCode),
    country: normalizeString(input.billingCountry) || 'Canada',
    taxId: normalizeString(input.billingTaxId),
    notes: normalizeString(input.billingNotes),
  };
}

export function validateIssuerSnapshot(issuer: BillingIssuerSnapshot) {
  const missing: string[] = [];
  if (!normalizeString(issuer.displayName)) missing.push('displayName');
  if (!normalizeString(issuer.companyName)) missing.push('companyName');
  if (!normalizeString(issuer.email)) missing.push('email');
  if (!normalizeString(issuer.addressLine1)) missing.push('addressLine1');
  if (!normalizeString(issuer.city)) missing.push('city');
  if (!normalizeString(issuer.postalCode)) missing.push('postalCode');
  if (!normalizeString(issuer.country)) missing.push('country');
  return missing;
}

export function validateCustomerSnapshot(customer: BillingCustomerSnapshot) {
  const missing: string[] = [];
  if (!normalizeString(customer.fullName)) missing.push('fullName');
  if (!normalizeString(customer.email)) missing.push('email');
  if (!normalizeString(customer.addressLine1)) missing.push('addressLine1');
  if (!normalizeString(customer.city)) missing.push('city');
  if (!normalizeString(customer.postalCode)) missing.push('postalCode');
  if (!normalizeString(customer.country)) missing.push('country');
  return missing;
}

export function toIssuerSnapshot(value: unknown): BillingIssuerSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const displayName = normalizeString(String(input.displayName || ''));
  const companyName = normalizeString(String(input.companyName || ''));
  if (!displayName || !companyName) return null;

  return {
    displayName,
    companyName,
    legalLabel: normalizeString(input.legalLabel as MaybeString) || undefined,
    tradeName: normalizeString(input.tradeName as MaybeString) || undefined,
    email: normalizeString(input.email as MaybeString) || undefined,
    phone: normalizeString(input.phone as MaybeString) || undefined,
    website: normalizeString(input.website as MaybeString) || undefined,
    addressLine1: normalizeString(input.addressLine1 as MaybeString) || undefined,
    addressLine2: normalizeString(input.addressLine2 as MaybeString) || undefined,
    city: normalizeString(input.city as MaybeString) || undefined,
    state: normalizeString(input.state as MaybeString) || undefined,
    postalCode: normalizeString(input.postalCode as MaybeString) || undefined,
    country: normalizeString(input.country as MaybeString) || undefined,
    taxId: normalizeString(input.taxId as MaybeString) || undefined,
    paymentTerms: normalizeString(input.paymentTerms as MaybeString) || undefined,
    footerNote: normalizeString(input.footerNote as MaybeString) || undefined,
    profileId: normalizeString(input.profileId as MaybeString),
    taxesEnabled: Boolean(input.taxesEnabled ?? true),
    taxRateGst: toRate(input.taxRateGst, 0.05),
    taxRateQst: toRate(input.taxRateQst, 0.09975),
    currency: normalizeString(input.currency as MaybeString) || 'CAD',
  };
}

export function toCustomerSnapshot(value: unknown): BillingCustomerSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const fullName = normalizeString(input.fullName as MaybeString);
  if (!fullName) return null;

  return {
    fullName,
    companyName: normalizeString(input.companyName as MaybeString),
    legalName: normalizeString(input.legalName as MaybeString),
    email: normalizeString(input.email as MaybeString),
    phone: normalizeString(input.phone as MaybeString),
    addressLine1: normalizeString(input.addressLine1 as MaybeString),
    addressLine2: normalizeString(input.addressLine2 as MaybeString),
    city: normalizeString(input.city as MaybeString),
    state: normalizeString(input.state as MaybeString),
    postalCode: normalizeString(input.postalCode as MaybeString),
    country: normalizeString(input.country as MaybeString),
    taxId: normalizeString(input.taxId as MaybeString),
    notes: normalizeString(input.notes as MaybeString),
  };
}
