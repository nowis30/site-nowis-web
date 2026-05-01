import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { invoiceInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'invoices', 'read');
  if (guard.error) return guard.error;

  const item = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { contact: true },
  });
  if (!item) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'invoices', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = invoiceInputSchema.parse(await request.json());
    const item = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        number: payload.number.trim(),
        contactId: payload.contactId,
        issueDate: payload.issueDate ? new Date(payload.issueDate) : undefined,
        dueDate: new Date(payload.dueDate),
        amount: payload.amount,
        status: payload.status,
        description: normalizeOptionalString(payload.description),
      },
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'invoices', 'delete');
  if (guard.error) return guard.error;

  if (guard.session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Action réservée à un administrateur' }, { status: 403 });
  }

  await prisma.invoice.update({
    where: { id: params.id },
    data: {
      status: 'DELETED',
      deletedAt: new Date(),
      deletedBy: guard.session.sub,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'invoices', 'update');
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

  const current = await prisma.invoice.findUnique({ where: { id: params.id }, select: { status: true } });
  if (!current) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
  }

  const data =
    action === 'restore'
      ? { status: 'DRAFT' as const, deletedAt: null, deletedBy: null, deleteReason: null }
      : action === 'archive'
        ? { status: 'ARCHIVED' as const, deletedAt: null, deletedBy: null, deleteReason: null }
        : { status: 'DELETED' as const, deletedAt: new Date(), deletedBy: guard.session.sub, deleteReason: reason };

  const item = await prisma.invoice.update({ where: { id: params.id }, data });
  return NextResponse.json({ item, previousStatus: current.status });
}
