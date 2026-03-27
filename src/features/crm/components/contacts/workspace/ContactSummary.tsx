import type { ContactWorkspaceContact } from './types';
import { formatDate } from './formatters';

export function ContactSummary({ contact }: { contact: ContactWorkspaceContact }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <section className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
          <h3 className="text-lg font-semibold text-white">Résumé du contact</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs text-slate-500">Email</p><p className="mt-2 text-sm text-white">{contact.email || '—'}</p></div>
            <div><p className="text-xs text-slate-500">Téléphone</p><p className="mt-2 text-sm text-white">{contact.phone || '—'}</p></div>
            <div><p className="text-xs text-slate-500">Entreprise</p><p className="mt-2 text-sm text-white">{contact.companyName || '—'}</p></div>
            <div><p className="text-xs text-slate-500">Source</p><p className="mt-2 text-sm text-white">{contact.source || '—'}</p></div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
          <h3 className="text-lg font-semibold text-white">Notes</h3>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{contact.notes || 'Aucune note générale enregistrée.'}</p>
        </section>

        <section className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Demandes de chanson</h3>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{contact.songRequests.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {contact.songRequests.length === 0 ? <p className="text-sm text-slate-400">Aucune demande de chanson enregistrée.</p> : contact.songRequests.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <span className="text-xs text-slate-500">{item.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{item.songType}{item.eventType ? ` · ${item.eventType}` : ''}</p>
                <p className="mt-2 text-xs text-slate-500">Créée le {formatDate(item.createdAt)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
        <h3 className="text-lg font-semibold text-white">Repères rapides</h3>
        <div className="mt-5 space-y-3 text-sm text-slate-300">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Créé le {formatDate(contact.createdAt)}</div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Tags: {contact.tags.length ? contact.tags.join(', ') : 'Aucun tag'}</div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Emails suivis: {contact.outboundEmails.length}</div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Messages / communications: {contact.communications.length}</div>
        </div>
      </section>
    </div>
  );
}
