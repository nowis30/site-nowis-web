type PayPalAddressInput = {
  addressLine1: string | null | undefined;
  addressLine2?: string | null | undefined;
  city: string | null | undefined;
  state?: string | null | undefined;
  postalCode: string | null | undefined;
  country: string | null | undefined;
};

function trimToNull(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function stripAccents(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function looksCanadian(address: { state?: string | null | undefined; postalCode?: string | null | undefined; country?: string | null | undefined }) {
  const province = normalizePayPalProvince(address.state);
  const postalCode = trimToNull(address.postalCode);
  const country = trimToNull(address.country);
  return Boolean(
    province ||
    (postalCode && /^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/i.test(postalCode)) ||
    (country && ['canada', 'ca'].includes(stripAccents(country).toLowerCase())),
  );
}

export function normalizePayPalCountryCode(value: string | null | undefined): string {
  const normalized = trimToNull(value);
  if (!normalized) return 'CA';

  const upper = stripAccents(normalized).toUpperCase();
  if (upper === 'CA' || upper === 'CANADA') return 'CA';
  if (upper === 'US' || upper === 'USA' || upper === 'UNITED STATES' || upper === 'ETATS-UNIS' || upper === 'ETATS UNIS') {
    return 'US';
  }
  if (/^[A-Z]{2}$/.test(upper)) return upper;

  throw new Error(`Pays PayPal non reconnu: ${normalized}`);
}

export function normalizePayPalProvince(value: string | null | undefined): string | undefined {
  const normalized = trimToNull(value);
  if (!normalized) return undefined;

  const raw = stripAccents(normalized).toUpperCase();
  const mapping: Record<string, string> = {
    QUEBEC: 'QC',
    QC: 'QC',
    ONTARIO: 'ON',
    ON: 'ON',
    ALBERTA: 'AB',
    AB: 'AB',
    'BRITISH COLUMBIA': 'BC',
    BC: 'BC',
    MANITOBA: 'MB',
    MB: 'MB',
    'NEW BRUNSWICK': 'NB',
    NB: 'NB',
    'NEWFOUNDLAND AND LABRADOR': 'NL',
    NL: 'NL',
    'NOVA SCOTIA': 'NS',
    NS: 'NS',
    'PRINCE EDWARD ISLAND': 'PE',
    PE: 'PE',
    SASKATCHEWAN: 'SK',
    SK: 'SK',
  };

  if (mapping[raw]) return mapping[raw];
  if (/^[A-Z]{2}$/.test(raw)) return raw;
  return undefined;
}

export function buildPayPalAddressFromBilling(input: PayPalAddressInput) {
  const addressLine1 = trimToNull(input.addressLine1);
  const city = trimToNull(input.city);
  const postalCode = trimToNull(input.postalCode);
  if (!addressLine1 || !city || !postalCode) {
    throw new Error('Adresse PayPal incomplete: addressLine1, city et postalCode sont requis.');
  }

  let countryCode: string;
  try {
    countryCode = normalizePayPalCountryCode(input.country);
  } catch (error) {
    if (looksCanadian(input)) {
      countryCode = 'CA';
    } else {
      throw error;
    }
  }

  return {
    address_line_1: addressLine1,
    ...(trimToNull(input.addressLine2) ? { address_line_2: trimToNull(input.addressLine2)! } : {}),
    ...(normalizePayPalProvince(input.state) ? { admin_area_1: normalizePayPalProvince(input.state)! } : {}),
    admin_area_2: city,
    postal_code: postalCode,
    country_code: countryCode,
  };
}