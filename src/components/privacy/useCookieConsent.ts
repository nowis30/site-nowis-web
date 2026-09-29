'use client';
import { useEffect, useState } from 'react';
import { COOKIE_CONSENT_EVENT, COOKIE_CONSENT_KEY, readCookieConsent, type CookieConsent } from '@/lib/cookie-consent';

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  useEffect(() => {
    const sync = () => setConsent(readCookieConsent());
    const crossTab = (event: StorageEvent) => {
      if (event.key === COOKIE_CONSENT_KEY || event.key === null) {
        // Also stops tags already running in this tab after withdrawal elsewhere.
        window.location.reload();
      }
    };
    sync();
    window.addEventListener(COOKIE_CONSENT_EVENT, sync);
    window.addEventListener('storage', crossTab);
    return () => { window.removeEventListener(COOKIE_CONSENT_EVENT, sync); window.removeEventListener('storage', crossTab); };
  }, []);
  return consent;
}
