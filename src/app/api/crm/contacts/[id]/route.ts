import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { contactInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'contacts', 'read');
  if (guard.error) return guard.error;
  const item = await prisma.contact.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'contacts', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = contactInputSchema.parse(await request.json());
    const item = await prisma.contact.update({
      where: { id: params.id },
      data: {
        type: payload.type,
        fullName: payload.fullName.trim(),
        email: normalizeOptionalString(payload.email),
        phone: normalizeOptionalString(payload.phone),
        source: normalizeOptionalString(payload.source),
        tags: payload.tags,
        notes: normalizeOptionalString(payload.notes),
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'contacts', 'delete');
  if (guard.error) return guard.error;

  if (guard.session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Action réservée à un administrateur' }, { status: 403 });
  }

  try {
    const contact = await prisma.contact.findUnique({ where: { id: params.id }, select: { id: true } });

    if (!contact) {
      return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
    }

    const [invoiceCount, songRequestCount] = await Promise.all([
      prisma.invoice.count({ where: { contactId: params.id } }),
      prisma.songRequest.count({ where: { contactId: params.id } }),
    ]);

    const blockers: string[] = [];
    if (invoiceCount > 0) blockers.push(`${invoiceCount} facture(s)`);
    if (songRequestCount > 0) blockers.push(`${songRequestCount} demande(s) chanson`);

    if (blockers.length > 0) {
      return NextResponse.json(
        {
          error: `Suppression bloquée: ce contact est lié à ${blockers.join(', ')}.`,
          code: 'CONTACT_DELETE_BLOCKED',
          blockers,
        },
        { status: 409 },
      );
    }

    await prisma.contact.update({
      where: { id: params.id },
      data: {
        crmStatus: 'DELETED',
        deletedAt: new Date(),
        deletedBy: guard.session.sub,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json(
        {
          error: 'Suppression impossible: le contact est encore référencé par d\'autres données.',
          code: 'CONTACT_DELETE_FOREIGN_KEY',
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Suppression impossible' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'contacts', 'update');
  if (guard.error) return guard.error;

  if (guard.session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Action réservée à un administrateur' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { action?: string; reason?: string };
  const action = body.action;
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : null;

  if (!action || !['archive', 'restore', 'delete'].includes(action)) {
    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  }

  const data =
    action === 'restore'
      ? { crmStatus: 'ACTIVE', deletedAt: null, deletedBy: null, deleteReason: null }
      : action === 'archive'
        ? { crmStatus: 'ARCHIVED', deletedAt: null, deletedBy: null, deleteReason: null }
        : { crmStatus: 'DELETED', deletedAt: new Date(), deletedBy: guard.session.sub, deleteReason: reason };

  try {
    const item = await prisma.contact.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Action impossible' }, { status: 400 });
  }
}
