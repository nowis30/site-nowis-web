import Link from 'next/link';
import { principalCrmUrl } from '@/lib/principal-crm';

export default function InscriptionPage() {
  return <section className="nm-section mx-auto max-w-2xl" aria-labelledby="registration-closed-title">
    <p className="nm-eyebrow">Accès NOWIS</p>
    <h1 id="registration-closed-title" className="nm-page-title">Les inscriptions sont fermées sur cet ancien site.</h1>
    <p className="nm-intro">Pour accéder au CRM, rendez-vous dans le CRM principal.</p>
    <div className="nm-actions">
      <a className="cta-primary" href={principalCrmUrl} referrerPolicy="no-referrer">Ouvrir le CRM principal ↗</a>
      <Link className="cta-secondary" href="/connexion">Consulter mon ancien compte</Link>
    </div>
    <p className="mt-5 text-sm">Les comptes existants, leurs documents et leur historique restent conservés.</p>
  </section>;
}
