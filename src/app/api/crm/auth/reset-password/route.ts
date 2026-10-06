import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isStrongPassword } from '@/lib/password-reset';
import { completePasswordReset, InvalidPasswordReset } from '@/lib/complete-password-reset';
import { readAuthJson, limitAuth, authRequestErrorResponse } from '@/lib/auth-request-security';

export async function POST(request: NextRequest) {
  try {
    const payload = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), password: z.string().max(72)
      .refine(value => Buffer.byteLength(value, 'utf8') <= 72 && isStrongPassword(value)) }).strict().parse(await readAuthJson(request));
    await limitAuth(request, 'crm-reset', payload.token, 5);
    await completePasswordReset('crm', payload.token, payload.password);
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const securityError = authRequestErrorResponse(error);
    if (securityError) return securityError;
    if (error instanceof z.ZodError || error instanceof InvalidPasswordReset) {
      return NextResponse.json({ error: 'Lien invalide ou expiré, ou mot de passe trop faible.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }
    console.error('[PASSWORD_RESET]', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'Réinitialisation momentanément indisponible.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
