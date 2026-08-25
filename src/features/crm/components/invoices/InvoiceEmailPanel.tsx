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

function buildInvoiceMessage(
  invoice: InvoiceEmailPanelProps['invoice'],
  businessName: string,
  senderEmail: string | null,
  website: string | null,
) {
  const lines = parseInvoiceDescriptionLines(invoice.description, invoice.amount);
  const detail = lines.map((line) =>
    `- ${line.description}${line.amount !== null ? ` : ${formatMoney(line.amount)}` : ''}`,
  );

  return [
    `Bonjour ${invoice.contact.fullName},`,
    '',
    `Voici le détail de la facture ${invoice.number}. Le PDF officiel est joint à ce courriel.`,
    '',
    `FACTURE ${invoice.number}`,
    `Date : ${formatDate(invoice.issueDate)}`,
    `Échéance : ${formatDate(invoice.dueDate)}`,
    '',
    'FACTURÉ À',
    invoice.contact.companyName || null,
    invoice.contact.fullName,
    invoice.contact.email || null,
    '',
    'DÉTAIL',
    ...detail,
    '',
    `TOTAL : ${formatMoney(invoice.amount)}`,
    '',
    'MODE DE PAIEMENT',
    senderEmail ? `Virement Interac : ${senderEmail}` : 'Voir les modalités sur la facture PDF.',
    '',
    'Merci,',
    businessName,
    senderEmail || null,
    website || 'nowis.store',
  ].filter((line): line is string => line !== null).join('\n');
}

export function InvoiceEmailPanel({ invoice, businessName, senderEmail, website }: InvoiceEmailPanelProps) {
  const defaultSubject = `Facture ${invoice.number} | ${businessName}`;
  const defaultMessage = useMemo(
    () => buildInvoiceMessage(invoice, businessName, senderEmail, website),
    [invoice, businessName, senderEmail, website],
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
        setFeedback('Le courriel est prêt ici. La facture est écrite dans le message et le PDF sera joint automatiquement à l’envoi.');
        setFeedbackKind('success');
        return;
      }

      if (data.mode === 'outlook-connect') {
        const target = data.connectUrl || data.outlookUrl;
        if (!target) throw new Error('Lien de connexion Microsoft manquant.');
        window.open(target, '_blank', 'noopener,noreferrer');
        setFeedback('La connexion Microsoft s’ouvre dans un nouvel onglet. La page de facture reste ouverte ici. Après la connexion, Outlook ouvrira le brouillon avec le PDF joint.');
        setFeedbackKind('success');
        return;
      }

      if (data.mode === 'outlook-draft') {
        if (!data.outlookUrl) throw new Error('Brouillon Outlook introuvable.');
        window.open(data.outlookUrl, '_blank', 'noopener,noreferrer');
        setFeedback(data.pdfAttached
          ? 'Brouillon Outlook créé : facture complète dans le courriel et PDF déjà joint.'
          : 'Brouillon Outlook créé.');
        setFeedbackKind('success');
        return;
      }

      if (data.outlookUrl) {
        window.location.href = data.outlookUrl;
        setFeedback('Le courriel contient maintenant la facture complète, sans lien public.');
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
      setFeedback('Courriel envoyé avec la facture écrite dans le message et le PDF joint.');
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
          <p className="text-sm text-slate-400">Aucun lien public : détail de la facture dans le courriel + PDF joint.</p>
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
        <div className="print:hidden fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Facture par courriel</h3>
                <p className="mt-1 flex items-center gap-2 text-sm text-emerald-300"><Paperclip size={15} /> facture-{invoice.number}.pdf sera jointe automatiquement</p>
              </div>
              <button type="button" onClick={() => setComposerOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-500">À</label>
                <input value={invoice.contact.email || ''} readOnly className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-300" />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-500">Sujet</label>
                <input value={subject} onChange={(event) => setSubject(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-500">CC</label>
                  <input value={cc} onChange={(event) => setCc(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-500">BCC</label>
                  <input value={bcc} onChange={(event) => setBcc(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-500">Message</label>
                <textarea rows={18} value={message} onChange={(event) => setMessage(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 font-mono text-sm leading-6 text-white" />
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
