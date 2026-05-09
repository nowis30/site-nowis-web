'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type PayPalInvoicePanelProps = {
  invoiceId: string;
  initialMeta: {
    crmStatus: string;
    isTest: boolean;
    paypalInvoiceId: string | null;
    paypalInvoiceUrl: string | null;
    paypalStatus: string | null;
    paypalSentAt: string | null;
    paypalPaidAt: string | null;
    paypalLastWebhookAt: string | null;
    paymentProvider: string | null;
    paymentStatus: string | null;
    paymentAmount: string | number | null;
    paymentCurrency: string | null;
  };
  amount: string | number;
  contactEmail: string | null;
  allowActions?: boolean;
  paypalConfigured?: boolean;
  missingConfigMessage?: string;
};

type PayPalRoutePayload = {
  item?: {
    invoiceId: string;
    crmStatus: string;
    paypalInvoiceId: string | null;
    paypalInvoiceUrl: string | null;
    paypalStatus: string | null;
    paypalSentAt: string | null;
    paypalPaidAt: string | null;
    paypalLastWebhookAt: string | null;
    paymentProvider: string | null;
    paymentStatus: string | null;
    paymentAmount: string | null;
    paymentCurrency: string | null;
  };
  error?: string;
  paypalStatus?: number;
  paypalName?: string | null;
  paypalMessage?: string | null;
  paypalDetails?: Array<{
    field?: string;
    issue?: string;
    description?: string;
    value?: string;
  }>;
  paypalDebugId?: string | null;
  paypalLinks?: Array<{
    href?: string;
    rel?: string;
    method?: string;
    encType?: string;
  }>;
  missingIssuer?: string[];
  missingCustomer?: string[];
  billingUpdateUrl?: string | null;
  editCustomerUrl?: string | null;
};

function formatPayPalErrorMessage(data: PayPalRoutePayload | null, fallback: string) {
  const detailLines = (data?.paypalDetails || [])
    .map((detail) => {
      const prefix = detail.field ? `${detail.field}: ` : '';
      return prefix + (detail.description || detail.issue || detail.value || '').trim();
    })
    .filter(Boolean);

  return [
    data?.error || data?.paypalMessage || fallback,
    data?.paypalName ? `Type: ${data.paypalName}` : null,
    data?.paypalDebugId ? `Debug ID: ${data.paypalDebugId}` : null,
    detailLines.length > 0 ? `Détails: ${detailLines.join(' | ')}` : null,
  ].filter(Boolean).join(' · ');
}

type PayPalDiagnosticsPayload = {
  configured: boolean;
  env: 'sandbox' | 'live';
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasWebhookId: boolean;
  apiBaseUrl: string;
  webhookUrlExpected: string;
  clientIdPreview: string | null;
  businessEmailConfigured: string | null;
  merchantEmailUsed: string | null;
  invoice?: {
    invoice: {
      id: string;
      number: string;
      isTest: boolean;
      paypalInvoiceIdPresent: boolean;
      paypalInvoiceId: string | null;
      paypalInvoiceUrl: string | null;
      paypalInvoiceUrlHost: string | null;
      paypalInvoiceUrlEnv: 'sandbox' | 'live' | null;
      paypalStatus: string | null;
      paymentProvider: string | null;
      paymentStatus: string | null;
    };
    businessEmailConfigured: string | null;
    merchantEmailUsed: string | null;
    remoteLookup: {
      checked: boolean;
      ok: boolean;
      paypalInvoiceId: string | null;
      invoiceNumber: string | null;
      invoicerEmail: string | null;
      remoteInvoiceUrl: string | null;
      remoteInvoiceUrlHost: string | null;
      remoteInvoiceUrlEnv: 'sandbox' | 'live' | null;
      belongsToCurrentMerchant: boolean | null;
      paypalStatus?: number;
      paypalName?: string | null;
      paypalMessage?: string | null;
      paypalDebugId?: string | null;
      paypalDetails?: Array<{
        field?: string;
        issue?: string;
        description?: string;
        value?: string;
      }>;
      error?: string;
    } | null;
  } | null;
  error?: string;
};

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function formatMoney(value: string | number | null, currency = 'CAD') {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency,
  }).format(Number(value));
}

function statusTone(paymentStatus: string | null) {
  switch ((paymentStatus || '').toLowerCase()) {
    case 'paid':
      return 'text-emerald-300 border-emerald-700/40 bg-emerald-950/20';
    case 'refunded':
      return 'text-amber-300 border-amber-700/40 bg-amber-950/20';
    case 'cancelled':
      return 'text-red-300 border-red-700/40 bg-red-950/20';
    case 'partial':
      return 'text-sky-300 border-sky-700/40 bg-sky-950/20';
    default:
      return 'text-slate-300 border-slate-700/40 bg-slate-950/20';
  }
}

