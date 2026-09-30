'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export function RadioAccount() {
  const router = useRouter();
  const [register, setRegister] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      const email = String(form.get('email') || '');
      const password = String(form.get('password') || '');
      const response = await fetch(register ? '/api/radio/account' : '/api/client-auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(register ? { fullName: form.get('fullName'), email, password, website: form.get('website') || '' }
          : { email, password, next: '/radio#mes-favoris' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(!register && response.status === 401 ? 'Courriel ou mot de passe incorrect.' : data.message || 'Impossible de continuer. Réessayez.');
      router.push('/radio#mes-favoris'); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Vérifiez votre connexion et réessayez.'); }
    finally { setBusy(false); }
  }
  return <section className="nr-account nm-section">
    <Link className="nm-text-link" href="/radio">← Retour à la radio</Link>
    <p className="nm-eyebrow">Votre musique, à retrouver</p><h1>{register ? 'Mes chansons préférées.' : 'Bon retour à la radio.'}</h1>
    <p>Un compte gratuit pour garder vos favoris et les réécouter sur votre téléphone ou votre ordinateur.</p>
    <div className="nr-account-tabs" aria-label="Choisir une action"><button type="button" aria-pressed={register} disabled={busy} onClick={() => { setRegister(true); setError(''); }}>Créer mon compte</button><button type="button" aria-pressed={!register} disabled={busy} onClick={() => { setRegister(false); setError(''); }}>Me connecter</button></div>
    <form className="nr-form" onSubmit={submit}>
      {register && <label>Prénom ou pseudo<input name="fullName" autoComplete="nickname" required minLength={2} maxLength={80} /></label>}
      <label>Courriel<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label>Mot de passe<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 8 : 1} maxLength={register ? 72 : undefined} aria-describedby={register ? 'radio-password-help' : undefined} /></label>
      {register && <p id="radio-password-help" className="nm-fine">Au moins 8 caractères, avec une majuscule, une minuscule et un chiffre. Votre courriel reste privé.</p>}
      <div className="nr-honeypot" aria-hidden="true"><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {error && <p role="alert" className="nr-error">{error}</p>}
      <button className="cta-primary" disabled={busy}>{busy ? 'Un instant…' : register ? 'Créer mon compte gratuit' : 'Me connecter'}</button>
    </form>
    {!register && <Link className="nm-text-link" href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>}
    <p className="nm-fine">Déjà un compte client Nowis ? Utilisez le même courriel et mot de passe. <Link href="/confidentialite">Confidentialité</Link></p>
  </section>;
}
