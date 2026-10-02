'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function AiCommunityAccount() {
  const router = useRouter();
  const [register, setRegister] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '');
    const password = String(form.get('password') || '');

    setBusy(true);
    setError('');
    try {
      const response = await fetch(register ? '/api/radio/account' : '/api/client-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(register
          ? { fullName: form.get('fullName'), email, password, website: form.get('website') || '' }
          : { email, password, next: '/communaute-ia/profil' }),
      });
      const data = await response.json().catch(() => null) as { message?: string; error?: string } | null;
      if (!response.ok) throw new Error(data?.message || data?.error || 'Impossible de continuer.');
      router.push('/communaute-ia/profil');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vérifiez vos informations.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="nm-section mx-auto max-w-2xl">
      <Link className="nm-text-link" href="/communaute-ia">← Retour à la communauté</Link>
      <p className="nm-eyebrow mt-6">Compte membre</p>
      <h1 className="nm-page-title">{register ? 'Créez votre profil artiste.' : 'Revenez dans la communauté.'}</h1>
      <p className="nm-intro">Le même compte fonctionne pour la radio et la communauté musicale Nowis.</p>

      <div className="mt-7 flex gap-2 rounded-2xl bg-[color:var(--site-soft)] p-2">
        <button type="button" onClick={() => { setRegister(true); setError(''); }} aria-pressed={register}
          className="min-h-11 flex-1 rounded-xl px-4 py-2 font-semibold aria-pressed:bg-white aria-pressed:shadow-sm">
          Créer un compte
        </button>
        <button type="button" onClick={() => { setRegister(false); setError(''); }} aria-pressed={!register}
          className="min-h-11 flex-1 rounded-xl px-4 py-2 font-semibold aria-pressed:bg-white aria-pressed:shadow-sm">
          Me connecter
        </button>
      </div>

      <form onSubmit={submit} className="brand-card mt-5 rounded-[2rem] p-5 sm:p-7">
        {register ? (
          <label className="block text-sm font-medium text-[color:var(--site-heading)]">
            Nom ou pseudo
            <input name="fullName" required minLength={2} maxLength={80} autoComplete="nickname"
              className="mt-1.5 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3" />
          </label>
        ) : null}
        <label className="mt-4 block text-sm font-medium text-[color:var(--site-heading)]">
          Courriel
          <input name="email" type="email" required autoComplete="email"
            className="mt-1.5 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3" />
        </label>
        <label className="mt-4 block text-sm font-medium text-[color:var(--site-heading)]">
          Mot de passe
          <input name="password" type="password" required minLength={register ? 8 : 1} autoComplete={register ? 'new-password' : 'current-password'}
            className="mt-1.5 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3" />
        </label>
        {register ? <p className="mt-2 text-xs text-[color:var(--site-muted)]">8 caractères minimum, avec majuscule, minuscule et chiffre.</p> : null}
        <label className="hidden" aria-hidden="true">Site web<input name="website" tabIndex={-1} autoComplete="off" /></label>
        {error ? <p className="mt-4 text-sm text-red-700" role="alert">{error}</p> : null}
        <button className="cta-primary mt-5 w-full justify-center" disabled={busy}>
          {busy ? 'Un instant…' : register ? 'Créer mon compte artiste' : 'Me connecter'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[color:var(--site-muted)]">
        Vous pouvez aussi utiliser <Link className="nm-text-link" href="/connexion?next=/communaute-ia/profil">la connexion Google ou votre compte client Nowis</Link>.
      </p>
    </section>
  );
}
