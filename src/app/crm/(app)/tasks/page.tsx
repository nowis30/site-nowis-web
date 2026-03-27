import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { TasksPage } from '@/features/crm/components/tasks/TasksPage';

export default async function CrmTasksPage() {
  await requireCrmSession();

  const [todo, inProgress, done] = await Promise.all([
    prisma.task.findMany({
      where: { status: 'TODO' },
      include: { caseRecord: { select: { title: true, referenceCode: true } } },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    }),
    prisma.task.findMany({
      where: { status: 'IN_PROGRESS' },
      include: { caseRecord: { select: { title: true, referenceCode: true } } },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    }),
    prisma.task.findMany({
      where: { status: 'DONE' },
      include: { caseRecord: { select: { title: true, referenceCode: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
  ]);

  function mapTask(item: (typeof todo)[number]) {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status as 'TODO' | 'IN_PROGRESS' | 'DONE',
      priority: item.priority as 'LOW' | 'MEDIUM' | 'HIGH',
      dueDate: item.dueDate?.toISOString() ?? null,
      caseRecord: item.caseRecord,
    };
  }
  return <TasksPage todo={todo.map(mapTask)} inProgress={inProgress.map(mapTask)} done={done.map(mapTask)} />;
}
