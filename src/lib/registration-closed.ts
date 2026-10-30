import { NextResponse } from 'next/server';
import { principalCrmUrl } from './principal-crm';

export function registrationClosedResponse() {
  return NextResponse.json({
    error: 'Les inscriptions sont fermées sur cet ancien site. Utilisez le CRM principal.',
    message: 'Les inscriptions sont fermées sur cet ancien site. Utilisez le CRM principal.',
    code: 'REGISTRATION_CLOSED',
    crmUrl: principalCrmUrl,
  }, { status: 410, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}
