import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow = 'Portail client', title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="crm-surface relative overflow-hidden rounded-3xl border border-primary-500/20 p-5 shadow-[0_14px_36px_rgba(2,6,23,0.28)] sm:p-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-primary-500/10 blur-3xl"
      />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-300">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">{actions}</div> : null}
      </div>
    </header>
  );
}
