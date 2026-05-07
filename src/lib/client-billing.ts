export type ClientBillingLike = {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  billingLegalName?: string | null;
  billingEmail?: string | null;
  billingAddressLine1?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPostalCode?: string | null;
  billingCountry?: string | null;
};

export type ClientBillingMissingKey =
  | 'phone'
  | 'billingName'
  | 'billingEmail'
  | 'billingAddressLine1'
  | 'billingCity'
  | 'billingState'
  | 'billingPostalCode'
  | 'billingCountry';

const MISSING_LABELS: Record<ClientBillingMissingKey, string> = {
  phone: 'Telephone',
  billingName: 'Nom de facturation',
  billingEmail: 'Courriel de facturation',
  billingAddressLine1: 'Adresse ligne 1',
  billingCity: 'Ville',
  billingState: 'Province / Etat',
  billingPostalCode: 'Code postal',
  billingCountry: 'Pays',
};

function normalize(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getClientBillingIdentity(input: ClientBillingLike) {
  return {
    billingName: normalize(input.billingLegalName) || normalize(input.fullName),
    billingEmail: normalize(input.billingEmail) || normalize(input.email),
  };
}

export function getClientBillingMissingKeys(input: ClientBillingLike): ClientBillingMissingKey[] {
  const identity = getClientBillingIdentity(input);
  const missing: ClientBillingMissingKey[] = [];

  if (!normalize(input.phone)) missing.push('phone');
  if (!identity.billingName) missing.push('billingName');
  if (!identity.billingEmail) missing.push('billingEmail');
  if (!normalize(input.billingAddressLine1)) missing.push('billingAddressLine1');
  if (!normalize(input.billingCity)) missing.push('billingCity');
  if (!normalize(input.billingState)) missing.push('billingState');
  if (!normalize(input.billingPostalCode)) missing.push('billingPostalCode');
  if (!normalize(input.billingCountry)) missing.push('billingCountry');

  return missing;
}

export function getClientBillingMissingLabels(input: ClientBillingLike) {
  return getClientBillingMissingKeys(input).map((key) => MISSING_LABELS[key]);
}

export function isClientBillingComplete(input: ClientBillingLike) {
  return getClientBillingMissingKeys(input).length === 0;
}

export function getClientBillingDefaults(input: ClientBillingLike) {
  return {
    billingLegalName: normalize(input.billingLegalName) || normalize(input.fullName),
    billingEmail: normalize(input.billingEmail) || normalize(input.email),
    billingCountry: normalize(input.billingCountry) || 'Canada',
  };
}
