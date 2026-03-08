'use client';

import { useEffect } from 'react';

export const UnregisterServiceWorker: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => {
        reg.unregister();
      });
    });
  }, []);

  return null;
};
