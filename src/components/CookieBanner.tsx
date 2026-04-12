'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'nowis_cookie_consent';

type ConsentValue = 'accepted' | 'declined';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage unavailable (SSR safety)
    }
  }, []);

  function saveConsent(value: ConsentValue) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Consentement aux cookies"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-coal-950/95 px-4 py-5 backdrop-blur-md md:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-6 text-slate-300 md:max-w-3xl">
          Ce site utilise uniquement des cookies essentiels à son fonctionnement (session, sécurité). Aucun cookie
          publicitaire ou de traçage tiers n&apos;est installé.{' '}
          <Link href="/confidentialite" className="underline underline-offset-2 hover:text-white transition-colors">
            Politique de confidentialité
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={() => saveConsent('declined')}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
            type="button"
          >
            Refuser les non essentiels
          </button>
          <button
            onClick={() => saveConsent('accepted')}
            className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-500"
            type="button"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
