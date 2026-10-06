import Link from 'next/link';
import Script from 'next/script';
import { PublicInquiryForm } from '@/components/marketing/PublicInquiryForm';
import { SongExamples, SongFaq, SongOffers, SongProcess } from '@/components/marketing/SongMarketingSections';
import { songOccasions } from '@/data/songMarketing';
import { buildMetadata } from '@/lib/seo';
import { buildServiceSchema } from '@/lib/structured-data';
import { getAdminPage, getAdminRuntimePayload, getAdminSection } from '@/lib/admin-runtime';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Une chanson personnalisée pour votre histoire | Création Nowis',
  description: 'Un anniversaire, un amour, un hommage : découvrez les chansons de Nowis, les formules et racontez votre idée sans compte ni paiement.',
  path: '/commander-une-chanson', keywords: ['chanson personnalisée Québec', 'chanson cadeau', 'Nowis Morin'],
});
export default async function CommanderUneChansonPage(props: {searchParams?: Promise<{occasion?: string | string[]}>}) {
  const searchParams = await props.searchParams;
  const occasion = songOccasions.find(item => item.id === searchParams?.occasion);
  const payload = await getAdminRuntimePayload();
  const hero = getAdminSection(getAdminPage(payload, 'commander-une-chanson'), 'song.hero');
  const title = hero?.isActive && hero.title?.trim() ? hero.title : 'Offrez une chanson. Racontez votre histoire.';
  const description = hero?.isActive && hero.description?.trim() ? hero.description : 'Vous avez une personne en tête, un souvenir ou un message à transmettre. Nowis vous aide à lui donner une forme musicale avec les outils d’IA.';
  const schema = buildServiceSchema({name:'Chanson personnalisée avec Nowis', description, path:'/commander-une-chanson', serviceType:'Chanson personnalisée', audience:['Familles','Couples','Événements','Projets personnels']});
  return <div className="nm-page">
    <Script id="song-service-schema" type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}} />
    <section className="nm-song-intro"><p className="nm-eyebrow">Un cadeau à écouter, une histoire à garder</p><h1 className="nm-page-title">{title}</h1><p className="nm-intro">{description}</p><div className="nm-actions"><a href="#demande" className="cta-primary">Raconter mon idée ↗</a><a href="#exemples" className="cta-secondary">Écouter des exemples</a></div><p className="nm-fine">Première demande sans compte ni paiement. Prix confirmé avant création.</p></section>
    <nav className="nm-subnav" aria-label="Découvrir la chanson personnalisée"><a href="#formules">Les formules</a><a href="#exemples">Les exemples</a><a href="#comment-ca-marche">Le déroulement</a><a href="#demande">Ma demande</a></nav>
    <SongOffers />
    <SongExamples />
    <SongProcess />
    <section id="demande" aria-label="Première demande de chanson sans compte" className="nm-section nm-inquiry">
      <div><p className="nm-eyebrow">Le premier pas</p><h2>Votre idée commence ici.</h2><p className="nm-intro">Quelques phrases suffisent pour ouvrir la discussion. Vous n’avez pas besoin de préparer tout un texte.</p>{occasion && <p className="nm-context">Votre occasion : <strong>{occasion.title}</strong><br />Le message proposé est modifiable.</p>}<ul className="nm-checklist"><li>Une réponse de Nowis à votre courriel.</li><li>Le contenu, le prix et la date précisés ensemble.</li><li>La création commence selon les conditions convenues.</li></ul><Link className="nm-text-link" href="/avant-de-mecrire">Des conseils pour préparer mon idée ↗</Link></div>
      <PublicInquiryForm key={occasion?.id || 'chanson'} serviceType="chanson" initialMessage={occasion?.prompt || ''} portalPath="/client/song-requests/nouveau" />
    </section>
    <SongFaq />
    <section className="nm-section nm-discover" id="acces-portail"><div><h2>Votre projet est déjà en cours ?</h2><p>Retrouvez vos documents et le suivi dans votre espace client.</p></div><Link className="cta-secondary" href="/connexion?next=%2Fclient%2Fsong-requests%2Fnouveau">Ouvrir mon portail</Link></section>
  </div>;
}
