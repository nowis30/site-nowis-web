'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { clientLoginSchema } from '@/features/client-portal/auth/validators';

export function ClientLoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const externalMessage = useMemo(() => {
    const code = searchParams.get('error');
    if (code === 'invalid-link') return 'Le lien de connexion est invalide ou expire.';
    if (code === 'account-not-found') return 'Aucun compte client relie a ce lien.';
    return null;
  }, [searchParams]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = clientLoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Formulaire invalide.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/client-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Connexion impossible.');
      }
      router.push(data.redirectTo || '/client/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="crm-surface overflow-hidden p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl border border-primary-500/30 bg-primary-500/10 p-3 text-primary-300">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Acces client</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">Connexion au portail</h1>
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-300">
          Connectez-vous avec votre email et votre mot de passe pour acceder a votre portail client, que vous suiviez une chanson ou un atelier.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Adresse email</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3">
              <Mail size={18} className="text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@exemple.com"
                className="w-full bg-transparent text-sm text-white placeholder-slate-500"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Mot de passe</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3">
              <LockKeyhole size={18} className="text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Votre mot de passe"
                className="w-full bg-transparent text-sm text-white placeholder-slate-500"
              />
            </div>
          </label>

          {externalMessage ? <p className="rounded-xl border border-amber-800/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">{externalMessage}</p> : null}
          {error ? <p className="rounded-xl border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Connexion...' : 'Connexion'}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <p>Pas encore d'acces client ?</p>
          <Link href="/client/register" className="font-semibold text-primary-300 hover:text-primary-200">
            Creer mon acces
          </Link>
        </div>
      </div>
    </section>
  );
}
