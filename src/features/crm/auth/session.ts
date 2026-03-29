import jwt from 'jsonwebtoken';
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

interface CrmOtpPayload extends CrmTokenPayload {
  otpCode: string;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && !secret) {
    console.warn('[CRM] JWT_SECRET manquante en production. Fallback temporaire active.');
  }
  return secret || 'dev-only-secret-must-change-before-prod';
}

export function signCrmToken(payload: CrmTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '30d' });
}

export function verifyCrmToken(token: string): CrmTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as CrmTokenPayload;
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
  const match = cookie.match(new RegExp(`${CRM_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

export function getOtpTokenFromCookie(cookie?: string): string | null {
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`${CRM_OTP_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

export function getCrmSessionFromCookieHeader(cookie?: string): CrmTokenPayload | null {
  const token = getTokenFromCookie(cookie);
  if (!token) return null;
  return verifyCrmToken(token);
}

export function signCrmOtpToken(payload: CrmOtpPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '10m' });
}

export function verifyCrmOtpToken(token: string): CrmOtpPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as CrmOtpPayload;
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
