import Link from 'next/link';
import { TrackedPhoneLink } from '@/components/analytics/TrackedPhoneLink';
import { PublicInquiryForm } from '@/components/marketing/PublicInquiryForm';
import { socialLinks } from '@/config/socialLinks';
import { legalConfig, legalLinks } from '@/data/legal';
import { getAdminBlockValue, getAdminPage, getAdminRuntimePayload, getAdminSection } from '@/lib/admin-runtime';
import { buildMetadata } from '@/lib/seo';
import { PUBLIC_PROJECT_TYPES, type PublicProjectType } from '@/lib/public-inquiry-security';

function text(value: string | null | undefined, fallback: string) { return value?.trim() || fallback; }
function external(value: string | null | undefined, fallback: string) {
  try { const url = new URL(value || ''); return ['https:', 'http:'].includes(url.protocol) ? url.href : fallback; } catch { return fallback; }
}
export const metadata = buildMetadata({ title: 'Contact Création Nowis | Première demande sans compte', description: 'Demandez un atelier, une chanson personnalisée ou un projet créatif sans compte. Contact direct avec Création Nowis à Drummondville.', path: '/contact' });

export default async function ContactPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const searchParams = await props.searchParams;
  const payload = await getAdminRuntimePayload();
  const page = getAdminPage(payload, 'contact');
  const direct = getAdminSection(page, 'contact.direct-info');
  const social = getAdminSection(page, 'contact.social-links');
  const candidateEmail = direct?.isActive ? text(getAdminBlockValue(direct, 'email'), legalConfig.contactEmail) : legalConfig.contactEmail;
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail) ? candidateEmail : legalConfig.contactEmail;
  const phone = direct?.isActive ? text(getAdminBlockValue(direct, 'phone'), legalConfig.contactPhone) : legalConfig.contactPhone;
  const digits = phone.replace(/[^\d+]/g, '');
  const phoneHref = digits.length >= 8 ? `tel:${digits}` : legalConfig.contactPhoneHref;
  const networks = [
    { label: 'Spotify', key: 'spotify', fallback: socialLinks.spotify },
    { label: 'YouTube', key: 'youtube', fallback: socialLinks.youtube },
    { label: 'Instagram', key: 'instagram', fallback: socialLinks.instagram },
    { label: 'Facebook', key: 'facebook', fallback: socialLinks.facebook },
  ];
  const requestedType = typeof searchParams?.projectType === 'string' ? searchParams.projectType : '';
  const serviceType = PUBLIC_PROJECT_TYPES.includes(requestedType as PublicProjectType) ? requestedType as PublicProjectType : 'autre';
  const message = typeof searchParams?.message === 'string' ? searchParams.message : '';
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-[color:var(--site-text)] sm:px-6 md:py-12">
      <header className="max-w-3xl">
        <p className="brand-chip inline-flex">Contact direct</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Parlons de votre projet, simplement</h1>
        <p className="mt-4 text-base leading-7 text-[color:var(--site-muted)]">Une chanson, un atelier ou une question? Envoyez un premier message sans compte. Le portail pourra servir au suivi après le premier échange.</p>
        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <a href={`mailto:${email}`} className="cta-secondary inline-flex min-h-12 items-center justify-center break-all px-5 py-3">{email}</a>
          <TrackedPhoneLink href={phoneHref} className="cta-secondary inline-flex min-h-12 items-center justify-center px-5 py-3">{phone}</TrackedPhoneLink>
        </div>
      </header>
      <section id="demande" className="mt-6 grid items-start gap-6 min-[1200px]:grid-cols-[1.2fr_0.8fr]" aria-label="Formulaire de première demande">
        <PublicInquiryForm serviceType={serviceType} initialMessage={message} />
        <aside className="brand-card p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Quel est votre projet?</h2>
          <p className="mt-3 leading-7 text-[color:var(--site-muted)]">Quelques phrases suffisent pour commencer. Vous pourrez préciser les détails avec Nowis avant toute commande payante.</p>
          <div className="mt-5 grid gap-3">
            <Link href="/commander-une-chanson" className="cta-secondary inline-flex min-h-12 items-center justify-center px-4 py-3">Commander une chanson</Link>
            <Link href="/ateliers/demande" className="cta-secondary inline-flex min-h-12 items-center justify-center px-4 py-3">Organiser un atelier</Link>
            <Link href="/tarifs" className="inline-flex min-h-11 items-center underline">Consulter les tarifs</Link>
            <Link href="/connexion" className="inline-flex min-h-11 items-center underline">J’ai déjà un compte client</Link>
          </div>
        </aside>
      </section>
      <section className="mt-8 grid gap-6 md:grid-cols-2" aria-label="Confidentialité et réseaux">
        <article className="brand-card p-6">
          <h2 className="text-xl font-bold">Vos renseignements personnels</h2>
          <p className="mt-3 text-sm leading-6">Responsable : {legalConfig.responsiblePrivacyName}. Pour une demande d’accès, de correction ou de retrait : <a className="break-all underline" href={`mailto:${legalConfig.privacyEmail}`}>{legalConfig.privacyEmail}</a>.</p>
          <nav className="mt-4 flex flex-col gap-2 text-sm" aria-label="Informations légales"><Link className="inline-flex min-h-11 items-center underline" href={legalLinks.privacy}>Politique de confidentialité</Link><Link className="inline-flex min-h-11 items-center underline" href={legalLinks.terms}>Conditions de vente</Link><Link className="inline-flex min-h-11 items-center underline" href={legalLinks.legal}>Mentions légales</Link></nav>
        </article>
        <article className="brand-card p-6">
          <h2 className="text-xl font-bold">Suivre Nowis Morin</h2>
          <p className="mt-3 text-sm leading-6">Retrouvez les chansons, vidéos et nouvelles créations.</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">{networks.map((network) => <a key={network.key} href={social?.isActive ? external(getAdminBlockValue(social, network.key), network.fallback) : network.fallback} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm underline">{network.label}<span className="sr-only"> — nouvel onglet</span></a>)}</div>
        </article>
      </section>
    </div>
  );
}
