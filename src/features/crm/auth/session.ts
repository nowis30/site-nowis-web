import jwt from 'jsonwebtoken';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const CRM_COOKIE_NAME = 'crm_session';
export const CRM_OTP_COOKIE_NAME = 'crm_otp';

export type CrmRole = 'ADMIN' | 'ASSISTANT' | 'PORTAL_USER';

export interface CrmTokenPayload {
  sub: string;
  role: CrmRole;
  email: string;
  fullName: string;
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
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[CRM] JWT_SECRET manquante en production. Configurez la variable d\'environnement JWT_SECRET.');
    }
    return 'dev-only-secret-must-change-before-prod';
  }
  return secret;
}

export function signCrmToken(payload: CrmTokenPayload): string {
  return jwt.sign({ ...payload, scope: 'crm-session' }, getJwtSecret(), { algorithm: 'HS256', expiresIn: '30d' });
}

export function verifyCrmToken(token: string): CrmTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    // Preserve regular pre-upgrade sessions while refusing OTP and other token purposes.
    if (typeof decoded === 'string' || !hasCrmIdentity(decoded)
      || (decoded.scope !== undefined && decoded.scope !== 'crm-session')
      || decoded.otpCode !== undefined || decoded.otpVerifier !== undefined) return null;
    return { sub: decoded.sub, role: decoded.role, email: decoded.email, fullName: decoded.fullName };
  } catch {
    return null;
  }
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
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${CRM_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

export function getOtpTokenFromCookie(cookie?: string): string | null {
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${CRM_OTP_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

export function getCrmSessionFromCookieHeader(cookie?: string): CrmTokenPayload | null {
  const token = getTokenFromCookie(cookie);
  if (!token) return null;
  return verifyCrmToken(token);
}

export function signCrmOtpToken({ otpCode, ...identity }: CrmOtpInput): string {
  const nonce = randomUUID();
  return jwt.sign({ ...identity, scope: 'crm-otp', nonce, otpVerifier: otpVerifier({ ...identity, nonce }, otpCode) },
    getJwtSecret(), { algorithm: 'HS256', expiresIn: '10m' });
}

export function verifyCrmOtpToken(token: string): CrmOtpPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || !hasCrmIdentity(decoded) || decoded.scope !== 'crm-otp'
      || typeof decoded.nonce !== 'string' || !decoded.nonce
      || typeof decoded.otpVerifier !== 'string' || !/^[a-f0-9]{64}$/.test(decoded.otpVerifier)
      || decoded.otpCode !== undefined) return null;
    return decoded as CrmOtpPayload;
  } catch {
    return null;
  }
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
