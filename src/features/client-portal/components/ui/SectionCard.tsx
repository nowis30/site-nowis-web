import type { ReactNode } from 'react';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, subtitle, actions, children, className }: SectionCardProps) {
  return (
    <section
      className={`crm-surface rounded-3xl border border-primary-500/15 p-5 shadow-[0_10px_30px_rgba(2,6,23,0.24)] sm:p-7 ${className || ''}`.trim()}
    >
      {title || subtitle || actions ? (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h3> : null}
            {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
