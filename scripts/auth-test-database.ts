import { prisma } from '@/lib/prisma';

export const adminId = '11111111-1111-4111-8111-111111111111';
export const portalId = '22222222-2222-4222-8222-222222222222';
export const contactId = '33333333-3333-4333-8333-333333333333';
export async function withAuthDatabase(run: (state: any) => Promise<void>) {
  const admin = { id: adminId, role: 'ADMIN', email: 'admin@example.test', fullName: 'Admin Test', isActive: true,
    authVersion: 0, passwordHash: 'test-placeholder', emailVerifiedAt: new Date('2026-01-01'), contactId: null, contact: null };
  const portal = { id: portalId, role: 'PORTAL_USER', email: 'portal@example.test', fullName: 'Portal Test', isActive: true,
    authVersion: 0, passwordHash: 'test-placeholder', emailVerifiedAt: new Date('2026-01-01'), contactId };
  const contact = { id: contactId, fullName: portal.fullName, email: portal.email, authVersion: 0, deletedAt: null };
  const users = [admin, portal], grants = new Map<string, any>(), resets = new Map<string, any>(), rateLimits = new Map<string, any>();
  const state: any = { admin, portal, contact, users, grants, resets, rateLimits, unavailable: false, removedOauth: 0 };
  const ensure = () => { if (state.unavailable) throw new Error('Test database unavailable'); };
  const relation = (user: any) => ({ ...user, contact: user.contactId === contact.id ? { ...contact } : null });
  const snapshot = () => ({ ...contact, userAccount: users.find(user => user.contactId === contact.id) || null });
  const matches = (row: any, where: any): boolean => Object.entries(where || {}).every(([key, value]: any) => {
    if (key === 'OR') return value.some((clause: any) => matches(row, clause));
    if (value && typeof value === 'object' && 'equals' in value) return value.mode === 'insensitive'
      ? String(row[key]).toLowerCase() === String(value.equals).toLowerCase() : row[key] === value.equals;
    if (value && typeof value === 'object') return row[key] != null && matches(row[key], value);
    return row[key] === value;
  });
  const edits: Array<[any, string, any]> = [];
  const replace = (object: any, method: string, value: any) => { edits.push([object, method, object[method]]); object[method] = value; };
  replace(prisma.authGrant, 'create', async ({ data }: any) => { ensure(); const row = { usedAt: null, revokedAt: null, ...data }; grants.set(row.tokenHash, row); return row; });
  replace(prisma.authGrant, 'findUnique', async ({ where }: any) => { ensure(); return grants.get(where.tokenHash) || null; });
  replace(prisma.authGrant, 'updateMany', async ({ where, data }: any) => { ensure(); const row = grants.get(where.tokenHash);
    if (!row || (where.scope && row.scope !== where.scope) || ('usedAt' in where && row.usedAt !== where.usedAt)
      || ('revokedAt' in where && row.revokedAt !== where.revokedAt) || (where.expiresAt && row.expiresAt <= where.expiresAt.gt)) return { count: 0 };
    Object.assign(row, data); return { count: 1 }; });
  replace(prisma.user, 'findUnique', async ({ where }: any) => { ensure(); const user = users.find(u => where.id ? u.id === where.id : u.email === where.email); return user ? relation(user) : null; });
  replace(prisma.user, 'findFirst', async ({ where }: any) => { ensure(); return users.map(relation).find(user => matches(user, where)) || null; });
  replace(prisma.contact, 'findUnique', async ({ where }: any) => { ensure(); return where.id === contact.id && !state.contactMissing ? snapshot() : null; });
  replace(prisma.contact, 'findFirst', async ({ where }: any) => { ensure(); const row = snapshot(); return !state.contactMissing && matches(row, where) ? row : null; });
  const update = ({ where, data }: any) => { ensure(); const user = users.find(u => u.id === where.id);
    if (!user || (where.authVersion !== undefined && where.authVersion !== user.authVersion) || (where.isActive !== undefined && where.isActive !== user.isActive)) return null;
    for (const [key, value] of Object.entries(data)) (user as any)[key] = key === 'authVersion' && typeof value === 'object' ? user.authVersion + (value as any).increment : value;
    return relation(user); };
  replace(prisma.user, 'update', async (args: any) => { const user = update(args); if (!user) throw new Error('Missing user'); return user; });
  replace(prisma.user, 'updateMany', async (args: any) => ({ count: update(args) ? 1 : 0 }));
  replace(prisma.passwordResetToken, 'findUnique', async ({ where }: any) => { ensure(); const row = resets.get(where.tokenHash); return row ? { ...row, user: relation(users.find(u => u.id === row.userId)) } : null; });
  replace(prisma.passwordResetToken, 'create', async ({ data }: any) => { ensure(); const row = { id: 'reset-fixture', usedAt: null, ...data }; resets.set(row.tokenHash, row); return row; });
  replace(prisma.passwordResetToken, 'updateMany', async ({ where, data }: any) => { ensure(); const row = [...resets.values()].find(r => r.id === where.id);
    if (!row || row.usedAt || row.expiresAt <= where.expiresAt.gt || row.authVersion !== where.authVersion) return { count: 0 };
    Object.assign(row, data); return { count: 1 }; });
  replace(prisma.passwordResetToken, 'deleteMany', async ({ where }: any) => { ensure(); let count = 0; for (const [key, row] of resets) {
    if (row.userId === where.userId && (!where.id || row.id !== where.id.not)) { resets.delete(key); count++; } } return { count }; });
  replace(prisma.clientOAuthAccount, 'deleteMany', async () => { ensure(); state.removedOauth++; return { count: 1 }; });
  replace(prisma.apiRateLimit, 'findUnique', async ({ where }: any) => { ensure(); return rateLimits.get(JSON.stringify(where.scope_identifier_windowStart)) || null; });
  replace(prisma.apiRateLimit, 'create', async ({ data }: any) => { ensure(); const row = { id: String(rateLimits.size + 1), ...data };
    rateLimits.set(JSON.stringify({ scope: data.scope, identifier: data.identifier, windowStart: data.windowStart }), row); return row; });
  replace(prisma.apiRateLimit, 'update', async ({ where, data }: any) => { ensure(); const row = [...rateLimits.values()].find(r => r.id === where.id); Object.assign(row, data); return row; });
  replace(prisma.apiRateLimit, 'deleteMany', async () => { ensure(); return { count: 0 }; });
  replace(prisma, '$transaction', async (callback: any) => { ensure(); return typeof callback === 'function' ? callback(prisma) : Promise.all(callback); });
  try { await run(state); } finally { for (const [object, method, old] of edits.reverse()) object[method] = old; }
}
