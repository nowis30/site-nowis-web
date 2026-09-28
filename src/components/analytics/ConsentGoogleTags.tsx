'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useCookieConsent } from '@/components/privacy/useCookieConsent';
import '@/lib/tracking/google';

export function ConsentGoogleTags({ measurementId, adsId }: { measurementId: string; adsId: string }) {
  const consent = useCookieConsent();
  const pathname = usePathname();
  const configured = useRef(new Set<string>());
  const lastPage = useRef('');
  const gaId = /^G-[A-Z0-9]+$/.test(measurementId) ? measurementId : '';
  const advertisingId = /^AW-\d+$/.test(adsId) ? adsId : '';
  useEffect(() => {
    const analytics = !!consent?.analytics && !!gaId;
    const advertising = !!consent?.advertising && !!advertisingId;
    if (!analytics && !advertising) return;
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', {
        analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
      });
      window.gtag('js', new Date());
    }
    window.gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: advertising ? 'granted' : 'denied',
      ad_user_data: advertising ? 'granted' : 'denied',
      ad_personalization: advertising ? 'granted' : 'denied',
    });
    for (const tagId of [analytics ? gaId : '', advertising ? advertisingId : '']) {
      if (tagId && !configured.current.has(tagId)) {
        window.gtag('config', tagId, { send_page_view: false }); configured.current.add(tagId);
      }
    }
    if (!document.getElementById('nowis-consented-google-tag')) {
      const script = document.createElement('script');
      script.id = 'nowis-consented-google-tag'; script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analytics ? gaId : advertisingId)}`;
      document.head.appendChild(script);
    }
    const publicPage = pathname && !/^\/(crm|client|api|connexion|inscription)(\/|$)/.test(pathname);
    if (analytics && publicPage && lastPage.current !== pathname) {
      window.gtag('event', 'page_view', { send_to: gaId, page_path: pathname, page_location: `${window.location.origin}${pathname}` });
      lastPage.current = pathname;
    }
  }, [consent, gaId, advertisingId, pathname]);
  return null;
}
