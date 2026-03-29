import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { taskInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';
import { coerceTaskPayload, coerceTaskType } from '@/features/crm/tasks/task-normalization';
import { z } from 'zod';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'tasks', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = taskInputSchema.parse(await request.json());
    const item = await prisma.task.update({
      where: { id: params.id },
      data: {
        title: payload.title.trim(),
        description: normalizeOptionalString(payload.description),
        type: payload.type,
        payload: payload.payload ?? undefined,
        status: payload.status,
        priority: payload.priority,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        caseId: payload.caseId || null,
        songRequestId: payload.songRequestId || null,
      },
    });
    return NextResponse.json({
      item: {
        ...item,
        type: coerceTaskType(item.type),
        payload: coerceTaskPayload(item.payload),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'tasks', 'delete');
  if (guard.error) return guard.error;

  await prisma.task.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
