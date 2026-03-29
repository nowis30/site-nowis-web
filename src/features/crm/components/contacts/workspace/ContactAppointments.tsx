import type { ContactAppointmentItem } from './types';
import { formatDateTime } from './formatters';

export function ContactAppointments({ appointments }: { appointments: ContactAppointmentItem[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {appointments.length === 0 ? <p className="text-sm text-slate-400">Aucun rendez-vous lié à ce contact.</p> : appointments.map((item) => (
        <article key={item.id} className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-white">{item.title}</h3>
            <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">{item.status}</span>
          </div>
          <p className="mt-3 text-sm text-slate-300">{formatDateTime(item.startAt)} → {formatDateTime(item.endAt)}</p>
          {item.description ? <p className="mt-3 text-sm text-slate-400">{item.description}</p> : null}
        </article>
      ))}
    </div>
  );
}
