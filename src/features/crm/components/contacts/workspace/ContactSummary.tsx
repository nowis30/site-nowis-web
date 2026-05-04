import Link from 'next/link';
import type { ContactWorkspaceContact } from './types';
import { formatDate } from './formatters';

function buildOutlookHref(email: string) {
  return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}`;
}

function buildTelHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, '')}`;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard.writeText(value)}
      className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:border-primary-500/50 hover:text-white"
    >
      {label}
    </button>
  );
}

export function ContactSummary({ contact }: { contact: ContactWorkspaceContact }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <section className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
          <h3 className="text-lg font-semibold text-white">Résumé du contact</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Courriel</p>
              {contact.email ? (
                <div className="mt-2">
                  <a href={buildOutlookHref(contact.email)} target="_blank" rel="noreferrer" className="text-sm text-primary-200 hover:text-white">{contact.email}</a>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a href={buildOutlookHref(contact.email)} target="_blank" rel="noreferrer" className="rounded-md border border-primary-500/40 px-2 py-1 text-[11px] text-primary-200 hover:text-white">Outlook</a>
                    <CopyButton value={contact.email} label="Copier courriel" />
                  </div>
                </div>
              ) : <p className="mt-2 text-sm text-white">—</p>}
            </div>
            <div>
              <p className="text-xs text-slate-500">Téléphone</p>
              {contact.phone ? (
                <div className="mt-2">
                  <a href={buildTelHref(contact.phone)} className="text-sm text-primary-200 hover:text-white">{contact.phone}</a>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a href={buildTelHref(contact.phone)} className="rounded-md border border-primary-500/40 px-2 py-1 text-[11px] text-primary-200 hover:text-white">Appeler</a>
                    <CopyButton value={contact.phone} label="Copier téléphone" />
                  </div>
                </div>
              ) : <p className="mt-2 text-sm text-white">—</p>}
            </div>
            <div><p className="text-xs text-slate-500">Entreprise</p><p className="mt-2 text-sm text-white">{contact.companyName || '—'}</p></div>
            <div><p className="text-xs text-slate-500">Source</p><p className="mt-2 text-sm text-white">{contact.source || '—'}</p></div>
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500">Organisation liée</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {contact.organizations.length === 0 ? <span className="text-sm text-white">—</span> : contact.organizations.map((item) => (
                  <Link key={item.id} href={`/crm/organizations/${item.id}`} className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:border-primary-500/40 hover:text-white">
                    {item.name}{item.isPrimary ? ' · principale' : ''}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Ateliers liés</h3>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{contact.workshopRequests.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {contact.workshopRequests.length === 0 ? <p className="text-sm text-slate-400">Aucun atelier lié.</p> : contact.workshopRequests.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/crm/workshop-requests/${item.id}`} className="text-sm font-medium text-white hover:text-primary-200">{item.title}</Link>
                  <span className="text-xs text-slate-500">{item.status}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">Date souhaitée: {formatDate(item.requestedDate)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
          <h3 className="text-lg font-semibold text-white">Notes</h3>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{contact.notes || 'Aucune note générale enregistrée.'}</p>
        </section>

        <section className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
          <h3 className="text-lg font-semibold text-white">Facturation</h3>
          <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <p><span className="text-slate-500">Société</span><br />{contact.billingCompanyName || contact.companyName || '—'}</p>
            <p><span className="text-slate-500">Nom légal</span><br />{contact.billingLegalName || '—'}</p>
            <p><span className="text-slate-500">Courriel facturation</span><br />{contact.billingEmail || contact.email || '—'}</p>
            <p><span className="text-slate-500">Téléphone facturation</span><br />{contact.billingPhone || contact.phone || '—'}</p>
            <p className="sm:col-span-2"><span className="text-slate-500">Adresse</span><br />{[contact.billingAddressLine1, contact.billingAddressLine2, contact.billingCity, contact.billingState, contact.billingPostalCode, contact.billingCountry].filter(Boolean).join(', ') || '—'}</p>
            <p><span className="text-slate-500">Tax ID</span><br />{contact.billingTaxId || '—'}</p>
            <p className="sm:col-span-2"><span className="text-slate-500">Notes facturation</span><br />{contact.billingNotes || '—'}</p>
          </div>
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
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Communications suivies: {contact.communications.length}</div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Organisations liées: {contact.organizations.length}</div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Ateliers liés: {contact.workshopRequests.length}</div>
        </div>
      </section>
    </div>
  );
}
