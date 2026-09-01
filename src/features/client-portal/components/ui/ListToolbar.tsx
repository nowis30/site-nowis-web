import Link from 'next/link';

export interface ToolbarFilter {
  label: string;
  href: string;
  active?: boolean;
}

export interface ToolbarAction {
  label: string;
  href: string;
}

interface ListToolbarProps {
  filters?: ToolbarFilter[];
  actions?: ToolbarAction[];
}

export function ListToolbar({ filters = [], actions = [] }: ListToolbarProps) {
  if (!filters.length && !actions.length) return null;

  return (
    <div className="mb-5 rounded-2xl border border-primary-500/15 bg-slate-950/45 p-3 shadow-[0_8px_24px_rgba(2,6,23,0.18)] sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          {filters.map((filter) => (
            <Link
              key={`${filter.href}-${filter.label}`}
              href={filter.href}
              aria-current={filter.active ? 'page' : undefined}
              className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-3 py-2 text-center text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none sm:text-left ${filter.active ? 'border-primary-400/50 bg-primary-500/15 text-primary-100' : 'border-slate-700 text-slate-300 hover:border-primary-500/40 hover:bg-slate-900/70 hover:text-white'}`}
            >
              {filter.label}
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-700 px-3 py-2 text-center text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:bg-slate-900/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none sm:whitespace-nowrap"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
