'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Calendar, CheckSquare, Mail, MessageSquare, NotebookPen, Paperclip, Receipt, User2 } from 'lucide-react';
import type { ContactWorkspaceProps } from './workspace/types';
import { ContactHeader, type ContactActionType } from './workspace/ContactHeader';
import { ContactSummary } from './workspace/ContactSummary';
import { ContactTimeline } from './workspace/ContactTimeline';
import { ContactTasks } from './workspace/ContactTasks';
import { ContactAppointments } from './workspace/ContactAppointments';
import { ContactInvoices } from './workspace/ContactInvoices';
import { ContactFilesPanel } from './workspace/ContactFilesPanel';
import { ContactEmails } from './workspace/ContactEmails';
import { ContactHousing } from './workspace/ContactHousing';
import { ContactActionModal } from './workspace/ContactActionModal';
import { ContactMessages } from './workspace/ContactMessages';
import { ContactSongRequests } from './workspace/ContactSongRequests';

const TABS = [
  { id: 'summary', label: 'Résumé', icon: User2 },
  { id: 'timeline', label: 'Activité', icon: NotebookPen },
  { id: 'tasks', label: 'Tâches', icon: CheckSquare },
  { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
  { id: 'invoices', label: 'Factures', icon: Receipt },
  { id: 'files', label: 'Fichiers', icon: Paperclip },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'song-requests', label: 'Demandes chanson', icon: Receipt },
  { id: 'real-estate', label: 'Liens immobiliers', icon: Building2 },
] as const;

export function ContactWorkspace({ contact, tasks, appointments, invoices, files, propertyOptions, timeline, unreadClientMessages, canImpersonate }: ContactWorkspaceProps) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('summary');
  const [action, setAction] = useState<ContactActionType | null>(null);
  const [unreadCount, setUnreadCount] = useState(unreadClientMessages);

  const stats = useMemo(() => ([
    { label: 'Tâches ouvertes', value: tasks.filter((item) => item.status !== 'DONE').length },
    { label: 'Factures', value: invoices.length },
    { label: 'Rendez-vous', value: appointments.length },
    { label: 'Fichiers', value: files.length },
  ]), [appointments.length, files.length, invoices.length, tasks]);

  const tabBadges: Partial<Record<(typeof TABS)[number]['id'], number>> = {
    messages: unreadCount,
    'song-requests': contact.songRequests.length,
  };

  async function handleImpersonationStart() {
    const response = await fetch('/api/crm/impersonation/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId: contact.id }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Impossible d\'activer le mode client');
    }

    window.location.assign('/client/dashboard');
  }

  return (
    <section className="space-y-6">
      <ContactHeader contact={contact} stats={stats} onAction={setAction} canImpersonate={canImpersonate} onImpersonate={handleImpersonationStart} />

      <div className="crm-surface overflow-hidden">
        <div className="border-b border-slate-800 px-3 pt-3 sm:px-6">
          <div className="flex gap-1 overflow-x-auto pb-3">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${active ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <Icon size={15} />
                  {item.label}
                  {tabBadges[item.id] ? <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-slate-950">{tabBadges[item.id]}</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 lg:p-8">
          {tab === 'summary' ? <ContactSummary contact={contact} /> : null}
          {tab === 'timeline' ? <ContactTimeline items={timeline} /> : null}
          {tab === 'tasks' ? <ContactTasks tasks={tasks} /> : null}
          {tab === 'appointments' ? <ContactAppointments appointments={appointments} /> : null}
          {tab === 'invoices' ? <ContactInvoices invoices={invoices} /> : null}
          {tab === 'files' ? <ContactFilesPanel contactId={contact.id} files={files} /> : null}
          {tab === 'emails' ? <ContactEmails contact={contact} /> : null}
          {tab === 'messages' ? <ContactMessages contactId={contact.id} initialMessages={contact.messages} onUnreadCountChange={setUnreadCount} /> : null}
          {tab === 'song-requests' ? <ContactSongRequests items={contact.songRequests} /> : null}
          {tab === 'real-estate' ? <ContactHousing contact={contact} /> : null}
        </div>
      </div>

      {action ? <ContactActionModal action={action} contact={contact} propertyOptions={propertyOptions} onClose={() => setAction(null)} onSaved={() => { setAction(null); router.refresh(); }} /> : null}
    </section>
  );
}
