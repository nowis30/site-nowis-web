'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Printer } from 'lucide-react';
import { StatusBadge } from '@/features/crm/components/shared/StatusBadge';
import { InvoiceBusinessProfile } from '@/lib/invoice-profile';
import { PayPalInvoicePanel } from '@/features/crm/components/invoices/PayPalInvoicePanel';
import { toCustomerSnapshot } from '@/lib/billing-profile';

interface InvoiceDetailPageProps {
  invoice: {
    id: string;
    number: string;
    issueDate: string;
    dueDate: string;
    amount: string | number;
    isTest: boolean;
    status: string;
    description: string | null;
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
    customerSnapshot?: unknown;
    contact: {
      fullName: string;
      email: string | null;
      phone: string | null;
      companyName: string | null;
    };
  };
  businessProfile: InvoiceBusinessProfile;
  backHref?: string;
  backLabel?: string;
  subtitle?: string;
  allowEmailSend?: boolean;
  initialComposeOpen?: boolean;
  allowPayPalActions?: boolean;
  paypalConfigured?: boolean;
  missingPayPalConfigMessage?: string;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatMoney(value: string | number) {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(value));
}

function buildDefaultSubject(invoiceNumber: string, businessName: string) {
  return `Facture ${invoiceNumber} - ${businessName}`;
}

function buildBillingAddressLines(customerSnapshot: ReturnType<typeof toCustomerSnapshot>) {
  if (!customerSnapshot) return [] as string[];

  const cityLine = [customerSnapshot.city, customerSnapshot.state, customerSnapshot.postalCode].filter(Boolean).join(', ');
  const lines = [
    customerSnapshot.fullName,
    customerSnapshot.companyName,
    customerSnapshot.addressLine1,
    customerSnapshot.addressLine2,
    cityLine || null,
    customerSnapshot.country,
  ].filter(Boolean) as string[];

  return lines;
}

function buildDefaultMessage(
  contactName: string,
  invoiceNumber: string,
  amount: string | number,
  dueDate: string,
  businessName: string,
  customerSnapshot: ReturnType<typeof toCustomerSnapshot>,
) {
  const billingAddressLines = buildBillingAddressLines(customerSnapshot);

  return [
    `Bonjour ${contactName},`,
    '',
    `Veuillez trouver ci-joint la facture ${invoiceNumber}.`,
    `Montant: ${formatMoney(amount)}`,
    `Echeance: ${formatDate(dueDate)}`,
    ...(billingAddressLines.length > 0
      ? ['', 'Adresse de facturation:', ...billingAddressLines]
      : []),
    '',
    'Merci,',
    businessName,
  ].join('\n');
}

function buildTemplateMessageByStatus(
  status: string,
  contactName: string,
  invoiceNumber: string,
  amount: string | number,
  dueDate: string,
  businessName: string,
  customerSnapshot: ReturnType<typeof toCustomerSnapshot>,
) {
  const total = formatMoney(amount);
  const due = formatDate(dueDate);
  const billingAddressLines = buildBillingAddressLines(customerSnapshot);

  if (status === 'OVERDUE') {
    return [
      `Bonjour ${contactName},`,
      '',
      `Petit rappel: la facture ${invoiceNumber} (${total}) est arrivee a echeance le ${due}.`,
      'Merci de proceder au paiement dans les meilleurs delais.',
      ...(billingAddressLines.length > 0
        ? ['', 'Adresse de facturation au dossier:', ...billingAddressLines]
        : []),
      '',
      'Merci,',
      businessName,
    ].join('\n');
  }

  if (status === 'PAID') {
    return [
      `Bonjour ${contactName},`,
      '',
      `Confirmation de reception pour la facture ${invoiceNumber} (${total}).`,
      'Merci pour votre paiement et votre confiance.',
      ...(billingAddressLines.length > 0
        ? ['', 'Adresse de facturation au dossier:', ...billingAddressLines]
        : []),
      '',
      'Cordialement,',
      businessName,
    ].join('\n');
  }

  if (status === 'SENT') {
    return [
      `Bonjour ${contactName},`,
      '',
      `Je vous renvoie la facture ${invoiceNumber} en piece jointe.`,
      `Montant: ${total}`,
      `Echeance: ${due}`,
      ...(billingAddressLines.length > 0
        ? ['', 'Adresse de facturation:', ...billingAddressLines]
        : []),
      '',
      'Merci,',
      businessName,
    ].join('\n');
  }

  return buildDefaultMessage(contactName, invoiceNumber, amount, dueDate, businessName, customerSnapshot);
}

