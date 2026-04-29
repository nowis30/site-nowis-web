type GoogleTrackingStore = {
  workshopRequestSubmissionIds: Record<string, true>;
};

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

function getTrackingStore(): GoogleTrackingStore | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!window.__nowisGoogleTracking) {
    window.__nowisGoogleTracking = {
      workshopRequestSubmissionIds: {},
    };
  }

  return window.__nowisGoogleTracking;
}

function isGtagAvailable() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

function sendGoogleEvent(eventName: string, params: Record<string, unknown>) {
  if (!isGtagAvailable()) {
    return false;
  }

  window.gtag?.('event', eventName, params);
  return true;
}

function buildAdsSendTo(label: string) {
  if (!googleAdsId || !label) {
    return null;
  }

  return `${googleAdsId}/${label}`;
}

export function trackWorkshopRequestSubmitted(requestId: string) {
  const normalizedRequestId = requestId.trim();
  if (!normalizedRequestId) {
    return false;
  }

  const trackingStore = getTrackingStore();
  if (!trackingStore) {
    return false;
  }

  if (trackingStore.workshopRequestSubmissionIds[normalizedRequestId]) {
    return false;
  }

  if (ga4MeasurementId) {
    sendGoogleEvent('workshop_request_submitted', {
      request_id: normalizedRequestId,
    });
  }

  const adsSendTo = buildAdsSendTo(workshopConversionLabel);
  if (adsSendTo) {
    sendGoogleEvent('conversion', {
      send_to: adsSendTo,
    });
  }

  trackingStore.workshopRequestSubmissionIds[normalizedRequestId] = true;
  return true;
}

export function trackPhoneClick(phoneHref: string) {
  const normalizedPhoneHref = phoneHref.trim();
  if (!normalizedPhoneHref) {
    return false;
  }

  if (ga4MeasurementId) {
    sendGoogleEvent('phone_click', {
      phone_href: normalizedPhoneHref,
    });
  }

  const adsSendTo = buildAdsSendTo(phoneConversionLabel);
  if (adsSendTo) {
    sendGoogleEvent('conversion', {
      send_to: adsSendTo,
    });
  }

  return true;
}