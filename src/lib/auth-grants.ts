import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
type AuthDatabase = Pick<Prisma.TransactionClient, 'user' | 'contact' | 'authGrant'>;

export type GrantPayload = jwt.JwtPayload & { scope: string };
const normalize = (value: string) => value.trim().toLowerCase();
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

// Reload current account state on every authorization. DB errors propagate;
// they never become fallback identities or emergency administrator sessions.
async function currentIdentityHash(payload: GrantPayload, database: AuthDatabase = prisma): Promise<string | null> {
  if (['crm-session', 'crm-otp'].includes(payload.scope)) {
    if (!uuid(payload.sub)) return null;
    const user = await database.user.findUnique({ where: { id: payload.sub }, include: { contact: true } });
    if (!user || !user.isActive || !['ADMIN', 'ASSISTANT'].includes(user.role)
      || user.role !== payload.role || normalize(user.email) !== normalize(String(payload.email))
      || user.contact?.deletedAt) return null;
    if (payload.authVersion !== undefined && payload.authVersion !== user.authVersion) return null;
    return hash(JSON.stringify([user.id, user.authVersion, user.passwordHash, user.email, user.role, user.isActive,
      user.emailVerifiedAt, user.contactId, user.contact?.authVersion ?? null]));
  }
  if (payload.scope === 'client-impersonation') {
    if (!uuid(payload.adminId) || !uuid(payload.contactId)) return null;
    const [admin, contact] = await Promise.all([
      database.user.findUnique({ where: { id: payload.adminId } }),
      database.contact.findUnique({ where: { id: payload.contactId } }),
    ]);
    if (!admin?.isActive || admin.role !== 'ADMIN' || !contact || contact.deletedAt) return null;
    return hash(JSON.stringify([admin.id, admin.authVersion, admin.passwordHash, admin.email, admin.role, contact.id, contact.authVersion]));
  }
  if (['client-dashboard', 'client-login', 'song-request-portal'].includes(payload.scope)) {
    if (!uuid(payload.contactId) || typeof payload.email !== 'string') return null;
    const contact = await database.contact.findUnique({ where: { id: payload.contactId }, include: { userAccount: true } });
    const user = contact?.userAccount;
    if (!contact || contact.deletedAt || !contact.email || normalize(contact.email) !== normalize(payload.email)
      || (user && (!user.isActive || user.role !== 'PORTAL_USER' || normalize(user.email) !== normalize(payload.email)))
      || (user && payload.scope !== 'client-login' && !user.emailVerifiedAt)) return null;
    if (payload.authVersion !== undefined && payload.authVersion !== (user?.authVersion ?? null)) return null;
    if (payload.authUserId !== undefined && payload.authUserId !== (user?.id ?? null)) return null;
    if (payload.contactVersion !== undefined && payload.contactVersion !== contact.authVersion) return null;
    return hash(JSON.stringify([contact.id, contact.authVersion, contact.email,
      user ? [user.id, user.authVersion, user.passwordHash, user.email, user.role, user.isActive, user.emailVerifiedAt] : null]));
  }
  // Publicly versioned JSON credentials are never identities in production.
  if (payload.scope === 'legacy-session' && process.env.NODE_ENV !== 'production') {
    const { getUserById } = await import('@/lib/db');
    const user = typeof payload.sub === 'string' ? await getUserById(payload.sub) : null;
    if (!user || user.role !== payload.role || user.email !== payload.email) return null;
    return hash(JSON.stringify([user.id, user.passwordHash, user.role, user.email]));
  }
  return null;
}

export async function issueAuthGrant(payload: GrantPayload, secret: string, seconds: number, database: AuthDatabase = prisma): Promise<string> {
  const identityHash = await currentIdentityHash(payload, database);
  if (!identityHash) throw new Error('AUTH_IDENTITY_UNAVAILABLE');
  if (payload.authIdentityHash !== undefined && payload.authIdentityHash !== identityHash) throw new Error('AUTH_IDENTITY_CHANGED');
  const id = randomUUID();
  const token = jwt.sign({ ...payload, authIdentityHash: identityHash, authFormat: 2 }, secret, { algorithm: 'HS256', jwtid: id, expiresIn: seconds });
  await database.authGrant.create({ data: { id, scope: payload.scope, tokenHash: hash(token), identityHash,
    expiresAt: new Date(Date.now() + seconds * 1000) } });
  return token;
}

export async function verifyAuthGrant(token: string, scope: string, secret: string): Promise<GrantPayload | null> {
  let decoded: jwt.JwtPayload;
  try {
    const value = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (typeof value === 'string' || value.scope !== scope || value.authFormat !== 2 || !uuid(value.jti)
      || !Number.isInteger(value.iat) || !Number.isInteger(value.exp)) return null;
    decoded = value;
  } catch { return null; }
  const grant = await prisma.authGrant.findUnique({ where: { tokenHash: hash(token) } });
  if (!grant || grant.id !== decoded.jti || grant.scope !== scope || grant.usedAt || grant.revokedAt || grant.expiresAt <= new Date()) return null;
  const current = await currentIdentityHash(decoded as GrantPayload);
  if (!current) return null;
  const left = Buffer.from(current, 'hex'), right = Buffer.from(grant.identityHash, 'hex');
  return left.length === right.length && timingSafeEqual(left, right) ? decoded as GrantPayload : null;
}

// Atomic claim: simultaneous OTP/magic-link redemptions have one winner.
export async function consumeAuthGrant(token: string, scope: string): Promise<boolean> {
  const result = await prisma.authGrant.updateMany({ where: { tokenHash: hash(token), scope, usedAt: null,
    revokedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
  return result.count === 1;
}
export async function revokeAuthGrant(token: string | null | undefined) {
  if (token) await prisma.authGrant.updateMany({ where: { tokenHash: hash(token), revokedAt: null }, data: { revokedAt: new Date() } });
}
export function readNamedCookie(cookie: string | null | undefined, name: string): string | null {
  if (!cookie) return null;
  const values = cookie.split(';').map(part => part.trim()).filter(part => part.startsWith(`${name}=`));
  return values.length === 1 ? values[0].slice(name.length + 1) || null : null;
}
