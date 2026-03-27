import Link from 'next/link';

export interface QuickActionItem {
  label: string;
  description?: string;
  href: string;
}

export function QuickActions({ items }: { items: QuickActionItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Link
          key={`${item.href}-${item.label}`}
          href={item.href}
          className="group rounded-2xl border border-slate-700 bg-slate-950/45 p-4 transition hover:border-primary-500/40 hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
        >
          <p className="text-sm font-semibold text-white group-hover:text-primary-100">{item.label}</p>
          {item.description ? <p className="mt-1 text-xs leading-5 text-slate-400">{item.description}</p> : null}
        </Link>
      ))}
    </div>
  );
}
