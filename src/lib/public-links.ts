import jwt from 'jsonwebtoken';

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

function getPublicLinksSecret() {
  const secret = process.env.PUBLIC_LINKS_JWT_SECRET || process.env.CLIENT_PORTAL_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('PUBLIC_LINKS_JWT_SECRET manquant.');
  }
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
    { expiresIn },
  );
}

export function verifyPublicQuoteToken(token: string): PublicQuoteTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getPublicLinksSecret()) as PublicQuoteTokenPayload;
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
    { expiresIn },
  );
}

export function verifyPublicInvoiceToken(token: string): PublicInvoiceTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getPublicLinksSecret()) as PublicInvoiceTokenPayload;
    return decoded.scope === 'public-invoice' ? decoded : null;
  } catch {
    return null;
  }
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
    { expiresIn },
  );
}

export function verifyPublicBillingToken(token: string): PublicBillingTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getPublicLinksSecret()) as PublicBillingTokenPayload;
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
