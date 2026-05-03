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

export function SubmissionFormClient() {
  const searchParams = useSearchParams();
  const [type, setType] = useState<SubmissionType>(() => resolveInitialType(searchParams.get('type')));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
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
  });

  const title = useMemo(() => {
    if (type === 'song') return 'Nouvelle demande de chanson';
    if (type === 'workshop') return 'Nouvelle demande d atelier';
    return 'Nouvelle demande generale';
  }, [type]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

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
      const data = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Envoi impossible');

      setSuccess(data?.message || 'Demande envoyee avec succes.');
      setForm({
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
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Envoi impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-slate-100">
      <h1 className="text-3xl font-semibold text-white">{title}</h1>
      <p className="mt-2 text-sm text-slate-400">Formulaire public securise. Une demande est creee dans le CRM.</p>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => setType('song')} className={`rounded-lg px-3 py-2 text-sm ${type === 'song' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Chanson</button>
          <button type="button" onClick={() => setType('workshop')} className={`rounded-lg px-3 py-2 text-sm ${type === 'workshop' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Atelier</button>
          <button type="button" onClick={() => setType('general')} className={`rounded-lg px-3 py-2 text-sm ${type === 'general' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-300'}`}>General</button>
        </div>

        {error ? <p className="mb-3 rounded-lg border border-red-700/50 bg-red-950/20 px-3 py-2 text-sm text-red-200">{error}</p> : null}
        {success ? <p className="mb-3 rounded-lg border border-emerald-700/50 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-200">{success}</p> : null}

        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="Nom" value={form.fullName} onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          <input required type="email" placeholder="Courriel" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          <input placeholder="Telephone" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2" />

          {type === 'song' ? (
            <>
              <input required placeholder="Sujet de la chanson" value={form.subject} onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2" />
              <input required placeholder="Nom de la personne concernee" value={form.recipientName} onChange={(e) => setForm((s) => ({ ...s, recipientName: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input placeholder="Style musical souhaite" value={form.style} onChange={(e) => setForm((s) => ({ ...s, style: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input type="number" min="0" step="0.01" placeholder="Budget (optionnel)" value={form.budget} onChange={(e) => setForm((s) => ({ ...s, budget: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input type="date" placeholder="Date souhaitee" value={form.desiredDate} onChange={(e) => setForm((s) => ({ ...s, desiredDate: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            </>
          ) : null}

          {type === 'workshop' ? (
            <>
              <input required placeholder="Organisation" value={form.organizationName} onChange={(e) => setForm((s) => ({ ...s, organizationName: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2" />
              <input placeholder="Type de groupe" value={form.groupType} onChange={(e) => setForm((s) => ({ ...s, groupType: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input type="number" min="1" placeholder="Nombre de participants" value={form.participants} onChange={(e) => setForm((s) => ({ ...s, participants: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input placeholder="Age approximatif" value={form.ageRange} onChange={(e) => setForm((s) => ({ ...s, ageRange: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input placeholder="Lieu" value={form.location} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input type="date" placeholder="Date souhaitee" value={form.desiredDate} onChange={(e) => setForm((s) => ({ ...s, desiredDate: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input placeholder="Duree souhaitee" value={form.desiredDuration} onChange={(e) => setForm((s) => ({ ...s, desiredDuration: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            </>
          ) : null}

          {type === 'general' ? (
            <input required placeholder="Sujet" value={form.subject} onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2" />
          ) : null}

          <textarea required rows={5} placeholder="Message / details" value={form.details} onChange={(e) => setForm((s) => ({ ...s, details: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2" />

          <button type="submit" disabled={loading} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-60 sm:col-span-2">
            {loading ? 'Envoi...' : 'Envoyer la demande'}
          </button>
        </form>
      </div>
    </main>
  );
}
