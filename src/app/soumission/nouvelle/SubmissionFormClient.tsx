'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type SubmissionType = 'song' | 'workshop' | 'general';

function resolveInitialType(raw: string | null): SubmissionType {
  const value = (raw || '').toLowerCase();
  if (value === 'chanson' || value === 'song') return 'song';
  if (value === 'atelier' || value === 'workshop') return 'workshop';
  return 'general';
}

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  subject: '',
  recipientName: '',
  style: '',
  details: '',
  budget: '',
  desiredDate: '',
  organizationName: '',
  groupType: '',
  participants: '',
  ageRange: '',
  location: '',
  desiredDuration: '',
};

export function SubmissionFormClient() {
  const searchParams = useSearchParams();
  const [type, setType] = useState<SubmissionType>(() => resolveInitialType(searchParams.get('type')));
  const [preferCallback, setPreferCallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  function f(key: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [key]: e.target.value }));
  }

  const title = useMemo(() => {
    if (type === 'song') return 'Nouvelle demande de chanson';
    if (type === 'workshop') return "Nouvelle demande d'atelier";
    return 'Nouvelle demande générale';
  }, [type]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation JS — le navigateur ne valide rien (noValidate sur le form)
    if (!form.fullName.trim()) {
      setError('Veuillez entrer votre nom.');
      return;
    }
    if (type === 'song' && !form.email.trim() && !form.phone.trim()) {
      setError('Veuillez fournir au moins un courriel ou un numéro de téléphone.');
      return;
    }
    if (type !== 'song' && !form.email.trim()) {
      setError('Veuillez entrer votre courriel.');
      return;
    }
    if (type === 'workshop' && !form.organizationName.trim()) {
      setError('Veuillez entrer le nom de l\'organisation.');
      return;
    }
    if (type === 'workshop' && !form.details.trim()) {
      setError('Veuillez décrire votre demande dans le champ Message / détails.');
      return;
    }
    if (type === 'general' && !form.subject.trim()) {
      setError('Veuillez entrer un sujet.');
      return;
    }
    if (type === 'general' && !form.details.trim()) {
      setError('Veuillez écrire votre message.');
      return;
    }

    setLoading(true);

    const payload = {
      type,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      ...(type === 'song'
        ? {
            subject: form.subject,
            recipientName: form.recipientName,
            style: form.style,
            details: form.details,
            budget: form.budget ? Number(form.budget) : undefined,
            desiredDate: form.desiredDate,
            preferCallback,
          }
        : type === 'workshop'
          ? {
              organizationName: form.organizationName,
              groupType: form.groupType,
              participants: form.participants ? Number(form.participants) : undefined,
              ageRange: form.ageRange,
              location: form.location,
              desiredDate: form.desiredDate,
              desiredDuration: form.desiredDuration,
              details: form.details,
            }
          : {
              subject: form.subject,
              details: form.details,
            }),
    };

    try {
      const response = await fetch('/api/public/submission-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
        details?: Array<{ message?: string }>;
      } | null;
      if (!response.ok) {
        const firstDetail = data?.details?.[0]?.message;
        throw new Error(firstDetail || data?.error || 'Envoi impossible');
      }

      setSuccess(data?.message || 'Demande envoyée avec succès. Nous vous contacterons sous peu.');
      setForm(EMPTY_FORM);
      setPreferCallback(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Envoi impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-slate-100">
      <h1 className="text-3xl font-semibold text-white">{title}</h1>
      <p className="mt-2 text-sm text-slate-400">Formulaire public sécurisé. Une demande est créée dans le CRM.</p>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => setType('song')} className={`rounded-lg px-3 py-2 text-sm ${type === 'song' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Chanson</button>
          <button type="button" onClick={() => setType('workshop')} className={`rounded-lg px-3 py-2 text-sm ${type === 'workshop' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Atelier</button>
          <button type="button" onClick={() => setType('general')} className={`rounded-lg px-3 py-2 text-sm ${type === 'general' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Général</button>
        </div>

        {type === 'song' ? (
          <p className="mb-4 rounded-lg border border-sky-700/40 bg-sky-950/20 px-4 py-3 text-sm text-sky-200">
            Vous n&apos;avez pas besoin de tout remplir. Envoyez simplement votre demande et nous pourrons vous appeler pour créer la chanson avec vous.
          </p>
        ) : null}

        {error ? <p className="mb-3 rounded-lg border border-red-700/50 bg-red-950/20 px-3 py-2 text-sm text-red-200">{error}</p> : null}
        {success ? <p className="mb-3 rounded-lg border border-emerald-700/50 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-200">{success}</p> : null}

        <form onSubmit={(e) => void submit(e)} noValidate className="grid gap-3 sm:grid-cols-2">
          <input autoComplete="name" placeholder="Nom *" value={form.fullName} onChange={f('fullName')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={type === 'song' ? 'Courriel (optionnel si téléphone fourni)' : 'Courriel *'}
            value={form.email}
            onChange={f('email')}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder={type === 'song' ? 'Téléphone (optionnel si courriel fourni)' : 'Téléphone'}
            value={form.phone}
            onChange={f('phone')}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2"
          />

          {type === 'song' ? (
            <>
              <label className="col-span-2 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm hover:border-primary-500/50">
                <input
                  type="checkbox"
                  checked={preferCallback}
                  onChange={(e) => setPreferCallback(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary-500"
                />
                <span className="text-slate-200">
                  Je préfère être appelé(e) pour expliquer ma chanson — vous pouvez laisser les détails vides
                </span>
              </label>

              {preferCallback ? (
                <p className="col-span-2 rounded-lg border border-amber-700/40 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
                  Notre équipe vous contactera pour créer la chanson avec vous. Aucun détail supplémentaire n&apos;est nécessaire.
                </p>
              ) : (
                <>
                  <input placeholder="Sujet de la chanson (optionnel)" value={form.subject} onChange={f('subject')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2" />
                  <input placeholder="Personne concernée (optionnel)" value={form.recipientName} onChange={f('recipientName')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
                  <input placeholder="Style musical souhaité (optionnel)" value={form.style} onChange={f('style')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
                  <input type="number" min="0" step="0.01" placeholder="Budget (optionnel)" value={form.budget} onChange={f('budget')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
                  <input type="date" value={form.desiredDate} onChange={f('desiredDate')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-400" />
                  <textarea rows={4} placeholder="Détails, émotions, thème... (optionnel)" value={form.details} onChange={f('details')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2" />
                </>
              )}
            </>
          ) : null}

          {type === 'workshop' ? (
            <>
              <input placeholder="Organisation *" value={form.organizationName} onChange={f('organizationName')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2" />
              <input placeholder="Type de groupe" value={form.groupType} onChange={f('groupType')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input type="number" min="1" placeholder="Nombre de participants" value={form.participants} onChange={f('participants')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input placeholder="Âge approximatif" value={form.ageRange} onChange={f('ageRange')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input placeholder="Lieu" value={form.location} onChange={f('location')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input type="date" value={form.desiredDate} onChange={f('desiredDate')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-400" />
              <input placeholder="Durée souhaitée" value={form.desiredDuration} onChange={f('desiredDuration')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <textarea rows={5} placeholder="Message / détails *" value={form.details} onChange={f('details')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2" />
            </>
          ) : null}

          {type === 'general' ? (
            <>
              <input placeholder="Sujet *" value={form.subject} onChange={f('subject')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2" />
              <textarea rows={5} placeholder="Message / détails *" value={form.details} onChange={f('details')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2" />
            </>
          ) : null}

          <button type="submit" disabled={loading} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-60 sm:col-span-2">
            {loading ? 'Envoi...' : 'Envoyer la demande'}
          </button>
        </form>
      </div>
    </main>
  );
}