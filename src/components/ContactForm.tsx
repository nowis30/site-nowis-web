'use client';

import { useState } from 'react';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [projectType, setProjectType] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const isSubmitting = state === 'submitting';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          projectType,
          message,
          kind: 'contact',
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'envoyer le message.");
      }

      setState('success');
      setName('');
      setEmail('');
      setPhone('');
      setProjectType('');
      setMessage('');
    } catch (error) {
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erreur inconnue.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-950">Envoyer un message</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Decris ton idee, ton objectif ou le type de creation que tu veux lancer.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Nom
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-emerald-500"
            placeholder="Ton nom"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-emerald-500"
            placeholder="toi@exemple.com"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Telephone
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-emerald-500"
            placeholder="819 000-0000"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Type de projet
          <input
            value={projectType}
            onChange={(event) => setProjectType(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-emerald-500"
            placeholder="Chanson, video, visuel, collaboration..."
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Message
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          rows={6}
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-emerald-500"
          placeholder="Explique ton besoin, ton echeance, le style recherche ou ce que tu veux creer."
        />
      </label>

      {state === 'success' ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Message envoye. Une reponse suivra des que possible.
        </p>
      ) : null}

      {state === 'error' ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 inline-flex rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Envoi...' : 'Envoyer le message'}
      </button>
    </form>
  );
}
