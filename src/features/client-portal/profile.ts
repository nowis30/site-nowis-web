export type ClientRequestType = 'ATELIER' | 'CHANSON' | 'ATELIER_ET_CHANSON';

export interface ClientProfileMeta {
  billingAddress: string;
  requestPostalAddress: string;
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
  const pattern = new RegExp(`${META_START}([\\s\\S]*?)${META_END}`);
  const match = source.match(pattern);

  if (!match) {
    return {
      baseNotes: source.trim(),
      metaJson: null as string | null,
    };
  }

  const metaJson = (match[1] || '').trim();
  const baseNotes = source.replace(pattern, '').trim();

  return { baseNotes, metaJson };
}

export function readClientProfileMeta(notes: string | null | undefined): ClientProfileMeta | null {
  const { metaJson } = splitNotes(notes);
  if (!metaJson) return null;

  try {
    const parsed = JSON.parse(metaJson) as Partial<ClientProfileMeta>;
    if (!parsed) return null;

    const billingAddress = normalizeText(parsed.billingAddress);
    const requestPostalAddress = normalizeText(parsed.requestPostalAddress);
    const requestType = parsed.requestType;

    if (!billingAddress || !requestPostalAddress) return null;
    if (requestType !== 'ATELIER' && requestType !== 'CHANSON' && requestType !== 'ATELIER_ET_CHANSON') return null;

    return {
      billingAddress,
      requestPostalAddress,
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
    billingAddress: string;
    requestPostalAddress: string;
    requestType: ClientRequestType;
  },
) {
  const { baseNotes } = splitNotes(notes);

  const meta: ClientProfileMeta = {
    billingAddress: normalizeText(payload.billingAddress),
    requestPostalAddress: normalizeText(payload.requestPostalAddress),
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
