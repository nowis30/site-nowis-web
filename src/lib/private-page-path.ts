/** Capability URLs and password-reset paths must never reach marketing analytics. */
export function isPrivatePagePath(pathname: string) {
  return /^\/(crm|client|api|connexion|inscription|facture|soumission|facturation|mot-de-passe-oublie|reinitialiser-mot-de-passe)(\/|$)/.test(pathname);
}
