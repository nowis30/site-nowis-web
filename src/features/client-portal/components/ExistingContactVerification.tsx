'use client';

import { useState } from 'react';

export function ExistingContactVerification({
  email,
  appearance = 'light',
  purpose = 'registration',
}: {
  email: string;
  appearance?: 'light' | 'dark';
  purpose?: 'registration' | 'login';
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const dark = appearance === 'dark';

  async function requestLink() {
    if (status === 'sending' || status === 'sent') return;
    setStatus('sending');
    setError(null);
    try {
      const response = await fetch('/api/client-auth/request-link', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Impossible d’envoyer le lien. Réessayez dans quelques minutes.');
      setStatus('sent');
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : 'Impossible d’envoyer le lien. Réessayez dans quelques minutes.');
    }
  }

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${dark ? 'border-amber-800/60 bg-amber-950/30 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
      <p>
        Pour protéger votre dossier, vérifiez d’abord l’adresse <strong>{email}</strong> avec un lien reçu par courriel.
        {purpose === 'login' ? ' Ouvrez ce lien pour vous connecter. Pour définir ou modifier un mot de passe, utilisez « Mot de passe oublié ».' : ' Ouvrez ce lien pour accéder à votre dossier, puis revenez sur ce formulaire si vous souhaitez définir un mot de passe.'}
      </p>
      {status === 'sent' ? (
        <p className="mt-2 font-medium" role="status">
          Si un dossier correspond à cette adresse, un lien sécurisé a été envoyé. Consultez votre boîte de réception et les courriels indésirables.
        </p>
      ) : (
        <button
          type="button"
          onClick={requestLink}
          disabled={status === 'sending'}
          className={`mt-3 inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${dark ? 'bg-primary-600 text-white hover:bg-primary-500 focus-visible:ring-primary-300' : 'bg-[color:var(--site-heading)] text-white hover:brightness-110 focus-visible:ring-[color:var(--site-accent)]'}`}
        >
          {status === 'sending' ? 'Envoi du lien…' : 'Recevoir un lien sécurisé par courriel'}
        </button>
      )}
      {error ? <p className="mt-2 font-medium" role="alert">{error}</p> : null}
    </div>
  );
}
