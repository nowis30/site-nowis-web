'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function TarotReader() {
  const frame = useRef<HTMLIFrameElement>(null);
  const cleanup = useRef<(() => void) | null>(null);
  const [height, setHeight] = useState(1100);

  const connect = useCallback(() => {
    cleanup.current?.();
    const element = frame.current;
    const document = element?.contentDocument;
    if (!element || !document?.body) return;

    // Only layout is read from the local reader. Questions and answers stay there.
    const measure = () => {
      const naturalHeight = Math.ceil(document.body.getBoundingClientRect().height);
      if (naturalHeight > 0) setHeight(naturalHeight);
    };
    const placeDialog = () => {
      const bounds = element.getBoundingClientRect();
      const header = window.document.querySelector('.nm-header');
      const headerBottom = Math.max(0, header?.getBoundingClientRect().bottom ?? 0);
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const visibleTop = Math.max(headerBottom, bounds.top);
      const visibleBottom = Math.min(viewportHeight, bounds.bottom);
      document.documentElement.style.setProperty('--dialog-top', `${Math.max(0, visibleTop - bounds.top) + 16}px`);
      document.documentElement.style.setProperty('--dialog-height', `${Math.max(160, visibleBottom - visibleTop - 32)}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    const dialog = document.querySelector('dialog');
    const dialogObserver = new MutationObserver(placeDialog);
    if (dialog) dialogObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    const header = window.document.querySelector('.nm-header');
    const headerObserver = new ResizeObserver(placeDialog);
    headerObserver.observe(element);
    if (header) headerObserver.observe(header);
    window.addEventListener('scroll', placeDialog, { passive: true });
    window.addEventListener('resize', placeDialog);
    window.visualViewport?.addEventListener('resize', placeDialog);
    document.addEventListener('click', placeDialog, true);
    measure();
    placeDialog();

    cleanup.current = () => {
      observer.disconnect();
      dialogObserver.disconnect();
      headerObserver.disconnect();
      window.removeEventListener('scroll', placeDialog);
      window.removeEventListener('resize', placeDialog);
      window.visualViewport?.removeEventListener('resize', placeDialog);
      document.removeEventListener('click', placeDialog, true);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => cleanup.current?.();
  }, [connect]);

  return (
    <>
      <iframe
        ref={frame}
        src="/tarot-reader/index.html"
        title="Oracle NOWIS : rituel, tirage et interprétation du tarot"
        onLoad={connect}
        className="block w-full border-0 bg-[#101d31]"
        style={{ height }}
        referrerPolicy="no-referrer"
      />
      <noscript>
        <p className="px-6 py-4">Activez JavaScript pour mélanger les cartes et lire votre tirage.</p>
      </noscript>
    </>
  );
}
