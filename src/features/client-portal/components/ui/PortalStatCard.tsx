interface PortalStatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function PortalStatCard({ label, value, hint }: PortalStatCardProps) {
  return (
    <dl className="crm-surface rounded-2xl border border-primary-500/15 p-5 shadow-[0_8px_24px_rgba(2,6,23,0.22)]">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-300/80">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-white">{value}</dd>
      {hint ? <dd className="mt-1 text-sm leading-6 text-slate-400">{hint}</dd> : null}
    </dl>
  );
}
