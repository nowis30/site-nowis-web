import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow = 'Portail client', title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="crm-surface rounded-3xl border border-slate-800/90 p-6 shadow-[0_8px_24px_rgba(2,6,23,0.25)] sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-white sm:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div> : null}
      </div>
    </header>
  );
}
