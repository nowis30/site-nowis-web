'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LockKeyhole, Mail, MapPin, MessageSquare, Phone, ShieldCheck, User2 } from 'lucide-react';
import { clientRegisterSchema } from '@/features/client-portal/auth/validators';

export function ClientRegisterCard() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [suggestLogin, setSuggestLogin] = useState(false);

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setConfirmation(null);
    setSuggestLogin(false);

    const parsed = clientRegisterSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Formulaire invalide.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/client-auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setSuggestLogin(true);
        }
        throw new Error(data.error || 'Inscription impossible.');
      }
      setConfirmation(data.message || 'Compte cree avec succes. Redirection en cours...');
      router.push(data.redirectTo || '/client/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="crm-surface overflow-hidden p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl border border-primary-500/30 bg-primary-500/10 p-3 text-primary-300">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Acces client</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">Creer votre compte</h1>
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-300">
          Votre inscription cree automatiquement votre fiche dans le CRM Nowis et vous donne un acces direct a votre portail client.
        </p>

        <form onSubmit={submit} className="mt-8 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-200">Nom complet</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3">
              <User2 size={18} className="text-slate-500" />
              <input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} placeholder="Votre nom complet" className="w-full bg-transparent text-sm text-white placeholder-slate-500" />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Adresse email</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3">
              <Mail size={18} className="text-slate-500" />
              <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="vous@exemple.com" className="w-full bg-transparent text-sm text-white placeholder-slate-500" />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Telephone</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3">
              <Phone size={18} className="text-slate-500" />
              <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="514 555-0000" className="w-full bg-transparent text-sm text-white placeholder-slate-500" />
            </div>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-200">Mot de passe</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3">
              <LockKeyhole size={18} className="text-slate-500" />
              <input type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder="8 caracteres minimum, avec majuscule et chiffre" className="w-full bg-transparent text-sm text-white placeholder-slate-500" />
            </div>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-200">Adresse (optionnel)</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3">
              <MapPin size={18} className="text-slate-500" />
              <input value={form.address} onChange={(event) => updateField('address', event.target.value)} placeholder="Adresse ou unite" className="w-full bg-transparent text-sm text-white placeholder-slate-500" />
            </div>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-200">Message (optionnel)</span>
            <div className="flex items-start gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3">
              <MessageSquare size={18} className="mt-0.5 text-slate-500" />
              <textarea value={form.message} onChange={(event) => updateField('message', event.target.value)} placeholder="Precisez votre situation ou votre demande" rows={4} className="w-full resize-none bg-transparent text-sm text-white placeholder-slate-500" />
            </div>
          </label>

          {confirmation ? <p className="md:col-span-2 rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{confirmation}</p> : null}
          {error ? <p className="md:col-span-2 rounded-xl border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</p> : null}
          {suggestLogin ? (
            <p className="md:col-span-2 text-sm text-slate-300">
              Un compte existe deja avec cet email. <Link href="/client" className="font-semibold text-primary-300 hover:text-primary-200">Connectez-vous ici</Link>.
            </p>
          ) : null}

          <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Creation...' : 'Creer mon compte'}
            </button>
            <Link href="/client" className="text-sm font-semibold text-primary-300 hover:text-primary-200">
              J'ai deja un compte
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
