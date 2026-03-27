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
    <div className="mb-5 rounded-2xl border border-slate-800/90 bg-slate-950/40 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={`${filter.href}-${filter.label}`}
            href={filter.href}
            aria-current={filter.active ? 'page' : undefined}
            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 ${filter.active ? 'border-primary-500/50 bg-primary-500/15 text-primary-200' : 'border-slate-700 text-slate-300 hover:border-primary-500/40 hover:text-white'}`}
          >
            {filter.label}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
          >
            {action.label}
          </Link>
        ))}
      </div>
      </div>
    </div>
  );
}
