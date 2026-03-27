type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const toneClasses: Record<StatusTone, string> = {
  neutral: 'border-slate-600 bg-slate-800/50 text-slate-200',
  success: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
  warning: 'border-amber-500/50 bg-amber-500/10 text-amber-200',
  danger: 'border-rose-500/50 bg-rose-500/10 text-rose-200',
  info: 'border-primary-500/50 bg-primary-500/10 text-primary-200',
};

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: StatusTone }) {
  return <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${toneClasses[tone]}`}>{label}</span>;
}
