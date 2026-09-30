'use client';

import { useEffect } from 'react';

export const UnregisterServiceWorker: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.getRegistrations().then((regs) => Promise.all(regs
        .filter((reg) => {
          const script = reg.active?.scriptURL ?? reg.waiting?.scriptURL ?? reg.installing?.scriptURL;
          return script && new URL(script).pathname === '/sw.js';
        })
        .map((reg) => reg.unregister()))).catch(() => {});
    }
    if ('caches' in window) {
      void caches.keys().then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('creation-nowis-') || key.startsWith('nowis-'))
        .map((key) => caches.delete(key)))).catch(() => {});
    }
  }, []);

  return null;
};
