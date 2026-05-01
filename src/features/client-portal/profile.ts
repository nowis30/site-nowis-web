export type ClientRequestType = 'ATELIER' | 'CHANSON' | 'ATELIER_ET_CHANSON';

export interface ClientAddressFields {
  streetNumber: string;
  street: string;
  city: string;
  postalCode: string;
}

export interface ClientProfileMeta {
  billingAddress: ClientAddressFields;
  requestPostalAddress: ClientAddressFields;
  samePostalAsBilling: boolean;
  requestType: ClientRequestType;
  updatedAt: string;
}

const META_START = '[CLIENT_PROFILE_META_START]';
const META_END = '[CLIENT_PROFILE_META_END]';

function normalizeText(value: string | null | undefined) {
  return (value || '').trim();
}

function splitNotes(notes: string | null | undefined) {
  const source = notes || '';
  const startIndex = source.indexOf(META_START);
  if (startIndex === -1) {
    return {
      baseNotes: source.trim(),
      metaJson: null as string | null,
    };
  }

  const endIndex = source.indexOf(META_END, startIndex + META_START.length);
  if (endIndex === -1) {
    return {
      baseNotes: source.trim(),
      metaJson: null as string | null,
    };
  }

  const metaJson = source.slice(startIndex + META_START.length, endIndex).trim();
  const before = source.slice(0, startIndex).trim();
  const after = source.slice(endIndex + META_END.length).trim();
  const baseNotes = [before, after].filter(Boolean).join('\n\n').trim();

  return { baseNotes, metaJson };
}

function normalizeAddress(value: Partial<ClientAddressFields> | null | undefined): ClientAddressFields {
  return {
    streetNumber: normalizeText(value?.streetNumber),
    street: normalizeText(value?.street),
    city: normalizeText(value?.city),
    postalCode: normalizeText(value?.postalCode),
  };
}

function hasCompleteAddress(value: ClientAddressFields) {
  return !!(value.streetNumber && value.street && value.city && value.postalCode);
}

export function readClientProfileMeta(notes: string | null | undefined): ClientProfileMeta | null {
  const { metaJson } = splitNotes(notes);
  if (!metaJson) return null;

  try {
    const parsed = JSON.parse(metaJson) as Partial<ClientProfileMeta> & {
      billingAddress?: string | Partial<ClientAddressFields>;
      requestPostalAddress?: string | Partial<ClientAddressFields>;
      samePostalAsBilling?: boolean;
    };
    if (!parsed) return null;

    const billingAddress =
      typeof parsed.billingAddress === 'string'
        ? normalizeAddress({ street: parsed.billingAddress })
        : normalizeAddress(parsed.billingAddress);

    const requestPostalAddress =
      typeof parsed.requestPostalAddress === 'string'
        ? normalizeAddress({ street: parsed.requestPostalAddress })
        : normalizeAddress(parsed.requestPostalAddress);

    const samePostalAsBilling = parsed.samePostalAsBilling === true;
    const requestType = parsed.requestType;

    if (!hasCompleteAddress(billingAddress) || !hasCompleteAddress(requestPostalAddress)) return null;
    if (requestType !== 'ATELIER' && requestType !== 'CHANSON' && requestType !== 'ATELIER_ET_CHANSON') return null;

    return {
      billingAddress,
      requestPostalAddress,
      samePostalAsBilling,
      requestType,
      updatedAt: normalizeText(parsed.updatedAt) || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function upsertClientProfileMeta(
  notes: string | null | undefined,
  payload: {
    billingAddress: ClientAddressFields;
    requestPostalAddress: ClientAddressFields;
    samePostalAsBilling: boolean;
    requestType: ClientRequestType;
  },
) {
  const { baseNotes } = splitNotes(notes);

  const billingAddress = normalizeAddress(payload.billingAddress);
  const requestPostalAddress = payload.samePostalAsBilling
    ? { ...billingAddress }
    : normalizeAddress(payload.requestPostalAddress);

  const meta: ClientProfileMeta = {
    billingAddress,
    requestPostalAddress,
    samePostalAsBilling: payload.samePostalAsBilling,
    requestType: payload.requestType,
    updatedAt: new Date().toISOString(),
  };

  const metaBlock = `${META_START}${JSON.stringify(meta)}${META_END}`;
  if (!baseNotes) return metaBlock;
  return `${baseNotes}\n\n${metaBlock}`;
}

export function isClientProfileIncomplete(input: { phone: string | null | undefined; notes: string | null | undefined }) {
  const hasPhone = normalizeText(input.phone).length > 0;
  const meta = readClientProfileMeta(input.notes);

  return !hasPhone || !meta;
}
