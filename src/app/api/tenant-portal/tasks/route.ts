import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyTenantPortalToken } from '@/lib/client-portal';

const tenantTaskSchema = z.object({
  token: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const payload = tenantTaskSchema.parse(await request.json());
    const session = verifyTenantPortalToken(payload.token);

    if (!session) {
      return NextResponse.json({ error: 'Lien locataire invalide' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'La creation de tache depuis le portail locataire est desactivee. Utilisez la messagerie ou la prise de rendez-vous.' },
      { status: 403 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Donnees invalides', details: error.issues }, { status: 400 });
    }

    console.error('[TENANT_PORTAL_TASK_CREATE_DISABLED]', error);
    return NextResponse.json({ error: 'Operation impossible' }, { status: 500 });
  }
}
