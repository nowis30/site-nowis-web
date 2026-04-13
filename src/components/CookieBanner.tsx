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
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgba(131,97,67,0.12)] bg-[rgba(252,247,241,0.94)] px-4 py-5 backdrop-blur-md md:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-[1.75rem] border border-[rgba(131,97,67,0.12)] bg-[rgba(255,251,247,0.76)] px-4 py-4 shadow-soft md:flex-row md:items-center md:justify-between md:px-5">
        <p className="text-sm leading-6 text-[color:var(--site-muted)] md:max-w-3xl">
          Ce site utilise seulement des cookies utiles au fonctionnement du portail client et à la sécurité des sessions. Aucun cookie publicitaire ou de traçage tiers n&apos;est déposé.{' '}
          <Link href="/confidentialite" className="underline underline-offset-2 transition-colors hover:text-[color:var(--site-accent-strong)]">
            Politique de confidentialité
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={() => saveConsent('declined')}
            className="cta-secondary rounded-lg px-4 py-2 text-sm"
            type="button"
          >
            Fermer
          </button>
          <button
            onClick={() => saveConsent('accepted')}
            className="cta-primary rounded-lg px-5 py-2 text-sm"
            type="button"
          >
            J’ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
