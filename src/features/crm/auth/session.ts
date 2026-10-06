import jwt from 'jsonwebtoken';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { issueAuthGrant, verifyAuthGrant, readNamedCookie } from '@/lib/auth-grants';
import { getAuthSigningSecret } from '@/lib/auth-signing-secret';

export const CRM_COOKIE_NAME = 'crm_session';
export const CRM_OTP_COOKIE_NAME = 'crm_otp';

export type CrmRole = 'ADMIN' | 'ASSISTANT' | 'PORTAL_USER';

export interface CrmTokenPayload {
  sub: string;
  role: CrmRole;
  email: string;
  fullName: string;
  authVersion?: number;
  authIdentityHash?: string;
}

interface CrmOtpInput extends CrmTokenPayload {
  otpCode: string;
}

interface CrmOtpPayload extends CrmTokenPayload {
  scope: 'crm-otp';
  nonce: string;
  otpVerifier: string;
}

function hasCrmIdentity(value: jwt.JwtPayload): value is jwt.JwtPayload & CrmTokenPayload {
  return typeof value.sub === 'string' && Boolean(value.sub.trim())
    && ['ADMIN', 'ASSISTANT', 'PORTAL_USER'].includes(value.role)
    && typeof value.email === 'string' && Boolean(value.email.trim())
    && typeof value.fullName === 'string' && Boolean(value.fullName.trim());
}

function otpVerifier(payload: Pick<CrmOtpPayload, 'sub' | 'nonce'>, code: string) {
  return createHmac('sha256', getJwtSecret())
    .update(JSON.stringify(['crm-otp', payload.sub, payload.nonce, code])).digest('hex');
}

export function matchesCrmOtpCode(payload: CrmOtpPayload, code: string) {
  if (!/^\d{6}$/.test(code)) return false;
  const expected = Buffer.from(payload.otpVerifier, 'hex');
  const actual = Buffer.from(otpVerifier(payload, code), 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function getJwtSecret() {
  return getAuthSigningSecret(['JWT_SECRET'], 'dev-only-secret-must-change-before-prod');
}

export async function signCrmToken(payload: CrmTokenPayload): Promise<string> {
  return issueAuthGrant({ ...payload, scope: 'crm-session' }, getJwtSecret(), 30 * 86400);
}

export async function verifyCrmToken(token: string): Promise<CrmTokenPayload | null> {
  const decoded = await verifyAuthGrant(token, 'crm-session', getJwtSecret());
  if (!decoded || !hasCrmIdentity(decoded) || decoded.otpCode !== undefined || decoded.otpVerifier !== undefined) return null;
  return { sub: decoded.sub, role: decoded.role, email: decoded.email, fullName: decoded.fullName, authVersion: decoded.authVersion, authIdentityHash: decoded.authIdentityHash };
}

export function createCrmSessionCookie(token: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = 60 * 60 * 24 * 30; // 30 jours, cohérent avec expiresIn du JWT
  return `${CRM_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge};${isProd ? ' Secure;' : ''}`;
}

export function clearCrmSessionCookie(): string {
  const isProd = process.env.NODE_ENV === 'production';
  return `${CRM_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;${isProd ? ' Secure;' : ''}`;
}

export function createCrmOtpCookie(token: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = 60 * 10; // 10 minutes
  return `${CRM_OTP_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge};${isProd ? ' Secure;' : ''}`;
}

export function clearCrmOtpCookie(): string {
  const isProd = process.env.NODE_ENV === 'production';
  return `${CRM_OTP_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;${isProd ? ' Secure;' : ''}`;
}

export function getTokenFromCookie(cookie?: string): string | null {
  return readNamedCookie(cookie, CRM_COOKIE_NAME);
}

export function getOtpTokenFromCookie(cookie?: string): string | null {
  return readNamedCookie(cookie, CRM_OTP_COOKIE_NAME);
}

export async function getCrmSessionFromCookieHeader(cookie?: string): Promise<CrmTokenPayload | null> {
  const token = getTokenFromCookie(cookie);
  if (!token) return null;
  return verifyCrmToken(token);
}

export async function signCrmOtpToken({ otpCode, ...identity }: CrmOtpInput): Promise<string> {
  const nonce = randomUUID();
  return issueAuthGrant({ ...identity, scope: 'crm-otp', nonce, otpVerifier: otpVerifier({ ...identity, nonce }, otpCode) }, getJwtSecret(), 600);
}

export async function verifyCrmOtpToken(token: string): Promise<CrmOtpPayload | null> {
    const decoded = await verifyAuthGrant(token, 'crm-otp', getJwtSecret());
    if (!decoded || !hasCrmIdentity(decoded) || decoded.scope !== 'crm-otp'
      || typeof decoded.nonce !== 'string' || !decoded.nonce
      || typeof decoded.otpVerifier !== 'string' || !/^[a-f0-9]{64}$/.test(decoded.otpVerifier)
      || decoded.otpCode !== undefined) return null;
    return decoded as CrmOtpPayload;
}

export async function getCrmSessionServer(): Promise<CrmTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CRM_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCrmToken(token);
}

export async function requireCrmSession() {
  const session = await getCrmSessionServer();
  if (!session) {
    redirect('/crm/login');
  }
  return session;
}
