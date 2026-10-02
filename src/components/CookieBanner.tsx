'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCookieConsent } from '@/components/privacy/useCookieConsent';
import { saveCookieConsent } from '@/lib/cookie-consent';

export function CookieBanner() {
  const consent = useCookieConsent();
  const [editing, setEditing] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const visible = !consent || editing;
  const banner = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = banner.current;
    if (!visible || !element) {
      document.documentElement.style.removeProperty('--nowis-cookie-banner-height');
      return;
    }
    const measure = () => document.documentElement.style.setProperty('--nowis-cookie-banner-height', `${Math.ceil(element.getBoundingClientRect().height)}px`);
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(element);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect(); window.removeEventListener('resize', measure);
      document.documentElement.style.removeProperty('--nowis-cookie-banner-height');
    };
  }, [visible, customizing]);
  const buttonClass = 'min-h-11 rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-2 text-sm font-semibold text-[color:var(--site-heading)] hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
  function choose(audience: boolean, ads: boolean) {
    saveCookieConsent({ analytics: audience, advertising: ads });
    setEditing(false); setCustomizing(false);
  }
  function openPreferences() {
    setAnalytics(consent?.analytics ?? false); setAdvertising(consent?.advertising ?? false);
    setCustomizing(true); setEditing(true);
  }
  return (
    <>
      <div className="border-t border-[color:var(--site-border)] bg-[#fcf7f1] px-4 pt-3 pb-[calc(5rem+env(safe-area-inset-bottom))] text-center text-sm">
        <button type="button" onClick={openPreferences} className="min-h-11 px-4 underline underline-offset-4">Gérer mes cookies</button>
      </div>
      {visible ? (
        <section ref={banner} data-cookie-banner="open" aria-label="Choix des cookies facultatifs" className="fixed inset-x-0 bottom-0 z-[200] max-h-[75dvh] overflow-y-auto border-t border-[color:var(--site-border)] bg-[#fcf7f1] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] sm:p-4">
          <div className="mx-auto grid max-w-6xl gap-3 min-[1200px]:grid-cols-[1fr_auto] min-[1200px]:items-center">
            <div>
              <h2 className="text-base font-bold text-[color:var(--site-heading)]">Votre choix de cookies</h2>
              <p className="mt-1 text-sm leading-5 text-[color:var(--site-muted)]">Les cookies essentiels restent actifs. La mesure d’audience (compteurs de visites et Google Analytics) et la publicité (Google Ads) sont facultatives, désactivées avant votre accord. <Link href="/confidentialite" className="underline">Confidentialité</Link></p>
            </div>
            <div className="grid grid-cols-2 gap-2 min-[1200px]:min-w-[20rem]">
              <button type="button" className={buttonClass} onClick={() => choose(false, false)}>Tout refuser</button>
              <button type="button" className={buttonClass} onClick={() => choose(true, true)}>Tout accepter</button>
              <button type="button" className="col-span-2 min-h-11 text-sm underline" onClick={() => {
                setAnalytics(consent?.analytics ?? false); setAdvertising(consent?.advertising ?? false); setCustomizing((value) => !value);
              }} aria-expanded={customizing} aria-controls="cookie-options">Personnaliser mes choix</button>
            </div>
            {customizing ? (
              <div id="cookie-options" className="space-y-3 rounded-xl border border-[color:var(--site-border)] bg-white p-4 min-[1200px]:col-span-2">
                <p className="text-sm">Cookies essentiels : toujours actifs pour la sécurité et les sessions du portail.</p>
                <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="h-5 w-5" />Mesure d’audience — compteurs de visites et Google Analytics</label>
                <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={advertising} onChange={(event) => setAdvertising(event.target.checked)} className="h-5 w-5" />Google Ads — mesure publicitaire</label>
                <button type="button" className={buttonClass} onClick={() => choose(analytics, advertising)}>Enregistrer mes choix</button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
