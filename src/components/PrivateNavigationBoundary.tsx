'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { isPrivatePagePath } from '@/lib/private-page-path';

/** A CSP belongs to the current document, not to SPA route responses. */
export function PrivateNavigationBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [initialPrivate] = useState(() => isPrivatePagePath(pathname || '/'));
  const crossingBoundary = initialPrivate !== isPrivatePagePath(pathname || '/');
  useEffect(() => {
    if (crossingBoundary) window.location.replace(window.location.href);
  }, [crossingBoundary]);
  useEffect(() => {
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || isPrivatePagePath(url.pathname) === initialPrivate) return;
      event.preventDefault(); event.stopPropagation();
      window.location.assign(url.href);
    };
    document.addEventListener('click', navigate, true);
    return () => document.removeEventListener('click', navigate, true);
  }, [initialPrivate]);
  return crossingBoundary ? <p role="status">Ouverture de votre espace…</p> : children;
}
