import Link from 'next/link';
import { PublicInquiryForm } from '@/components/marketing/PublicInquiryForm';
import { OfferDetails } from '@/components/marketing/OfferDetails';
import { buildMetadata } from '@/lib/seo';
const GROUP_LABELS = { AINES_RESIDENCE: 'Aînés / résidence', ECOLE: 'École', ENTREPRISE: 'Entreprise', COMMUNAUTAIRE: 'Communautaire', PRIVE: 'Privé', AUTRE: 'Autre groupe' } as const;
type GroupType = keyof typeof GROUP_LABELS;
export const metadata = buildMetadata({ title: 'Demander un atelier sans compte | Création Nowis', description: 'Présentez votre groupe et votre projet d’atelier musical avec l’IA. Première demande sans compte ni paiement.', path: '/ateliers/demande' });

export default async function WorkshopRequestPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const searchParams = await props.searchParams;
  const raw = typeof searchParams?.groupType === 'string' ? searchParams.groupType : '';
  const groupType = Object.prototype.hasOwnProperty.call(GROUP_LABELS, raw) ? raw as GroupType : undefined;
  const nextPath = groupType ? `/client/workshops/nouveau?groupType=${encodeURIComponent(groupType)}` : '/client/workshops/nouveau';
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-[color:var(--site-text)] sm:px-6 md:py-12">
      <header className="max-w-3xl">
        <p className="brand-chip inline-flex">Demande d’atelier</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Organisons un atelier pour votre groupe</h1>
        <p className="mt-4 text-base leading-7 text-[color:var(--site-muted)]">Expliquez votre idée sans créer de compte. Le format, le tarif et les disponibilités seront précisés après le premier échange.</p>
        {groupType ? <p className="mt-3 font-semibold">Groupe sélectionné : {GROUP_LABELS[groupType]}</p> : null}
      </header>
      <section id="demande" className="mt-6 grid items-start gap-6 min-[1200px]:grid-cols-2" aria-label="Première demande d’atelier">
        <PublicInquiryForm serviceType="atelier" groupType={groupType} portalPath={nextPath} />
        <OfferDetails type="atelier" />
      </section>
      <div className="mt-6 flex flex-wrap gap-5 text-sm">
        <Link href="/ateliers" className="inline-flex min-h-11 items-center underline">Revoir les ateliers</Link>
        <Link href={`/connexion?next=${encodeURIComponent(nextPath)}`} className="inline-flex min-h-11 items-center underline">J’ai déjà un compte client</Link>
      </div>
    </div>
  );
}
