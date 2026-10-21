/** Enable the entry point only after the independent CRM has been deployed. */
export function immobilierServiceUrl(configured: string | undefined): string | null {
  if (!configured) return null;
  try {
    const url = new URL(configured);
    if (url.origin !== 'https://crm.nowis.store' || url.pathname !== '/' || url.username || url.password || url.search || url.hash) return null;
    return url.origin;
  } catch { return null; }
}

export const immobilierInquiryUrl = '/contact?' + new URLSearchParams({
  projectType: 'autre',
  message: 'Bonjour, je souhaite découvrir NOWIS Immobilier pour mon entreprise de gestion.\n\nEntreprise :\nNombre de logements :\nBesoins principaux :\n',
}).toString();
