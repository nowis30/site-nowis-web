import Link from 'next/link';
import type { ContactTaskItem } from './types';
import { formatDateTime } from './formatters';

export function ContactTasks({ tasks }: { tasks: ContactTaskItem[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tasks.length === 0 ? <p className="text-sm text-slate-400">Aucune tâche pour ce contact.</p> : tasks.map((task) => (
        <article key={task.id} className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-white">{task.title}</h3>
            <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">{task.status}</span>
          </div>
          {task.description ? <p className="mt-3 text-sm text-slate-300">{task.description}</p> : null}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Priorité {task.priority}</span>
            <span>{formatDateTime(task.dueDate)}</span>
          </div>
          {task.href ? (
            <div className="mt-4">
              <Link href={task.href} className="text-sm font-medium text-primary-300 hover:text-primary-200">
                Ouvrir le message
              </Link>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
