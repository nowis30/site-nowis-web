interface PortalStatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function PortalStatCard({ label, value, hint }: PortalStatCardProps) {
  return (
    <article className="crm-surface rounded-2xl border border-slate-800/90 p-5 shadow-[0_6px_18px_rgba(2,6,23,0.22)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-tight text-white">{value}</p>
      {hint ? <p className="mt-1 text-sm leading-6 text-slate-400">{hint}</p> : null}
    </article>
  );
}
