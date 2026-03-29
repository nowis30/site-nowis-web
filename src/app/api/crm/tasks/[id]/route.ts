import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { forbid, getApiSession, requireApiPermission, unauthorized } from '@/features/crm/auth/api-guard';
import { can } from '@/features/crm/auth/permissions';
import { normalizeOptionalString } from '@/features/crm/server/validators';
import { coerceTaskPayload, coerceTaskType } from '@/features/crm/tasks/task-normalization';
import { z } from 'zod';

const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).max(5000).optional(),
  description: z.string().max(20000).optional().nullable(),
  type: z.enum(['CALL', 'EMAIL', 'SONG', 'FOLLOW_UP']).optional(),
  payload: z.unknown().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().trim().optional().or(z.literal('')),
  caseId: z.string().uuid().optional().or(z.literal('')),
  songRequestId: z.string().uuid().optional().or(z.literal('')),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'tasks', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = taskUpdateSchema.parse(await request.json());
    const has = (key: keyof typeof payload) => Object.prototype.hasOwnProperty.call(payload, key);

    const data: Prisma.TaskUncheckedUpdateInput = {};

    if (has('title') && payload.title !== undefined) data.title = payload.title.trim();
    if (has('description')) data.description = normalizeOptionalString(payload.description ?? undefined);
    if (has('type') && payload.type) data.type = coerceTaskType(payload.type);
    if (has('payload')) data.payload = coerceTaskPayload(payload.payload) ?? Prisma.JsonNull;
    if (has('status') && payload.status) data.status = payload.status;
    if (has('priority') && payload.priority) data.priority = payload.priority;
    if (has('dueDate')) {
      if (!payload.dueDate) {
        data.dueDate = null;
      } else {
        const parsedDate = new Date(payload.dueDate);
        if (!Number.isNaN(parsedDate.getTime())) {
          data.dueDate = parsedDate;
        }
      }
    }
    if (has('caseId')) data.caseId = payload.caseId || null;
    if (has('songRequestId')) data.songRequestId = payload.songRequestId || null;

    const item = await prisma.task.update({
      where: { id: params.id },
      data,
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
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getApiSession(request);
  if (!session) {
    return unauthorized();
  }

  if (!can(session.role, 'tasks', 'delete')) {
    if (!can(session.role, 'tasks', 'update')) {
      return forbid();
    }
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      select: { status: true },
    });
    if (!task) {
      return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 });
    }
    if (task.status !== 'DONE') {
      return NextResponse.json(
        { error: 'Suppression autorisée uniquement pour les tâches terminées' },
        { status: 403 },
      );
    }
  }

  await prisma.task.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
