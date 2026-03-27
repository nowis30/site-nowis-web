import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { useState } from 'react';
import type { ContactWorkspaceContact } from './types';

export type ContactActionType = 'note' | 'task' | 'invoice' | 'appointment' | 'lease' | 'song-request';

export function ContactHeader({
  contact,
  stats,
  onAction,
  canImpersonate,
  onImpersonate,
}: {
  contact: ContactWorkspaceContact;
  stats: Array<{ label: string; value: number }>;
  onAction: (action: ContactActionType) => void;
  canImpersonate: boolean;
  onImpersonate: () => Promise<void>;
}) {
  const [impersonating, setImpersonating] = useState(false);

  async function handleImpersonate() {
    if (impersonating) return;
    setImpersonating(true);
    try {
      await onImpersonate();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'activation';
      window.alert(message);
    } finally {
      setImpersonating(false);
    }
  }

  return (
    <div className="crm-surface overflow-hidden p-6 lg:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <Link href="/crm/contacts" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
            <ArrowLeft size={15} /> Retour aux contacts
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-semibold text-white">{contact.fullName}</h1>
            <span className="rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-sm text-primary-200">{contact.type}</span>
            {contact.tenantProfile ? <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">Locataire lié</span> : null}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">Dossier complet centralisé avec activité, tâches, rendez-vous, factures, documents, emails et liens immobiliers. Le contenu reste dans une zone de lecture propre, sans compression ni panneau caché.</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
            {contact.email ? <span>{contact.email}</span> : null}
            {contact.phone ? <span>{contact.phone}</span> : null}
            {contact.companyName ? <span>{contact.companyName}</span> : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:w-[28rem]">
          {canImpersonate ? (
            <button
              onClick={handleImpersonate}
              disabled={impersonating}
              className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-100 hover:border-amber-400 hover:bg-amber-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={15} className="mb-2" /> {impersonating ? 'Activation...' : 'Voir comme client'}
            </button>
          ) : null}
          <button onClick={() => onAction('note')} className="rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-left text-sm text-slate-200 hover:border-primary-500/40 hover:text-white"><Plus size={15} className="mb-2" /> Ajouter note</button>
          <button onClick={() => onAction('task')} className="rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-left text-sm text-slate-200 hover:border-primary-500/40 hover:text-white"><Plus size={15} className="mb-2" /> Ajouter tâche</button>
          <button onClick={() => onAction('invoice')} className="rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-left text-sm text-slate-200 hover:border-primary-500/40 hover:text-white"><Plus size={15} className="mb-2" /> Ajouter facture</button>
          <button onClick={() => onAction('appointment')} className="rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-left text-sm text-slate-200 hover:border-primary-500/40 hover:text-white"><Plus size={15} className="mb-2" /> Ajouter rendez-vous</button>
          <button onClick={() => onAction('song-request')} className="rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-left text-sm text-slate-200 hover:border-primary-500/40 hover:text-white"><Plus size={15} className="mb-2" /> Créer demande chanson</button>
          <button
            onClick={() => onAction('lease')}
            disabled={!contact.tenantProfile?.unit}
            title={!contact.tenantProfile?.unit ? 'Ce contact doit être associé à une unité locative avant de créer un bail.' : undefined}
            className="rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-left text-sm text-slate-200 hover:border-primary-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={15} className="mb-2" /> Ajouter bail
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-[1.4rem] border border-slate-800 bg-slate-950/45 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
