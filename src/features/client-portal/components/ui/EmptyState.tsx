import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-primary-500/20 bg-slate-950/45 p-7 text-center shadow-[0_8px_24px_rgba(2,6,23,0.16)] sm:p-8">
      {icon ? (
        <div aria-hidden="true" className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-500/10 text-primary-200">
          {icon}
        </div>
      ) : null}
      <p className="text-base font-semibold tracking-tight text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
