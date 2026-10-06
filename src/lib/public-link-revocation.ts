import { createHash, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { parseCompactPublicInvoiceToken, verifyCompactPublicInvoiceToken, verifyPublicBillingToken, verifyPublicInvoiceToken, verifyPublicQuoteToken } from '@/lib/public-links';

const scope = 'public-document-revoked';
const hash = (token: string) => createHash('sha256').update(`public-document:${token}`).digest('hex');

/** Also applies to already-issued JWT and compact links; never persist the capability itself. */
export async function isPublicLinkRevoked(token: string): Promise<boolean> {
  const row = await prisma.authGrant.findUnique({ where: { tokenHash: hash(token) }, select: { scope: true, revokedAt: true } });
  return row?.scope === scope && row.revokedAt !== null;
}

export function publicTokenFromInput(value: string): string {
  const token = value.trim();
  if (token.length > 6000) throw new Error('PUBLIC_LINK_INVALID');
  if (!token.startsWith('https://')) return token;
  const url = new URL(token);
  if (!['nowis.store', 'www.nowis.store'].includes(url.hostname) || url.port || url.username || url.password || url.search || url.hash) throw new Error('PUBLIC_LINK_INVALID');
  const match = /^\/(facture|soumission|facturation)\/([^/]+)$/.exec(url.pathname);
  if (!match) throw new Error('PUBLIC_LINK_INVALID');
  return decodeURIComponent(match[2]);
}

export async function revokePublicDocumentLink(token: string, adminId: string) {
  const payload = verifyPublicInvoiceToken(token) || verifyPublicQuoteToken(token) || verifyPublicBillingToken(token);
  let expiresAt: Date;
  if (payload) {
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    if (!Number.isSafeInteger(decoded.exp)) throw new Error('PUBLIC_LINK_INVALID');
    expiresAt = new Date(decoded.exp! * 1000);
  } else {
    const compact = parseCompactPublicInvoiceToken(token);
    if (!compact) throw new Error('PUBLIC_LINK_INVALID');
    const invoice = await prisma.invoice.findUnique({ where: { number: compact.invoiceNumber }, select: { id: true, number: true, contactId: true } });
    if (!invoice?.contactId || !verifyCompactPublicInvoiceToken(token, { invoiceId: invoice.id, invoiceNumber: invoice.number, contactId: invoice.contactId })) throw new Error('PUBLIC_LINK_INVALID');
    expiresAt = new Date(compact.expiresAt * 1000);
  }
  await prisma.authGrant.upsert({ where: { tokenHash: hash(token) }, create: { id: randomUUID(), tokenHash: hash(token), scope, identityHash: createHash('sha256').update(adminId).digest('hex'), expiresAt, revokedAt: new Date() }, update: { revokedAt: new Date() } });
}