export function PayPalInvoicePanel({
  invoiceId,
  initialMeta,
  amount,
  contactEmail,
  allowActions = false,
  paypalConfigured = false,
  missingConfigMessage,
}: PayPalInvoicePanelProps) {
  const [meta, setMeta] = useState(initialMeta);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<PayPalDiagnosticsPayload | null>(null);
  const [billingIssues, setBillingIssues] = useState<{
    missingIssuer: string[];
    missingCustomer: string[];
    billingUpdateUrl: string | null;
    editCustomerUrl: string | null;
  } | null>(null);

  const paymentCurrency = meta.paymentCurrency || 'CAD';
  const effectiveAmount = useMemo(() => meta.paymentAmount || amount, [amount, meta.paymentAmount]);
  const canOpenPayPal = Boolean(meta.paypalInvoiceUrl);
  const hasPayPalInvoiceWithoutUrl = Boolean(meta.paypalInvoiceId) && !canOpenPayPal;
  const canSend = Boolean(meta.paypalInvoiceId) && paypalConfigured;
  const canCreate = paypalConfigured;

  async function loadDiagnostics() {
    setLoadingAction('diagnostics');
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/crm/diagnostics/paypal?invoiceId=${encodeURIComponent(invoiceId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = (await response.json().catch(() => null)) as PayPalDiagnosticsPayload | null;

      if (!response.ok || !data) {
        throw new Error(data?.error || 'Diagnostic PayPal impossible');
      }

      setDiagnostics(data);
      setFeedback('Diagnostic PayPal chargé.');
    } catch (diagnosticError) {
      setError(diagnosticError instanceof Error ? diagnosticError.message : 'Diagnostic PayPal impossible');
    } finally {
      setLoadingAction(null);
    }
  }

  async function resetTestLink() {
    if (!meta.isTest) return;
    if (!window.confirm('Réinitialiser le lien PayPal de cette facture de test ?')) {
      return;
    }

    setLoadingAction('reset');
    setError(null);
    setFeedback(null);
    setBillingIssues(null);

    try {
      const response = await fetch(`/api/crm/invoices/${invoiceId}/paypal/reset-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = (await response.json().catch(() => null)) as PayPalRoutePayload | null;

      if (!response.ok || !data?.item) {
        throw new Error(data?.error || 'Reset PayPal impossible');
      }

      setMeta((current) => ({
        ...current,
        ...data.item,
      }));
      setDiagnostics(null);
      setFeedback('Lien PayPal de test réinitialisé.');
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Reset PayPal impossible');
    } finally {
      setLoadingAction(null);
    }
  }

  async function runAction(action: 'create' | 'send' | 'status') {
    setLoadingAction(action);
    setError(null);
    setFeedback(null);
    setBillingIssues(null);

    try {
      const response = await fetch(
        action === 'create'
          ? `/api/crm/invoices/${invoiceId}/paypal/create`
          : action === 'send'
            ? `/api/crm/invoices/${invoiceId}/paypal/send`
            : `/api/crm/invoices/${invoiceId}/paypal/status`,
        {
          method: action === 'status' ? 'GET' : 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const data = (await response.json().catch(() => null)) as PayPalRoutePayload | null;
      if (!response.ok || !data?.item) {
        if (response.status === 409 && (data?.missingIssuer || data?.missingCustomer)) {
          setBillingIssues({
            missingIssuer: data?.missingIssuer || [],
            missingCustomer: data?.missingCustomer || [],
            billingUpdateUrl: data?.billingUpdateUrl || null,
            editCustomerUrl: data?.editCustomerUrl || null,
          });
        }
        throw new Error(formatPayPalErrorMessage(data, 'Action PayPal impossible'));
      }

      setMeta((current) => ({
        ...current,
        ...data.item,
      }));
      const hasUrlAfterAction = Boolean(data.item.paypalInvoiceUrl);
      setFeedback(
        action === 'create'
          ? 'Facture PayPal créée.'
          : action === 'send'
            ? 'Facture PayPal envoyée.'
            : hasUrlAfterAction
              ? 'Statut PayPal synchronisé. Lien PayPal disponible.'
              : 'Statut PayPal synchronisé, mais aucun lien PayPal ouvrable n est encore disponible.',
      );
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Erreur inconnue');
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="print:hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Paiement</p>
          <h3 className="mt-2 text-lg font-semibold text-white">PayPal + CRM</h3>
          <p className="mt-1 text-sm text-slate-400">
            Statut CRM: <span className="text-slate-200">{meta.crmStatus}</span>
            {' · '}
            Statut PayPal: <span className="text-slate-200">{meta.paypalStatus || 'non créé'}</span>
          </p>
        </div>

        {allowActions ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void runAction('create')}
              disabled={loadingAction !== null || !canCreate}
              className="rounded-xl border border-primary-600/50 bg-primary-950/30 px-3 py-2 text-xs font-medium text-primary-200 hover:bg-primary-900/40 disabled:opacity-50"
            >
              {loadingAction === 'create' ? 'Création...' : 'Créer facture PayPal'}
            </button>
            <button
              type="button"
              onClick={() => void runAction('send')}
              disabled={loadingAction !== null || !canSend}
              className="rounded-xl border border-sky-600/50 bg-sky-950/30 px-3 py-2 text-xs font-medium text-sky-200 hover:bg-sky-900/40 disabled:opacity-50"
            >
              {loadingAction === 'send' ? 'Envoi...' : 'Envoyer facture PayPal'}
            </button>
            <button
              type="button"
              onClick={() => void loadDiagnostics()}
              disabled={loadingAction !== null}
              className="rounded-xl border border-violet-600/50 bg-violet-950/30 px-3 py-2 text-xs font-medium text-violet-200 hover:bg-violet-900/40 disabled:opacity-50"
            >
              {loadingAction === 'diagnostics' ? 'Diagnostic...' : 'Diagnostic PayPal'}
            </button>
            {meta.isTest ? (
              <button
                type="button"
                onClick={() => void resetTestLink()}
                disabled={loadingAction !== null}
                className="rounded-xl border border-amber-600/50 bg-amber-950/30 px-3 py-2 text-xs font-medium text-amber-200 hover:bg-amber-900/40 disabled:opacity-50"
              >
                {loadingAction === 'reset' ? 'Reset...' : 'Réinitialiser lien PayPal test'}
              </button>
            ) : null}
            {canOpenPayPal ? (
              <a
                href={meta.paypalInvoiceUrl!}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-emerald-600/50 bg-emerald-950/30 px-3 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-900/40"
              >
                Ouvrir facture PayPal
              </a>
            ) : null}
            {hasPayPalInvoiceWithoutUrl ? (
              <button
                type="button"
                onClick={() => void runAction('status')}
                disabled={loadingAction !== null || !paypalConfigured}
                className="rounded-xl border border-amber-600/50 bg-amber-950/30 px-3 py-2 text-xs font-medium text-amber-200 hover:bg-amber-900/40 disabled:opacity-50"
              >
                {loadingAction === 'status' ? 'Rafraîchissement...' : 'Rafraîchir lien PayPal'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void runAction('status')}
              disabled={loadingAction !== null || !meta.paypalInvoiceId || !paypalConfigured}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-primary-500/40 hover:text-white disabled:opacity-50"
            >
              {loadingAction === 'status' ? 'Vérification...' : 'Vérifier statut PayPal'}
            </button>
          </div>
        ) : canOpenPayPal && (meta.paymentStatus || '').toLowerCase() !== 'paid' ? (
          <a
            href={meta.paypalInvoiceUrl!}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-emerald-600/50 bg-emerald-950/30 px-3 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-900/40"
          >
            Ouvrir le paiement PayPal
          </a>
        ) : null}
      </div>

      {allowActions && !paypalConfigured ? (
        <p className="mt-4 rounded-xl border border-amber-700/40 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
          {missingConfigMessage || 'PayPal n est pas encore configuré. Ajoute les variables PayPal dans Vercel ou Render.'}
        </p>
      ) : null}

      {hasPayPalInvoiceWithoutUrl ? (
        <p className="mt-4 rounded-xl border border-amber-700/40 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
          La facture PayPal existe, mais aucun lien web ouvrable n est disponible pour le moment. Utilise "Rafraîchir lien PayPal" pour resynchroniser.
        </p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {feedback ? <p className="mt-4 text-sm text-emerald-300">{feedback}</p> : null}

      {diagnostics ? (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-200">
          <p><span className="text-slate-400">Env:</span> {diagnostics.env}</p>
          <p><span className="text-slate-400">Business email configuré:</span> {diagnostics.businessEmailConfigured || '—'}</p>
          <p><span className="text-slate-400">Merchant email utilisé dans le payload:</span> {diagnostics.merchantEmailUsed || '—'}</p>
          <p><span className="text-slate-400">InvoiceId PayPal présent:</span> {diagnostics.invoice?.invoice.paypalInvoiceIdPresent ? 'oui' : 'non'}</p>
          <p><span className="text-slate-400">URL PayPal host:</span> {diagnostics.invoice?.invoice.paypalInvoiceUrlHost || '—'}</p>
          <p><span className="text-slate-400">URL PayPal env:</span> {diagnostics.invoice?.invoice.paypalInvoiceUrlEnv || '—'}</p>
          {diagnostics.invoice?.remoteLookup ? (
            <>
              <p className="mt-3"><span className="text-slate-400">Accès facture distante:</span> {diagnostics.invoice.remoteLookup.ok ? 'autorisé' : 'refusé / impossible'}</p>
              <p><span className="text-slate-400">InvoiceId distant:</span> {diagnostics.invoice.remoteLookup.paypalInvoiceId || '—'}</p>
              <p><span className="text-slate-400">Numéro distant:</span> {diagnostics.invoice.remoteLookup.invoiceNumber || '—'}</p>
              <p><span className="text-slate-400">Email invoicer distant:</span> {diagnostics.invoice.remoteLookup.invoicerEmail || '—'}</p>
              <p><span className="text-slate-400">Appartient au marchand courant:</span> {diagnostics.invoice.remoteLookup.belongsToCurrentMerchant === null ? 'indéterminé' : diagnostics.invoice.remoteLookup.belongsToCurrentMerchant ? 'oui' : 'non'}</p>
              {diagnostics.invoice.remoteLookup.paypalName ? (
                <p><span className="text-slate-400">Code PayPal:</span> {diagnostics.invoice.remoteLookup.paypalName}</p>
              ) : null}
              {diagnostics.invoice.remoteLookup.paypalDebugId ? (
                <p><span className="text-slate-400">Debug ID:</span> {diagnostics.invoice.remoteLookup.paypalDebugId}</p>
              ) : null}
              {diagnostics.invoice.remoteLookup.paypalMessage ? (
                <p><span className="text-slate-400">Message:</span> {diagnostics.invoice.remoteLookup.paypalMessage}</p>
              ) : null}
              {diagnostics.invoice.remoteLookup.paypalDetails && diagnostics.invoice.remoteLookup.paypalDetails.length > 0 ? (
                <p><span className="text-slate-400">Détails:</span> {diagnostics.invoice.remoteLookup.paypalDetails.map((detail) => detail.description || detail.issue || detail.field).filter(Boolean).join(' | ')}</p>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {billingIssues ? (
        <div className="mt-4 rounded-xl border border-amber-700/40 bg-amber-950/20 px-3 py-3 text-sm text-amber-100">
          <p className="font-medium">Facturation incomplete</p>
          <p className="mt-1 text-amber-200/90">Emetteur: {billingIssues.missingIssuer.length > 0 ? billingIssues.missingIssuer.join(', ') : 'ok'}</p>
          <p className="text-amber-200/90">Client: {billingIssues.missingCustomer.length > 0 ? billingIssues.missingCustomer.join(', ') : 'ok'}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link href="/crm/settings" className="rounded-md border border-amber-400/40 px-2 py-1 text-amber-100 hover:text-white">Completer le profil emetteur</Link>
            {billingIssues.editCustomerUrl ? (
              <Link href={billingIssues.editCustomerUrl} className="rounded-md border border-amber-400/40 px-2 py-1 text-amber-100 hover:text-white">Modifier le client dans le CRM</Link>
            ) : null}
            {billingIssues.billingUpdateUrl ? (
              <a href={billingIssues.billingUpdateUrl} target="_blank" rel="noreferrer" className="rounded-md border border-amber-400/40 px-2 py-1 text-amber-100 hover:text-white">Envoyer le lien public de facturation</a>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className={`rounded-xl border px-3 py-3 ${statusTone(meta.paymentStatus)}`}>
          <p className="text-xs uppercase tracking-[0.18em] opacity-70">paymentStatus</p>
          <p className="mt-2 text-sm font-semibold">{meta.paymentStatus || 'unpaid'}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-3 text-slate-200">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Montant</p>
          <p className="mt-2 text-sm font-semibold">{formatMoney(effectiveAmount, paymentCurrency)}</p>
          <p className="mt-1 text-xs text-slate-500">Devise: {paymentCurrency}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-3 text-slate-200">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Envoi / paiement</p>
          <p className="mt-2 text-xs text-slate-400">Envoyée: {formatDateTime(meta.paypalSentAt)}</p>
          <p className="mt-1 text-xs text-slate-400">Payée: {formatDateTime(meta.paypalPaidAt)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-3 text-slate-200">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Client / PayPal</p>
          <p className="mt-2 text-xs text-slate-400">Client: {contactEmail || 'Sans courriel client'}</p>
          <p className="mt-1 break-all text-xs text-slate-500">ID PayPal: {meta.paypalInvoiceId || '—'}</p>
        </div>
      </div>
    </div>
  );
}
