import Link from 'next/link';

export interface QuickActionItem {
  label: string;
  description?: string;
  href: string;
}

export function QuickActions({ items }: { items: QuickActionItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const isExternal = /^https?:\/\//.test(item.href);

        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            aria-label={isExternal ? `${item.label} (ouvre un nouvel onglet)` : undefined}
            className="group flex min-h-24 flex-col justify-center rounded-2xl border border-primary-500/15 bg-slate-950/45 p-4 transition hover:border-primary-500/40 hover:bg-slate-900/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none"
          >
            <p className="text-sm font-semibold text-white transition-colors group-hover:text-primary-100 motion-reduce:transition-none">{item.label}</p>
            {item.description ? <p className="mt-1 text-xs leading-5 text-slate-400">{item.description}</p> : null}
            {isExternal ? <span className="mt-2 text-[11px] font-medium text-primary-300">Ouvre un nouvel onglet</span> : null}
          </Link>
        );
      })}
    </div>
  );
}
