import { readCookieConsent } from '@/lib/cookie-consent';

type GoogleTrackingStore = { workshopRequestSubmissionIds: Record<string, true> };
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    __nowisGoogleTracking?: GoogleTrackingStore;
  }
}
const ga4MeasurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || '';
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || '';
const workshopConversionLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_WORKSHOP_CONVERSION_LABEL?.trim() || '';
const phoneConversionLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_PHONE_CONVERSION_LABEL?.trim() || '';

function sendGoogleEvent(eventName: string, params: Record<string, unknown>, category: 'analytics' | 'advertising' = 'analytics') {
  if (typeof window === 'undefined' || !readCookieConsent()?.[category] || typeof window.gtag !== 'function') return false;
  const destination = category === 'analytics' ? ga4MeasurementId : googleAdsId;
  if (!destination) return false;
  window.gtag('event', eventName, { send_to: destination, ...params });
  return true;
}
function buildAdsSendTo(label: string) { return googleAdsId && label ? `${googleAdsId}/${label}` : null; }

export function trackWorkshopRequestSubmitted(requestId: string) {
  const id = requestId.trim();
  if (!id || typeof window === 'undefined') return false;
  const store = window.__nowisGoogleTracking ??= { workshopRequestSubmissionIds: {} };
  if (store.workshopRequestSubmissionIds[id]) return false;
  let sent = sendGoogleEvent('workshop_request_submitted', { request_id: id });
  const destination = buildAdsSendTo(workshopConversionLabel);
  if (destination) sent = sendGoogleEvent('conversion', { send_to: destination }, 'advertising') || sent;
  if (sent) store.workshopRequestSubmissionIds[id] = true;
  return sent;
}
export function trackPhoneClick(phoneHref: string) {
  if (!phoneHref.trim()) return false;
  let sent = sendGoogleEvent('phone_click', { phone_href: phoneHref.trim() });
  const destination = buildAdsSendTo(phoneConversionLabel);
  if (destination) sent = sendGoogleEvent('conversion', { send_to: destination }, 'advertising') || sent;
  return sent;
}
export function trackRentalSiteClick(location: 'header' | 'home_feature' | 'home_card' | 'footer', destination: string) {
  if (!destination.trim()) return false;
  return sendGoogleEvent('rental_site_click', { location, destination: destination.trim() });
}
