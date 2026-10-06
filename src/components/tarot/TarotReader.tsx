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
    // Some embedded browser hosts expose the child document through a proxy.
    // Click/resize listeners below still place the dialog if observation is unavailable.
    if (dialog) {
      try { dialogObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] }); }
      catch { /* Layout remains available through the ordinary interaction listeners. */ }
    }
    const header = window.document.querySelector('.nm-header');
    const headerObserver = new ResizeObserver(placeDialog);
    headerObserver.observe(element);
    if (header) headerObserver.observe(header);
    window.addEventListener('scroll', placeDialog, { passive: true });
    window.addEventListener('resize', placeDialog);
    window.visualViewport?.addEventListener('resize', placeDialog);
    document.addEventListener('click', placeDialog, true);
    const readerWindow = document.defaultView;
    const scrollTargets = {
      'oracle:scroll-astro': 'astro-view',
      'oracle:scroll-ritual': 'oracle-ritual',
      'oracle:scroll-result': 'astro-result',
      'oracle:scroll-summary': 'summary-section',
      'oracle:scroll-summary-result': 'summary-result',
    } as const;
    let scrollFrame: number | null = null;
    const scrollSection = (id: string) => {
      if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
      measure();
      // Apply the iframe height before scrolling, so the parent does not
      // clamp the destination to its previous, shorter document height.
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = requestAnimationFrame(() => {
          scrollFrame = null;
          const target = document.getElementById(id);
          if (!target || target.hidden) return;
          let offset = 0;
          for (let ancestor: HTMLElement | null = target; ancestor; ancestor = ancestor.offsetParent as HTMLElement | null) offset += ancestor.offsetTop;
          const headerHeight = header?.getBoundingClientRect().height ?? 0;
          const top = window.scrollY + element.getBoundingClientRect().top + offset - (document.scrollingElement?.scrollTop ?? 0) - headerHeight - 20;
          window.scrollTo({ top: Math.max(0, top), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        });
      });
    };
    const sectionScrollers = Object.entries(scrollTargets).map(([event, id]) => {
      const handler = () => scrollSection(id);
      readerWindow?.addEventListener(event, handler);
      return { event, handler };
    });
    const receiveScroll = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== element.contentWindow) return;
      if (event.data?.type !== 'nowis-reader-scroll' || !Object.values(scrollTargets).includes(event.data.target)) return;
      scrollSection(event.data.target);
    };
    window.addEventListener('message', receiveScroll);
    measure();
    placeDialog();

    cleanup.current = () => {
      if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
      observer.disconnect();
      dialogObserver.disconnect();
      headerObserver.disconnect();
      window.removeEventListener('scroll', placeDialog);
      window.removeEventListener('resize', placeDialog);
      window.visualViewport?.removeEventListener('resize', placeDialog);
      document.removeEventListener('click', placeDialog, true);
      sectionScrollers.forEach(({ event, handler }) => readerWindow?.removeEventListener(event, handler));
      window.removeEventListener('message', receiveScroll);
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
        title="Oracle NOWIS : tarot, carte du ciel et conclusion des lectures"
        onLoad={connect}
        className="block w-full border-0 bg-[#101d31]"
        style={{ height }}
        referrerPolicy="no-referrer"
      />
      <noscript>
        <p className="px-6 py-4">Activez JavaScript pour lire votre tirage et calculer votre carte du ciel.</p>
      </noscript>
    </>
  );
}