function validateEmailListInput(value: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  for (const item of items) {
    if (!emailRegex.test(item)) {
      return `Email invalide: ${item}`;
    }
  }

  return null;
}

export function InvoiceDetailPage({
  invoice,
  businessProfile,
  backHref = '/crm/invoices',
  backLabel = 'Retour factures',
  subtitle = 'Version professionnelle imprimable',
  allowEmailSend = false,
  initialComposeOpen = false,
  allowPayPalActions = false,
  paypalConfigured = false,
  missingPayPalConfigMessage,
}: InvoiceDetailPageProps) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);
  const [emailFeedbackKind, setEmailFeedbackKind] = useState<'success' | 'error' | null>(null);
  const [emailFallbackInvoiceUrl, setEmailFallbackInvoiceUrl] = useState<string | null>(null);
  const [emailDiagnostic, setEmailDiagnostic] = useState<string | null>(null);
  const [billingIssues, setBillingIssues] = useState<{
    missingIssuer: string[];
    missingCustomer: string[];
    billingUpdateUrl: string | null;
    editCustomerUrl: string | null;
  } | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(initialComposeOpen);
  const [emailSubject, setEmailSubject] = useState(buildDefaultSubject(invoice.number, businessProfile.displayName));
  const [emailCc, setEmailCc] = useState('');
  const [emailBcc, setEmailBcc] = useState('');
  const customerSnapshot = toCustomerSnapshot(invoice.customerSnapshot);
  const [emailMessage, setEmailMessage] = useState(
    buildTemplateMessageByStatus(
      invoice.status,
      invoice.contact.fullName,
      invoice.number,
      invoice.amount,
      invoice.dueDate,
      businessProfile.displayName,
      customerSnapshot,
    ),
  );
  const lines = (invoice.description || 'Prestation professionnelle').split('\n').filter(Boolean);
  const billedName = customerSnapshot?.fullName || invoice.contact.fullName;
  const billedCompany = customerSnapshot?.companyName || invoice.contact.companyName;
  const billedEmail = customerSnapshot?.email || invoice.contact.email;
  const billedPhone = customerSnapshot?.phone || invoice.contact.phone;
  const billedAddressLine1 = customerSnapshot?.addressLine1 || null;
  const billedAddressLine2 = customerSnapshot?.addressLine2 || null;
  const billedCityLine = [customerSnapshot?.city, customerSnapshot?.state, customerSnapshot?.postalCode].filter(Boolean).join(', ');
  const billedCountry = customerSnapshot?.country || null;
  const billedTaxId = customerSnapshot?.taxId || null;
  const ccError = validateEmailListInput(emailCc);
  const bccError = validateEmailListInput(emailBcc);
  const canSendEmail =
    !sendingEmail &&
    !ccError &&
    !bccError &&
    emailSubject.trim().length >= 3 &&
    emailMessage.trim().length >= 5;

  async function sendInvoiceEmail() {
    setSendingEmail(true);
    setEmailFeedback(null);
    setEmailFeedbackKind(null);
    setEmailFallbackInvoiceUrl(null);
    setEmailDiagnostic(null);
    setBillingIssues(null);
    try {
      const response = await fetch(`/api/crm/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          message: emailMessage,
          cc: emailCc,
          bcc: emailBcc,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
        emailSent?: boolean;
        invoiceUrl?: string | null;
        missingIssuer?: string[];
        missingCustomer?: string[];
        billingUpdateUrl?: string | null;
        editCustomerUrl?: string | null;
      } | null;
      if (!response.ok) {
        if (response.status === 409 && (data?.missingIssuer || data?.missingCustomer)) {
          setBillingIssues({
            missingIssuer: data?.missingIssuer || [],
            missingCustomer: data?.missingCustomer || [],
            billingUpdateUrl: data?.billingUpdateUrl || null,
            editCustomerUrl: data?.editCustomerUrl || null,
          });
        }
        const errorMessage = data?.error || data?.message || 'Envoi impossible';
        setEmailFeedback(errorMessage);
        setEmailFeedbackKind('error');
        setEmailFallbackInvoiceUrl(data?.invoiceUrl || null);
        if (errorMessage.toLowerCase().includes('email non configur')) {
          setEmailDiagnostic('Email non configuré');
        }
        return;
      }

      if (data?.emailSent === true) {
        setEmailFeedback('Facture envoyée par email avec succès.');
        setEmailFeedbackKind('success');
        setIsComposerOpen(false);
        return;
      }

      const fallbackMessage = data?.error || data?.message || 'Aucun email n a été envoyé.';
      setEmailFeedback(fallbackMessage);
      setEmailFeedbackKind('error');
      setEmailFallbackInvoiceUrl(data?.invoiceUrl || null);
      if (fallbackMessage.toLowerCase().includes('email non configur')) {
        setEmailDiagnostic('Email non configuré');
      }
    } catch (error) {
      setEmailFeedback(error instanceof Error ? error.message : 'Envoi impossible');
      setEmailFeedbackKind('error');
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="print:hidden flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800 hover:text-white">
            <ArrowLeft size={14} className="inline mr-1" /> {backLabel}
          </Link>
          <div>
            <h2 className="text-2xl font-semibold text-white">Facture {invoice.number}</h2>
            <p className="text-sm text-slate-400">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allowEmailSend ? (
            <button
              type="button"
              onClick={() => setIsComposerOpen(true)}
              disabled={sendingEmail}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:border-primary-500/40 hover:text-white disabled:opacity-60"
            >
              <Mail size={16} />
              {sendingEmail ? 'Envoi...' : 'Envoyer par email'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500"
          >
            <Printer size={16} /> Imprimer
          </button>
        </div>
      </div>

      {emailFeedback ? (
        <div className={`print:hidden rounded-xl border px-4 py-3 text-sm ${emailFeedbackKind === 'success' ? 'border-emerald-700/40 bg-emerald-950/20 text-emerald-300' : 'border-red-700/40 bg-red-950/20 text-red-300'}`}>
          {emailFeedback}
          {emailFeedbackKind !== 'success' && emailFallbackInvoiceUrl ? (
            <div className="mt-2">
              <a href={emailFallbackInvoiceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                Ouvrir le lien facture généré
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      {emailDiagnostic ? (
        <div className="print:hidden rounded-xl border border-amber-700/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
          {emailDiagnostic}
        </div>
      ) : null}

      {billingIssues ? (
        <div className="print:hidden rounded-xl border border-amber-700/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium">Facturation incomplete</p>
          <p className="mt-1 text-amber-200/90">Emetteur: {billingIssues.missingIssuer.length > 0 ? billingIssues.missingIssuer.join(', ') : 'ok'}</p>
          <p className="text-amber-200/90">Client: {billingIssues.missingCustomer.length > 0 ? billingIssues.missingCustomer.join(', ') : 'ok'}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
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

      <PayPalInvoicePanel
        invoiceId={invoice.id}
        amount={invoice.amount}
        contactEmail={invoice.contact.email}
        allowActions={allowPayPalActions}
        paypalConfigured={paypalConfigured}
        missingConfigMessage={missingPayPalConfigMessage}
        initialMeta={{
          crmStatus: invoice.status,
          isTest: invoice.isTest,
          paypalInvoiceId: invoice.paypalInvoiceId,
          paypalInvoiceUrl: invoice.paypalInvoiceUrl,
          paypalStatus: invoice.paypalStatus,
          paypalSentAt: invoice.paypalSentAt,
          paypalPaidAt: invoice.paypalPaidAt,
          paypalLastWebhookAt: invoice.paypalLastWebhookAt,
          paymentProvider: invoice.paymentProvider,
          paymentStatus: invoice.paymentStatus,
          paymentAmount: invoice.paymentAmount,
          paymentCurrency: invoice.paymentCurrency,
        }}
      />

      {allowEmailSend && isComposerOpen ? (
        <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-6xl rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Personnaliser l'email facture</h3>
            <p className="mt-1 text-sm text-slate-400">Le PDF de la facture sera joint automatiquement a l'envoi.</p>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailSubject(buildDefaultSubject(invoice.number, businessProfile.displayName));
                      setEmailMessage(
                        buildTemplateMessageByStatus(
                          'DRAFT',
                          invoice.contact.fullName,
                          invoice.number,
                          invoice.amount,
                          invoice.dueDate,
                          businessProfile.displayName,
                          customerSnapshot,
                        ),
                      );
                    }}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500"
                  >
                    Template facture
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailSubject(`Rappel facture ${invoice.number} - ${businessProfile.displayName}`);
                      setEmailMessage(
                        buildTemplateMessageByStatus(
                          'OVERDUE',
                          invoice.contact.fullName,
                          invoice.number,
                          invoice.amount,
                          invoice.dueDate,
                          businessProfile.displayName,
                          customerSnapshot,
                        ),
                      );
                    }}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500"
                  >
                    Template rappel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailSubject(`Confirmation paiement ${invoice.number} - ${businessProfile.displayName}`);
                      setEmailMessage(
                        buildTemplateMessageByStatus(
                          'PAID',
                          invoice.contact.fullName,
                          invoice.number,
                          invoice.amount,
                          invoice.dueDate,
                          businessProfile.displayName,
                          customerSnapshot,
                        ),
                      );
                    }}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500"
                  >
                    Template confirmation
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.18em] text-slate-500">Sujet</label>
                  <input
                    value={emailSubject}
                    onChange={(event) => setEmailSubject(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.18em] text-slate-500">CC (optionnel)</label>
                    <input
                      value={emailCc}
                      onChange={(event) => setEmailCc(event.target.value)}
                      placeholder="email1@exemple.com, email2@exemple.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white"
                    />
                    {ccError ? <p className="mt-1 text-xs text-red-300">{ccError}</p> : null}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.18em] text-slate-500">BCC (optionnel)</label>
                    <input
                      value={emailBcc}
                      onChange={(event) => setEmailBcc(event.target.value)}
                      placeholder="email1@exemple.com, email2@exemple.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white"
                    />
                    {bccError ? <p className="mt-1 text-xs text-red-300">{bccError}</p> : null}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.18em] text-slate-500">Message</label>
                  <textarea
                    rows={11}
                    value={emailMessage}
                    onChange={(event) => setEmailMessage(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.18em] text-slate-500">Apercu PDF en direct</label>
                <div className="mb-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-200">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Adresse de facturation</p>
                  <p className="mt-1 font-semibold text-white">{billedName}</p>
                  {billedCompany ? <p>{billedCompany}</p> : null}
                  {billedAddressLine1 ? <p>{billedAddressLine1}</p> : null}
                  {billedAddressLine2 ? <p>{billedAddressLine2}</p> : null}
                  {billedCityLine ? <p>{billedCityLine}</p> : null}
                  {billedCountry ? <p>{billedCountry}</p> : null}
                  {billedEmail ? <p>{billedEmail}</p> : null}
                  {billedPhone ? <p>{billedPhone}</p> : null}
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-300">
                  L aperçu PDF intégré a été retiré pour éviter les dépendances à une route de prévisualisation.
                  Le PDF reste généré côté serveur lors de l envoi email de la facture.
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={sendInvoiceEmail}
                disabled={!canSendEmail}
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-60"
              >
                {sendingEmail ? 'Envoi en cours...' : 'Envoyer l\'email'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <article className="mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-white text-slate-900 shadow-2xl print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <div className="border-b border-slate-200 px-8 py-8 sm:px-12">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Facture</p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-950">{businessProfile.displayName}</h1>
              {businessProfile.tradeName ? <p className="text-sm text-slate-600">Nom commercial: {businessProfile.tradeName}</p> : null}
              {businessProfile.legalLabel ? <p className="text-sm text-slate-500">{businessProfile.legalLabel}</p> : null}
            </div>

            <div className="space-y-2 text-sm sm:text-right">
              <div className="flex items-center gap-2 sm:justify-end">
                <span className="font-medium text-slate-500">Statut</span>
                <StatusBadge value={invoice.status} />
              </div>
              <p><span className="font-medium text-slate-500">N°</span> {invoice.number}</p>
              <p><span className="font-medium text-slate-500">Émise le</span> {formatDate(invoice.issueDate)}</p>
              <p><span className="font-medium text-slate-500">Échéance</span> {formatDate(invoice.dueDate)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 px-8 py-8 sm:grid-cols-2 sm:px-12">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Prestataire</p>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-slate-950">{businessProfile.displayName}</p>
              {businessProfile.tradeName ? <p>{businessProfile.tradeName}</p> : null}
              {businessProfile.addressLine1 ? <p>{businessProfile.addressLine1}</p> : null}
              {businessProfile.addressLine2 ? <p>{businessProfile.addressLine2}</p> : null}
              {businessProfile.city || businessProfile.postalCode ? <p>{[businessProfile.city, businessProfile.postalCode].filter(Boolean).join(', ')}</p> : null}
              {businessProfile.country ? <p>{businessProfile.country}</p> : null}
              {businessProfile.phone ? <p>{businessProfile.phone}</p> : null}
              {businessProfile.email ? <p>{businessProfile.email}</p> : null}
              {businessProfile.website ? <p>{businessProfile.website}</p> : null}
              {businessProfile.taxId ? <p>Numéro de taxes / ID fiscal: {businessProfile.taxId}</p> : null}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Facturé à</p>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-slate-950">{billedName}</p>
              {billedCompany ? <p>{billedCompany}</p> : null}
              {billedAddressLine1 ? <p>{billedAddressLine1}</p> : null}
              {billedAddressLine2 ? <p>{billedAddressLine2}</p> : null}
              {billedCityLine ? <p>{billedCityLine}</p> : null}
              {billedCountry ? <p>{billedCountry}</p> : null}
              {billedEmail ? <p>{billedEmail}</p> : null}
              {billedPhone ? <p>{billedPhone}</p> : null}
              {billedTaxId ? <p>ID fiscal: {billedTaxId}</p> : null}
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 sm:px-12">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Description</th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Montant</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={`${invoice.id}-${index}`} className="border-t border-slate-200">
                    <td className="px-5 py-4 text-sm text-slate-700">{line}</td>
                    <td className="px-5 py-4 text-right text-sm text-slate-700">{index === 0 ? formatMoney(invoice.amount) : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr className="border-t border-slate-200">
                  <td className="px-5 py-4 text-right text-sm font-medium text-slate-500">Total dû</td>
                  <td className="px-5 py-4 text-right text-2xl font-bold text-slate-950">{formatMoney(invoice.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Conditions</p>
              <p>{businessProfile.paymentTerms}</p>
              {businessProfile.footerNote ? <p>{businessProfile.footerNote}</p> : null}
            </div>

            <div className="rounded-2xl bg-slate-950 px-6 py-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Montant à payer</p>
              <p className="mt-2 text-3xl font-bold">{formatMoney(invoice.amount)}</p>
              <p className="mt-2 text-sm text-white/70">Paiement attendu avant le {formatDate(invoice.dueDate)}</p>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
