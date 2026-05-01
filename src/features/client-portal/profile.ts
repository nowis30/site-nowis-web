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
const META_BLOCK_PATTERN = /\[(?:CLIENT_PROFILE_META_START|ROFILE_META_START)\]([\s\S]*?)\[CLIENT_PROFILE_META_END\]/g;

function normalizeText(value: string | null | undefined) {
  return (value || '').trim();
}

function splitNotes(notes: string | null | undefined) {
  const source = notes || '';
  const matches = Array.from(source.matchAll(META_BLOCK_PATTERN));
  const metaJsonBlocks = matches
    .map((match) => (match[1] || '').trim())
    .filter((entry) => entry.length > 0);
  const baseNotes = source.replace(META_BLOCK_PATTERN, '').trim();

  return { baseNotes, metaJsonBlocks };
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

function parseClientProfileMetaCandidate(candidate: unknown): ClientProfileMeta | null {
  if (!candidate) return null;

  try {
    const parsed = (typeof candidate === 'string' ? JSON.parse(candidate) : candidate) as Partial<ClientProfileMeta> & {
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

export function readClientProfileMeta(input: string | null | undefined | { notes?: string | null; profileMeta?: unknown }): ClientProfileMeta | null {
  const notes = typeof input === 'string' || input === null || input === undefined ? input : (input.notes ?? null);
  const profileMeta = typeof input === 'object' && input !== null && !Array.isArray(input) ? input.profileMeta : null;

  const fromJsonColumn = parseClientProfileMetaCandidate(profileMeta);
  if (fromJsonColumn) return fromJsonColumn;

  const { metaJsonBlocks } = splitNotes(notes);
  for (let index = metaJsonBlocks.length - 1; index >= 0; index -= 1) {
    const parsed = parseClientProfileMetaCandidate(metaJsonBlocks[index]);
    if (parsed) return parsed;
  }

  return null;
}

export function buildClientProfileMeta(payload: {
  billingAddress: ClientAddressFields;
  requestPostalAddress: ClientAddressFields;
  samePostalAsBilling: boolean;
  requestType: ClientRequestType;
}): ClientProfileMeta {
  const billingAddress = normalizeAddress(payload.billingAddress);
  const requestPostalAddress = payload.samePostalAsBilling
    ? { ...billingAddress }
    : normalizeAddress(payload.requestPostalAddress);

  return {
    billingAddress,
    requestPostalAddress,
    samePostalAsBilling: payload.samePostalAsBilling,
    requestType: payload.requestType,
    updatedAt: new Date().toISOString(),
  };
}

export function stripClientProfileMetaFromNotes(notes: string | null | undefined) {
  const { baseNotes } = splitNotes(notes);
  return baseNotes || null;
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
  const meta = buildClientProfileMeta(payload);

  const metaBlock = `${META_START}${JSON.stringify(meta)}${META_END}`;
  if (!baseNotes) return metaBlock;
  return `${baseNotes}\n\n${metaBlock}`;
}

export function isClientProfileIncomplete(input: { phone: string | null | undefined; notes: string | null | undefined; profileMeta?: unknown }) {
  const hasPhone = normalizeText(input.phone).length > 0;
  const meta = readClientProfileMeta({ notes: input.notes, profileMeta: input.profileMeta });

  return !hasPhone || !meta;
}
