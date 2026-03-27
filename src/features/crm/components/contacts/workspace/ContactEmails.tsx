import type { ContactWorkspaceContact } from './types';
import { formatDateTime } from './formatters';

export function ContactEmails({ contact }: { contact: ContactWorkspaceContact }) {
  const portalAndEmailCommunications = contact.communications.filter((item) => item.channel.includes('mail') || item.channel === 'portal' || item.channel.startsWith('portal-'));

  return (
    <div className="space-y-4">
      {contact.outboundEmails.length === 0 && portalAndEmailCommunications.length === 0 ? <p className="text-sm text-slate-400">Aucun email ni message suivi.</p> : null}
      {contact.outboundEmails.map((item) => (
        <article key={item.id} className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-white">{item.subject}</h3>
            <span className="text-xs text-slate-500">{formatDateTime(item.sentAt)}</span>
          </div>
          <p className="mt-2 text-sm text-slate-300">À: {item.recipientEmail}</p>
          <p className="mt-3 text-sm text-slate-400">{item.messagePreview}</p>
          <p className="mt-3 text-xs text-slate-500">{item.openedAt ? `Ouvert le ${formatDateTime(item.openedAt)}` : 'Pas encore ouvert'}</p>
        </article>
      ))}
      {portalAndEmailCommunications.map((item) => (
        <article key={item.id} className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-white">{item.subject || 'Communication'}</h3>
            <span className="text-xs text-slate-500">{formatDateTime(item.sentAt)}</span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{item.direction} · {item.channel}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-400">{item.body}</p>
        </article>
      ))}
    </div>
  );
}
