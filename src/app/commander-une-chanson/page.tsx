import Link from 'next/link';
import Script from 'next/script';
import { PageHero } from '@/components/marketing/PageHero';
import { PublicInquiryForm } from '@/components/marketing/PublicInquiryForm';
import { OfferDetails } from '@/components/marketing/OfferDetails';
import {
  SongHowItWorksSectionWithData, SongFinalCtaSectionWithData, SongGuaranteeBlock,
  SongPackagesSectionWithData, SongPortfolioBlock, SongProjectTypesSection, SongVideoExtrasSection, WhyNowisSection,
} from '@/components/marketing/SongSalesSections';
import { songPackages, songProcessSteps, songSalesCtas } from '@/data/songSales';
import { buildMetadata } from '@/lib/seo';
import { formatPrice, REGULAR_PRICES } from '@/data/pricing';
import { buildServiceSchema } from '@/lib/structured-data';
import { getAdminBlockValue, getAdminPage, getAdminRuntimePayload, getAdminSection } from '@/lib/admin-runtime';

function pickText(value: string | null | undefined, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
function pickHref(value: string | null | undefined, fallback: string) {
  const href = value?.trim();
  return href && (href.startsWith('/') || href.startsWith('#') || /^https?:\/\//.test(href)) ? href : fallback;
}

export const metadata = buildMetadata({
  title: 'Demander une chanson personnalisée | Création Nowis',
  description: 'Expliquez votre histoire à Création Nowis et demandez une chanson personnalisée sans créer de compte. Tarif et livrables confirmés avant le début du projet.',
  path: '/commander-une-chanson', image: '/hero.jpg',
  keywords: ['demander une chanson personnalisée', 'chanson personnalisée Québec', 'Nowis Morin chanson sur mesure', 'vidéo IA chanson'],
});

export default async function CommanderUneChansonPage() {
  const serviceSchema = buildServiceSchema({
    name: 'Chansons personnalisées sur mesure',
    description: 'Création Nowis conçoit des chansons personnalisées à partir d’histoires, de souvenirs et d’émotions, avec accompagnement humain et options vidéo IA.',
    path: '/commander-une-chanson', serviceType: 'Chanson personnalisée',
    audience: ['Familles', 'Couples', 'Événements', 'Projets personnels'],
  });
  const runtimePayload = await getAdminRuntimePayload();
  const page = getAdminPage(runtimePayload, 'commander-une-chanson');
  const hero = getAdminSection(page, 'song.hero');
  const how = getAdminSection(page, 'song.how-it-works');
  const packages = getAdminSection(page, 'song.packages');
  const final = getAdminSection(page, 'song.final-cta');
  const howSteps = [1, 2, 3].map((index) => {
    const fallback = songProcessSteps[index - 1];
    return {
      step: how?.isActive ? pickText(getAdminBlockValue(how, `step${index}.label`), fallback.step) : fallback.step,
      title: how?.isActive ? pickText(getAdminBlockValue(how, `step${index}.title`), fallback.title) : fallback.title,
      description: how?.isActive ? pickText(getAdminBlockValue(how, `step${index}.text`), fallback.description) : fallback.description,
    };
  });
  const packageOverrides = [1, 2, 3].map((index) => {
    const fallback = songPackages[index - 1];
    return {
      ...fallback,
      name: packages?.isActive ? pickText(getAdminBlockValue(packages, `item${index}.title`), fallback.name) : fallback.name,
      description: packages?.isActive ? pickText(getAdminBlockValue(packages, `item${index}.text`), fallback.description) : fallback.description,
    };
  });
  return (
    <div className="site-background text-[color:var(--site-text)]">
      <Script id="song-service-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <PageHero
        eyebrow={hero?.isActive ? pickText(getAdminBlockValue(hero, 'eyebrow'), 'Chanson personnalisée') : 'Chanson personnalisée'}
        title={hero?.isActive ? pickText(hero.title, 'Une chanson sur mesure à partir de votre histoire') : 'Une chanson sur mesure à partir de votre histoire'}
        description={hero?.isActive ? pickText(hero.description, 'Je crée une chanson à partir de vos paroles, de vos souvenirs ou d’un moment important de votre vie.') : 'Je crée une chanson à partir de vos paroles, de vos souvenirs ou d’un moment important de votre vie.'}
        primaryCta={{ label: 'Parler de ma chanson — sans compte', href: '#demande' }}
        secondaryCta={{ label: 'Écouter des exemples', href: hero?.isActive ? pickHref(getAdminBlockValue(hero, 'secondaryCta.href'), songSalesCtas.listen.href) : songSalesCtas.listen.href }}
      />
      <section id="demande" aria-label="Première demande de chanson sans compte" className="mx-auto grid max-w-6xl gap-6 px-4 pb-12 sm:px-6 min-[1200px]:grid-cols-[1.15fr_0.85fr]">
        <PublicInquiryForm serviceType="chanson" portalPath="/client/song-requests/nouveau" />
        <OfferDetails type="chanson" />
      </section>
      <SongProjectTypesSection />
      <SongHowItWorksSectionWithData theme="light" data={{
        title: how?.isActive ? pickText(how.title, 'De votre histoire à votre chanson') : 'De votre histoire à votre chanson',
        description: 'Commencez par quelques mots. Le prix et les livrables sont confirmés avant de lancer la création.',
        steps: howSteps,
      }} />
      <SongPackagesSectionWithData data={{
        eyebrow: 'Accompagnements sur mesure',
        title: packages?.isActive ? pickText(packages.title, 'Trois approches, selon votre projet') : 'Trois approches, selon votre projet',
        description: `Ces accompagnements sur mesure font l’objet d’une soumission. Ils ne sont pas automatiquement inclus dans la chanson souvenir simple à ${formatPrice(REGULAR_PRICES.songs.memorySong)}.`,
        packages: packageOverrides,
      }} />
      <SongVideoExtrasSection theme="light" />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><WhyNowisSection /></section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 min-[1200px]:grid-cols-2">
        <SongGuaranteeBlock /><SongPortfolioBlock />
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <SongFinalCtaSectionWithData data={{
          title: final?.isActive ? pickText(final.title, 'Votre projet commence par un échange') : 'Votre projet commence par un échange',
          description: 'Expliquez le contexte et l’émotion recherchée. Aucun compte n’est nécessaire pour cette première demande.',
          primaryCta: { label: 'Envoyer ma première demande', href: '#demande' },
          secondaryCta: { label: 'Contact direct', href: '/contact' },
        }} />
      </section>
      <section id="acces-portail" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6" aria-label="Suivi d’un projet existant">
        <div className="brand-card p-6">
          <h2 className="text-xl font-semibold">Vous avez déjà un projet en cours?</h2>
          <p className="mt-2 leading-7">Le portail reste disponible pour suivre vos documents et votre création. La page de connexion vous laisse choisir Google ou le courriel.</p>
          <Link href="/connexion?next=%2Fclient%2Fsong-requests%2Fnouveau" className="cta-secondary mt-4 min-h-11 px-5 py-3">Ouvrir mon portail</Link>
          <Link href="/avant-de-mecrire" className="ml-0 mt-4 inline-flex min-h-11 items-center px-5 underline sm:ml-4">Bien préparer ma demande</Link>
        </div>
      </section>
    </div>
  );
}
