import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

function getCalendarEncryptionSecret() {
  const value = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY?.trim();
  if (value) return value;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('CALENDAR_TOKEN_ENCRYPTION_KEY manquante en production.');
  }

  return 'dev-calendar-token-encryption-key-change-me';
}

function getEncryptionKey() {
  return createHash('sha256').update(getCalendarEncryptionSecret()).digest();
}

export function encryptCalendarToken(value: string | null | undefined) {
  if (!value) return null;

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decryptCalendarToken(value: string | null | undefined) {
  if (!value) return null;

  const [ivBase64, tagBase64, encryptedBase64] = value.split('.');
  if (!ivBase64 || !tagBase64 || !encryptedBase64) {
    throw new Error('Token chiffré calendrier invalide.');
  }

  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivBase64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagBase64, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}