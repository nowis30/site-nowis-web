import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { createHash, randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { getAuthSigningSecret } from '@/lib/auth-signing-secret';
import { validateUploadDescriptor } from '@/lib/validators/file-document';

const intentSchema = z.object({
  scope: z.literal('file-upload'),
  actorType: z.enum(['client', 'crm']),
  actorId: z.string().min(1).max(100),
  storageKey: z.string().min(8).max(500),
  originalName: z.string().min(1).max(240),
  mimeType: z.string().min(3).max(120),
  size: z.number().int().positive(),
  exp: z.number().int().positive(),
  jti: z.string().uuid(),
});

export type UploadActor = { actorType: 'client' | 'crm'; actorId: string };
export type UploadDescriptor = { storageKey: string; originalName: string; mimeType: string; size: number };

export class InvalidUploadIntent extends Error {
  constructor() { super('Upload invalide ou expiré. Préparez à nouveau le fichier.'); }
}

function getSecret() {
  return getAuthSigningSecret(
    ['FILE_UPLOAD_JWT_SECRET', 'CLIENT_PORTAL_JWT_SECRET', 'JWT_SECRET'],
    'dev-only-portal-secret-must-change',
  );
}

export function getUploadFolder(actor: UploadActor) {
  // The actor identifier comes only from the authenticated server session.
  if (!/^[a-zA-Z0-9_-]+$/.test(actor.actorId)) throw new InvalidUploadIntent();
  return actor.actorType === 'client' ? `client-files/${actor.actorId}` : `crm-files/${actor.actorId}`;
}

export function signFileUploadIntent(actor: UploadActor, file: UploadDescriptor) {
  validateUploadDescriptor(file);
  if (!file.storageKey.startsWith(`${getUploadFolder(actor)}/staging/`)) throw new InvalidUploadIntent();
  return jwt.sign({ ...actor, ...file, scope: 'file-upload' }, getSecret(), { algorithm: 'HS256', expiresIn: '30m', jwtid: randomUUID() });
}

export function verifyFileUploadIntent(token: string, actor: UploadActor, file: UploadDescriptor) {
  try {
    const intent = intentSchema.parse(jwt.verify(token, getSecret(), { algorithms: ['HS256'] }));
    if (intent.actorType !== actor.actorType || intent.actorId !== actor.actorId
      || intent.storageKey !== file.storageKey || intent.mimeType !== file.mimeType
      || intent.size !== file.size || intent.originalName !== file.originalName
      || !file.storageKey.startsWith(`${getUploadFolder(actor)}/staging/`)) throw new InvalidUploadIntent();
    validateUploadDescriptor(file);
    return intent;
  } catch {
    throw new InvalidUploadIntent();
  }
}

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const uploadIdentityHash = (actor: UploadActor, file: UploadDescriptor) =>
  hash(JSON.stringify([actor.actorType, actor.actorId, file.storageKey, file.originalName, file.mimeType, file.size]));

export async function issueFileUploadIntent(actor: UploadActor, file: UploadDescriptor) {
  const token = signFileUploadIntent(actor, file);
  const intent = verifyFileUploadIntent(token, actor, file);
  await prisma.authGrant.create({ data: { id: intent.jti, tokenHash: hash(token), scope: 'file-upload',
    identityHash: uploadIdentityHash(actor, file), expiresAt: new Date(intent.exp * 1000) } });
  return token;
}

export async function claimFileUploadIntent(token: string, actor: UploadActor, file: UploadDescriptor) {
  const intent = verifyFileUploadIntent(token, actor, file);
  const result = await prisma.authGrant.updateMany({ where: { id: intent.jti, tokenHash: hash(token), scope: 'file-upload',
    identityHash: uploadIdentityHash(actor, file), usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
  data: { usedAt: new Date() } });
  if (result.count !== 1) throw new InvalidUploadIntent();
}

export function canClientAccessStoredDocumentKey(storageKey: string, contactId: string) {
  return !storageKey.startsWith('client-files/')
    || (storageKey.startsWith(`${getUploadFolder({ actorType: 'client', actorId: contactId })}/`)
      && !storageKey.startsWith(`${getUploadFolder({ actorType: 'client', actorId: contactId })}/staging/`));
}

export function canClientDeleteStoredDocument(document: {
  contactId: string | null;
  uploadedByUserId: string | null;
  invoiceId: string | null;
  commercialQuoteId: string | null;
  storageKey: string;
}, contactId: string) {
  if (document.contactId !== contactId || document.uploadedByUserId !== null
    || document.invoiceId || document.commercialQuoteId) return false;
  // Existing client uploads remain available through their persisted ownership.
  // Newly namespaced files must also belong to that exact Contact.
  return canClientAccessStoredDocumentKey(document.storageKey, contactId);
}
