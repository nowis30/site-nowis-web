import Link from 'next/link';
import { Activity, Calendar, CheckSquare, CreditCard, FileText, Mail, MessageSquare, Music4, NotebookPen, Paperclip, Phone } from 'lucide-react';

export interface TimelineItem {
  id: string;
  kind: 'note' | 'call' | 'message' | 'email' | 'invoice' | 'payment' | 'appointment' | 'task' | 'file' | 'song-request' | 'activity';
  title: string;
  description?: string | null;
  date: string;
  badge?: string | null;
  href?: string | null;
  meta?: string | null;
}

const ICONS = {
  note: NotebookPen,
  call: Phone,
  message: MessageSquare,
  email: Mail,
  invoice: FileText,
  payment: CreditCard,
  appointment: Calendar,
  task: CheckSquare,
  file: Paperclip,
  'song-request': Music4,
  activity: Activity,
} as const;

const COLORS = {
  note: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
  call: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  message: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
  email: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200',
  invoice: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  payment: 'border-green-500/30 bg-green-500/10 text-green-200',
  appointment: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
  task: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
  file: 'border-slate-500/30 bg-slate-500/10 text-slate-200',
  'song-request': 'border-pink-500/30 bg-pink-500/10 text-pink-200',
  activity: 'border-slate-500/30 bg-slate-500/10 text-slate-200',
} as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function CrmTimeline({ items, emptyLabel = 'Aucun élément dans la timeline.' }: { items: TimelineItem[]; emptyLabel?: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">{emptyLabel}</p>;
  }

  return (
    <div className="relative pl-6">
      <div className="absolute bottom-0 left-3 top-0 w-px bg-gradient-to-b from-primary-500/30 via-slate-700 to-transparent" />
      <div className="space-y-5">
        {items.map((item) => {
          const Icon = ICONS[item.kind] || Activity;
          const colorClass = COLORS[item.kind] || COLORS.activity;

          return (
            <article key={item.id} className="relative rounded-[1.5rem] border border-slate-800 bg-slate-950/45 p-5">
              <div className={`absolute left-[-1.15rem] top-6 flex h-10 w-10 items-center justify-center rounded-full border ${colorClass}`}>
                <Icon size={16} />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    {item.badge ? <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300">{item.badge}</span> : null}
                  </div>
                  {item.meta ? <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.meta}</p> : null}
                  {item.description ? <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.description}</p> : null}
                  {item.href ? <Link href={item.href} className="text-sm text-primary-300 hover:text-primary-200">Ouvrir l’élément</Link> : null}
                </div>
                <p className="text-xs text-slate-500">{formatDateTime(item.date)}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
