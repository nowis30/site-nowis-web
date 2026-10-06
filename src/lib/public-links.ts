import jwt from 'jsonwebtoken';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getAuthSigningSecret } from '@/lib/auth-signing-secret';

export type PublicQuoteTokenPayload = {
  scope: 'public-quote';
  quoteId: string;
  contactId: string | null;
};

export type PublicInvoiceTokenPayload = {
  scope: 'public-invoice';
  invoiceId: string;
  contactId: string;
  serviceType?: 'song' | 'workshop' | 'general';
};

export type PublicBillingTokenPayload = {
  scope: 'public-billing';
  contactId: string;
  invoiceId?: string;
  quoteId?: string;
};

export type CompactPublicInvoiceToken = {
  invoiceNumber: string;
  expiresAt: number;
  signature: string;
};

const COMPACT_INVOICE_LINK_VERSION = 'i1';

function getPublicLinksSecret() {
  const secret = getAuthSigningSecret(['PUBLIC_LINKS_JWT_SECRET', 'CLIENT_PORTAL_JWT_SECRET', 'JWT_SECRET'], '');
  if (!secret) throw new Error('PUBLIC_LINKS_JWT_SECRET manquant.');
  return secret;
}

export function signPublicQuoteToken(input: { quoteId: string; contactId?: string | null; expiresIn?: string }) {
  const expiresIn = (input.expiresIn || '30d') as jwt.SignOptions['expiresIn'];
  return jwt.sign(
    {
      scope: 'public-quote',
      quoteId: input.quoteId,
      contactId: input.contactId || null,
    } satisfies PublicQuoteTokenPayload,
    getPublicLinksSecret(),
    { expiresIn, algorithm: 'HS256' },
  );
}

export function verifyPublicQuoteToken(token: string): PublicQuoteTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getPublicLinksSecret(), { algorithms: ['HS256'] }) as PublicQuoteTokenPayload;
    return decoded.scope === 'public-quote' ? decoded : null;
  } catch {
    return null;
  }
}

export function signPublicInvoiceToken(input: {
  invoiceId: string;
  contactId: string;
  serviceType?: 'song' | 'workshop' | 'general';
  expiresIn?: string;
}) {
  const expiresIn = (input.expiresIn || '30d') as jwt.SignOptions['expiresIn'];
  return jwt.sign(
    {
      scope: 'public-invoice',
      invoiceId: input.invoiceId,
      contactId: input.contactId,
      serviceType: input.serviceType,
    } satisfies PublicInvoiceTokenPayload,
    getPublicLinksSecret(),
    { expiresIn, algorithm: 'HS256' },
  );
}

export function verifyPublicInvoiceToken(token: string): PublicInvoiceTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getPublicLinksSecret(), { algorithms: ['HS256'] }) as PublicInvoiceTokenPayload;
    return decoded.scope === 'public-invoice' ? decoded : null;
  } catch {
    return null;
  }
}

export function signCompactPublicInvoiceToken(input: {
  invoiceId: string;
  invoiceNumber: string;
  contactId: string;
  expiresInDays?: number;
}) {
  const expiresAt = Math.floor(Date.now() / 1000) + (input.expiresInDays || 30) * 24 * 60 * 60;
  const expiry = expiresAt.toString(36);
  const unsigned = `${COMPACT_INVOICE_LINK_VERSION}.${input.invoiceNumber}.${expiry}`;
  const signature = createHmac('sha256', getPublicLinksSecret())
    .update(`${unsigned}|${input.invoiceId}|${input.contactId}`)
    .digest('base64url')
    .slice(0, 24);

  return `${unsigned}.${signature}`;
}

export function parseCompactPublicInvoiceToken(token: string): CompactPublicInvoiceToken | null {
  if (token.length > 256) return null;
  const [version, invoiceNumber, expiry, signature, ...extra] = token.split('.');
  if (version !== COMPACT_INVOICE_LINK_VERSION || !invoiceNumber || !expiry || !signature || extra.length > 0) {
    return null;
  }

  const expiresAt = Number.parseInt(expiry, 36);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= 0 || expiresAt.toString(36) !== expiry
    || !/^[A-Za-z0-9_-]{24}$/.test(signature) || !/^[A-Za-z0-9_-]{1,120}$/.test(invoiceNumber)) {
    return null;
  }

  return { invoiceNumber, expiresAt, signature };
}

export function verifyCompactPublicInvoiceToken(
  token: string,
  input: { invoiceId: string; invoiceNumber: string; contactId: string },
) {
  const parsed = parseCompactPublicInvoiceToken(token);
  if (!parsed || parsed.invoiceNumber !== input.invoiceNumber || parsed.expiresAt < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expiry = parsed.expiresAt.toString(36);
  const unsigned = `${COMPACT_INVOICE_LINK_VERSION}.${input.invoiceNumber}.${expiry}`;
  const expected = createHmac('sha256', getPublicLinksSecret())
    .update(`${unsigned}|${input.invoiceId}|${input.contactId}`)
    .digest('base64url')
    .slice(0, 24);

  const actualBuffer = Buffer.from(parsed.signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function signPublicBillingToken(input: {
  contactId: string;
  invoiceId?: string;
  quoteId?: string;
  expiresIn?: string;
}) {
  const expiresIn = (input.expiresIn || '14d') as jwt.SignOptions['expiresIn'];
  return jwt.sign(
    {
      scope: 'public-billing',
      contactId: input.contactId,
      invoiceId: input.invoiceId,
      quoteId: input.quoteId,
    } satisfies PublicBillingTokenPayload,
    getPublicLinksSecret(),
    { expiresIn, algorithm: 'HS256' },
  );
}

export function verifyPublicBillingToken(token: string): PublicBillingTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getPublicLinksSecret(), { algorithms: ['HS256'] }) as PublicBillingTokenPayload;
    return decoded.scope === 'public-billing' ? decoded : null;
  } catch {
    return null;
  }
}

export function buildPublicQuoteUrl(token: string, origin: string) {
  return `${origin.replace(/\/$/, '')}/soumission/${encodeURIComponent(token)}`;
}

export function buildPublicInvoiceUrl(token: string, origin: string) {
  return `${origin.replace(/\/$/, '')}/facture/${encodeURIComponent(token)}`;
}

export function buildPublicBillingUrl(token: string, origin: string) {
  return `${origin.replace(/\/$/, '')}/facturation/${encodeURIComponent(token)}`;
}
