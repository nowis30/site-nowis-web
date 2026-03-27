import type { ContactWorkspaceContact } from './types';
import { formatDate, formatMoney } from './formatters';

export function ContactHousing({ contact }: { contact: ContactWorkspaceContact }) {
  if (!contact.tenantProfile) {
    return <p className="text-sm text-slate-400">Aucun lien immobilier rattaché à ce contact.</p>;
  }

  return (
    <div className="space-y-4">
      <article className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
        <h3 className="text-base font-semibold text-white">Occupation actuelle</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">Unité</p>
            <p className="mt-2 text-sm text-white">{contact.tenantProfile.unit?.unitNumber || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Immeuble</p>
            <p className="mt-2 text-sm text-white">{contact.tenantProfile.unit?.property?.name || '—'}</p>
          </div>
        </div>
      </article>

      {contact.tenantProfile.leases.map((lease) => (
        <article key={lease.id} className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-white">Bail {lease.leaseNumber}</h3>
            <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">{lease.status}</span>
          </div>
          <p className="mt-3 text-sm text-slate-300">{formatDate(lease.startDate)} → {formatDate(lease.endDate)}</p>
          <p className="mt-2 text-sm text-slate-400">Loyer {formatMoney(lease.rentAmount)}</p>
        </article>
      ))}
    </div>
  );
}
