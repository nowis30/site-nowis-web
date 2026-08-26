'use client';

import { useMemo, useState } from 'react';
import { Mail, Paperclip, X } from 'lucide-react';
import { parseInvoiceDescriptionLines } from '@/lib/invoice-lines';

interface InvoiceEmailPanelProps {
  invoice: {
    id: string;
    number: string;
    issueDate: string;
    dueDate: string;
    amount: string | number;
    description: string | null;
    contact: {
      fullName: string;
      email: string | null;
      companyName: string | null;
    };
  };
  businessName: string;
  senderEmail: string | null;
  website: string | null;
}

function formatMoney(value: string | number) {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildCoverMessage(
  invoice: InvoiceEmailPanelProps['invoice'],
  businessName: string,
) {
  return [
    `Bonjour ${invoice.contact.fullName},`,
    '',
    `Veuillez trouver ci-dessous le détail de la facture ${invoice.number}. Le document officiel est également joint en PDF à ce courriel.`,
    '',
    'Merci,',
    businessName,
  ].join('\n');
}

const editableFieldStyle = {
  backgroundColor: '#020617',
  color: '#f8fafc',
  WebkitTextFillColor: '#f8fafc',
  caretColor: '#f8fafc',
  colorScheme: 'dark' as const,
};

const readOnlyFieldStyle = {
  backgroundColor: '#020617',
  color: '#cbd5e1',
  WebkitTextFillColor: '#cbd5e1',
  colorScheme: 'dark' as const,
};

export function InvoiceEmailPanel({ invoice, businessName, senderEmail, website }: InvoiceEmailPanelProps) {
  const defaultSubject = `Facture ${invoice.number} | ${businessName}`;
  const defaultMessage = useMemo(
    () => buildCoverMessage(invoice, businessName),
    [invoice, businessName],
  );
  const invoiceLines = useMemo(
    () => parseInvoiceDescriptionLines(invoice.description, invoice.amount),
    [invoice.description, invoice.amount],
  );

  const [busy, setBusy] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackKind, setFeedbackKind] = useState<'success' | 'error' | null>(null);

  async function prepareEmail() {
    setBusy(true);
    setFeedback(null);
    setFeedbackKind(null);

    try {
      const response = await fetch(`/api/crm/invoices/${invoice.id}/outlook`, { method: 'POST' });
      const data = (await response.json().catch(() => null)) as {
        mode?: 'outlook-draft' | 'outlook-connect' | 'crm-email-pdf' | 'mailto-mobile';
        outlookUrl?: string;
        connectUrl?: string;
        error?: string;
        pdfAttached?: boolean;
      } | null;

      if (!response.ok || !data) {
        throw new Error(data?.error || 'Impossible de préparer le courriel de facture.');
      }

      if (data.mode === 'crm-email-pdf') {
        setSubject(defaultSubject);
        setMessage(defaultMessage);
        setComposerOpen(true);
        setFeedback('Le courriel est prêt. La facture professionnelle sera intégrée dans le message et le PDF sera joint automatiquement à l’envoi.');
        setFeedbackKind('success');
        return;
      }

      if (data.mode === 'outlook-connect') {
        const target = data.connectUrl || data.outlookUrl;
        if (!target) throw new Error('Lien de connexion Microsoft manquant.');
        window.open(target, '_blank', 'noopener,noreferrer');
        setFeedback('La connexion Microsoft s’ouvre dans un nouvel onglet. Cette page reste ouverte. Après la connexion, Outlook pourra créer le brouillon avec le PDF joint.');
        setFeedbackKind('success');
        return;
      }

      if (data.mode === 'outlook-draft') {
        if (!data.outlookUrl) throw new Error('Brouillon Outlook introuvable.');
        window.open(data.outlookUrl, '_blank', 'noopener,noreferrer');
        setFeedback(data.pdfAttached
          ? 'Brouillon Outlook créé avec la facture dans le courriel et le PDF déjà joint.'
          : 'Brouillon Outlook créé.');
        setFeedbackKind('success');
        return;
      }

      if (data.outlookUrl) {
        window.open(data.outlookUrl, '_blank', 'noopener,noreferrer');
        setFeedback('Le courriel contient la facture complète, sans lien public.');
        setFeedbackKind('success');
        return;
      }

      throw new Error(data.error || 'Impossible de préparer le courriel.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Impossible de préparer le courriel.');
      setFeedbackKind('error');
    } finally {
      setBusy(false);
    }
  }

  async function sendEmail() {
    setBusy(true);
    setFeedback(null);
    setFeedbackKind(null);

    try {
      const response = await fetch(`/api/crm/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, cc, bcc }),
      });
      const data = (await response.json().catch(() => null)) as {
        emailSent?: boolean;
        error?: string;
        message?: string;
      } | null;

      if (!response.ok || data?.emailSent !== true) {
        throw new Error(data?.error || data?.message || 'Envoi impossible.');
      }

      setComposerOpen(false);
      setFeedback('Courriel envoyé avec la facture professionnelle intégrée et le PDF joint.');
      setFeedbackKind('success');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Envoi impossible.');
      setFeedbackKind('error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="print:hidden mb-4 flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-white">Courriel de facture</p>
          <p className="text-sm text-slate-400">Facture intégrée dans le courriel + PDF joint. Aucun long lien public.</p>
        </div>
        <button
          type="button"
          onClick={() => void prepareEmail()}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-60"
        >
          <Mail size={16} />
          {busy ? 'Préparation...' : 'Préparer courriel + PDF'}
        </button>
      </div>

      {feedback ? (
        <div className={`print:hidden mb-4 rounded-xl border px-4 py-3 text-sm ${feedbackKind === 'success' ? 'border-emerald-700/40 bg-emerald-950/20 text-emerald-300' : 'border-red-700/40 bg-red-950/20 text-red-300'}`}>
          {feedback}
        </div>
      ) : null}

      {composerOpen ? (
        <div className="print:hidden fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-3 sm:p-5">
          <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Préparer la facture par courriel</h3>
                <p className="mt-1 flex items-center gap-2 text-sm text-emerald-300">
                  <Paperclip size={15} /> facture-{invoice.number}.pdf sera jointe automatiquement
                </p>
              </div>
              <button type="button" onClick={() => setComposerOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.95fr]">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-500">À</label>
                  <input
                    value={invoice.contact.email || ''}
                    readOnly
                    style={readOnlyFieldStyle}
                    className="w-full rounded-xl border border-slate-700 px-3 py-2.5 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-500">Sujet</label>
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    style={editableFieldStyle}
                    className="w-full rounded-xl border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-500">CC</label>
                    <input value={cc} onChange={(event) => setCc(event.target.value)} style={editableFieldStyle} className="w-full rounded-xl border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-500">BCC</label>
                    <input value={bcc} onChange={(event) => setBcc(event.target.value)} style={editableFieldStyle} className="w-full rounded-xl border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-500">Petit mot d’accompagnement</label>
                  <textarea
                    rows={10}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    style={editableFieldStyle}
                    className="w-full resize-y rounded-xl border border-slate-700 px-3 py-3 text-sm leading-6 outline-none focus:border-primary-500"
                  />
                  <p className="mt-2 text-xs text-slate-500">La facture ci-contre est ajoutée automatiquement sous ce texte dans le courriel.</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Aperçu du courriel</p>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl">
                  <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Facture</p>
                    <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <h4 className="text-2xl font-bold text-slate-950">{invoice.number}</h4>
                      <div className="text-xs text-slate-500 sm:text-right">
                        <p>Date : {formatDate(invoice.issueDate)}</p>
                        <p>Échéance : {formatDate(invoice.dueDate)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-5 sm:px-6">
                    <div className="mb-5 whitespace-pre-line text-sm leading-6 text-slate-700">{message}</div>

                    <div className="mb-5 rounded-xl bg-slate-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Facturé à</p>
                      {invoice.contact.companyName ? <p className="mt-1 font-semibold text-slate-950">{invoice.contact.companyName}</p> : null}
                      <p className="text-sm text-slate-700">{invoice.contact.fullName}</p>
                      {invoice.contact.email ? <p className="text-sm text-slate-600">{invoice.contact.email}</p> : null}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <table className="w-full border-collapse text-sm">
                        <thead className="bg-slate-100 text-slate-600">
                          <tr>
                            <th className="px-3 py-2.5 text-left font-semibold">Description</th>
                            <th className="px-3 py-2.5 text-right font-semibold">Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceLines.map((line, index) => (
                            <tr key={`${invoice.id}-email-${index}`} className="border-t border-slate-200">
                              <td className="px-3 py-3 text-slate-700">{line.description}</td>
                              <td className="px-3 py-3 text-right font-medium text-slate-900">{line.amount !== null ? formatMoney(line.amount) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-300 bg-slate-50">
                          <tr>
                            <td className="px-3 py-3 text-right font-bold text-slate-700">TOTAL</td>
                            <td className="px-3 py-3 text-right text-lg font-bold text-slate-950">{formatMoney(invoice.amount)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="mt-5 rounded-xl bg-slate-950 p-4 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Mode de paiement</p>
                      <p className="mt-1 font-semibold">Virement Interac</p>
                      <p className="text-sm text-white/80">{senderEmail || 'Adresse de paiement à configurer'}</p>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                      <Paperclip size={14} /> facture-{invoice.number}.pdf
                    </div>
                    <p className="mt-4 text-xs text-slate-400">{businessName} · {senderEmail || ''} · {website || 'nowis.store'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setComposerOpen(false)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500">Annuler</button>
              <button type="button" onClick={() => void sendEmail()} disabled={busy || !invoice.contact.email || subject.trim().length < 3 || message.trim().length < 5} className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-60">
                {busy ? 'Envoi...' : 'Envoyer avec le PDF'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
