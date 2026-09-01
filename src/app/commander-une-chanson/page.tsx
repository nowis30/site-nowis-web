import Link from 'next/link';
import Script from 'next/script';
import { ClientPortalRequestGate } from '@/components/marketing/ClientPortalRequestGate';
import { PageHero } from '@/components/marketing/PageHero';
import {
  SongHowItWorksSectionWithData,
  SongFinalCtaSectionWithData,
  SongGuaranteeBlock,
  SongPackagesSectionWithData,
  SongPortfolioBlock,
  SongProjectTypesSection,
  SongVideoExtrasSection,
  WhyNowisSection,
} from '@/components/marketing/SongSalesSections';
import { legalLinks } from '@/data/legal';
import { portfolioDisclosure, songPackages, songProcessSteps, songSalesCtas } from '@/data/songSales';
import { SONG_REQUEST_GOOGLE_AUTH_URL } from '@/lib/client-portal-routes';
import { buildMetadata } from '@/lib/seo';
import { buildServiceSchema } from '@/lib/structured-data';
import { getAdminBlockValue, getAdminPage, getAdminRuntimePayload, getAdminSection } from '@/lib/admin-runtime';

const DEFAULT_SONG_PAGE_CONTENT = {
  hero: {
    eyebrow: 'Chanson personnalisée',
    title: 'Une chanson sur mesure à partir de votre histoire',
    description: 'Je crée des chansons personnalisées à partir de vos paroles, de vos souvenirs ou d’un moment important de votre vie.',
    primaryCta: { label: songSalesCtas.order.label, href: SONG_REQUEST_GOOGLE_AUTH_URL },
    secondaryCta: { label: songSalesCtas.listen.label, href: songSalesCtas.listen.href },
  },
  how: {
    title: 'Une commande simple, claire et guidée du début à la fin',
    description: 'Le processus reste volontairement direct pour que l’offre soit facile à comprendre et rapide à lancer.',
  },
  packages: {
    eyebrow: 'Niveaux d’accompagnement',
    title: 'Trois façons d’aborder votre chanson sur mesure',
    description:
      'Selon votre point de départ, je peux mettre un texte en chanson, construire une chanson complète à partir d’une histoire ou accompagner une demande plus personnelle avec plus de délicatesse.',
  },
  final: {
    title: 'Un projet musical simple à lancer, sans complication',
    description:
      'Si tu veux passer à l’action, tu peux lancer directement la demande ou commencer par m’expliquer le contexte. Le but est de garder une prise de contact simple, rassurante et humaine.',
    primaryCta: { label: 'Commander une chanson', href: SONG_REQUEST_GOOGLE_AUTH_URL },
    secondaryCta: { label: songSalesCtas.talk.label, href: songSalesCtas.talk.href },
  },
};

function pickText(adminValue: string | null | undefined, fallback: string) {
  if (typeof adminValue !== 'string') return fallback;
  const value = adminValue.trim();
  return value.length > 0 ? value : fallback;
}

function pickHref(adminValue: string | null | undefined, fallback: string) {
  if (typeof adminValue !== 'string') return fallback;
  const value = adminValue.trim();
  if (!value) return fallback;
  return value.startsWith('/') || value.startsWith('#') || value.startsWith('https://') || value.startsWith('http://')
    ? value
    : fallback;
}

export const metadata = buildMetadata({
  title: 'Demander une chanson personnalisée | Création Nowis',
  description:
    'Demandez une chanson personnalisée avec Création Nowis : une création humaine, sur mesure, avec options visuelles ou vidéo IA et prise de contact simple depuis Drummondville vers tout le Québec.',
  path: '/commander-une-chanson',
  image: '/hero.jpg',
  keywords: ['demander une chanson personnalisée', 'chanson personnalisée Québec', 'Nowis Morin chanson sur mesure', 'vidéo IA chanson'],
});

export default async function CommanderUneChansonPage() {
  const serviceSchema = buildServiceSchema({
    name: 'Chansons personnalisées sur mesure',
    description:
      'Création Nowis conçoit des chansons personnalisées à partir d’histoires, de souvenirs et d’émotions, avec accompagnement humain et options vidéo IA.',
    path: '/commander-une-chanson',
    serviceType: 'Chanson personnalisée',
    audience: ['Familles', 'Couples', 'Événements', 'Projets personnels'],
  });

  const runtimePayload = await getAdminRuntimePayload();
  const adminPage = getAdminPage(runtimePayload, 'commander-une-chanson');

  const heroSection = getAdminSection(adminPage, 'song.hero');
  const howSection = getAdminSection(adminPage, 'song.how-it-works');
  const packagesSection = getAdminSection(adminPage, 'song.packages');
  const finalSection = getAdminSection(adminPage, 'song.final-cta');

  const heroEnabled = heroSection?.isActive ?? false;
  const howEnabled = howSection?.isActive ?? false;
  const packagesEnabled = packagesSection?.isActive ?? false;
  const finalEnabled = finalSection?.isActive ?? false;

  const heroEyebrow = heroEnabled
    ? pickText(getAdminBlockValue(heroSection, 'eyebrow'), DEFAULT_SONG_PAGE_CONTENT.hero.eyebrow)
    : DEFAULT_SONG_PAGE_CONTENT.hero.eyebrow;
  const heroTitle = heroEnabled
    ? pickText(heroSection?.title, DEFAULT_SONG_PAGE_CONTENT.hero.title)
    : DEFAULT_SONG_PAGE_CONTENT.hero.title;
  const heroDescription = heroEnabled
    ? pickText(heroSection?.description, DEFAULT_SONG_PAGE_CONTENT.hero.description)
    : DEFAULT_SONG_PAGE_CONTENT.hero.description;
  const heroPrimaryLabel = heroEnabled
    ? pickText(heroSection?.ctaLabel, DEFAULT_SONG_PAGE_CONTENT.hero.primaryCta.label)
    : DEFAULT_SONG_PAGE_CONTENT.hero.primaryCta.label;
  const heroPrimaryHref = heroEnabled
    ? pickHref(heroSection?.ctaHref, DEFAULT_SONG_PAGE_CONTENT.hero.primaryCta.href)
    : DEFAULT_SONG_PAGE_CONTENT.hero.primaryCta.href;
  const heroSecondaryLabel = heroEnabled
    ? pickText(getAdminBlockValue(heroSection, 'secondaryCta.label'), DEFAULT_SONG_PAGE_CONTENT.hero.secondaryCta.label)
    : DEFAULT_SONG_PAGE_CONTENT.hero.secondaryCta.label;
  const heroSecondaryHref = heroEnabled
    ? pickHref(getAdminBlockValue(heroSection, 'secondaryCta.href'), DEFAULT_SONG_PAGE_CONTENT.hero.secondaryCta.href)
    : DEFAULT_SONG_PAGE_CONTENT.hero.secondaryCta.href;

  const howSteps = [1, 2, 3].map((index) => {
    const fallback = songProcessSteps[index - 1];
    return {
      step: howEnabled
        ? pickText(getAdminBlockValue(howSection, `step${index}.label`), fallback?.step || `Étape ${index}`)
        : fallback?.step || `Étape ${index}`,
      title: howEnabled
        ? pickText(getAdminBlockValue(howSection, `step${index}.title`), fallback?.title || '')
        : fallback?.title || '',
      description: howEnabled
        ? pickText(getAdminBlockValue(howSection, `step${index}.text`), fallback?.description || '')
        : fallback?.description || '',
    };
  });

  const howTitle = howEnabled
    ? pickText(howSection?.title, DEFAULT_SONG_PAGE_CONTENT.how.title)
    : DEFAULT_SONG_PAGE_CONTENT.how.title;
  const howDescription = howEnabled
    ? pickText(howSection?.description, DEFAULT_SONG_PAGE_CONTENT.how.description)
    : DEFAULT_SONG_PAGE_CONTENT.how.description;

  const packageOverrides = [1, 2, 3].map((index) => {
    const fallback = songPackages[index - 1];
    return {
      ...fallback,
      name: packagesEnabled
        ? pickText(getAdminBlockValue(packagesSection, `item${index}.title`), fallback?.name || '')
        : fallback?.name || '',
      description: packagesEnabled
        ? pickText(getAdminBlockValue(packagesSection, `item${index}.text`), fallback?.description || '')
        : fallback?.description || '',
    };
  });

  const packagesTitle = packagesEnabled
    ? pickText(packagesSection?.title, DEFAULT_SONG_PAGE_CONTENT.packages.title)
    : DEFAULT_SONG_PAGE_CONTENT.packages.title;
  const packagesDescription = packagesEnabled
    ? pickText(packagesSection?.description, DEFAULT_SONG_PAGE_CONTENT.packages.description)
    : DEFAULT_SONG_PAGE_CONTENT.packages.description;

  const finalTitle = finalEnabled
    ? pickText(finalSection?.title, DEFAULT_SONG_PAGE_CONTENT.final.title)
    : DEFAULT_SONG_PAGE_CONTENT.final.title;
  const finalDescription = finalEnabled
    ? pickText(finalSection?.description, DEFAULT_SONG_PAGE_CONTENT.final.description)
    : DEFAULT_SONG_PAGE_CONTENT.final.description;
  const finalPrimaryLabel = finalEnabled
    ? pickText(finalSection?.ctaLabel, DEFAULT_SONG_PAGE_CONTENT.final.primaryCta.label)
    : DEFAULT_SONG_PAGE_CONTENT.final.primaryCta.label;
  const finalPrimaryHref = finalEnabled
    ? pickHref(finalSection?.ctaHref, DEFAULT_SONG_PAGE_CONTENT.final.primaryCta.href)
    : DEFAULT_SONG_PAGE_CONTENT.final.primaryCta.href;
  const finalSecondaryLabel = finalEnabled
    ? pickText(getAdminBlockValue(finalSection, 'cta2.label'), DEFAULT_SONG_PAGE_CONTENT.final.secondaryCta.label)
    : DEFAULT_SONG_PAGE_CONTENT.final.secondaryCta.label;
  const finalSecondaryHref = finalEnabled
    ? pickHref(getAdminBlockValue(finalSection, 'cta2.href'), DEFAULT_SONG_PAGE_CONTENT.final.secondaryCta.href)
    : DEFAULT_SONG_PAGE_CONTENT.final.secondaryCta.href;

  return (
    <main className="site-background text-[color:var(--site-text)]">
      <Script id="song-service-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <PageHero
        eyebrow={heroEyebrow}
        title={heroTitle}
        description={heroDescription}
        primaryCta={{ label: heroPrimaryLabel, href: heroPrimaryHref }}
        secondaryCta={{
          label: heroSecondaryLabel,
          href: heroSecondaryHref,
        }}
      />

      <SongProjectTypesSection />

      <SongHowItWorksSectionWithData
        theme="light"
        data={{
          title: howTitle,
          description: howDescription,
          steps: howSteps,
        }}
      />

      <SongPackagesSectionWithData
        data={{
          eyebrow: DEFAULT_SONG_PAGE_CONTENT.packages.eyebrow,
          title: packagesTitle,
          description: packagesDescription,
          packages: packageOverrides,
        }}
      />

      <SongVideoExtrasSection theme="light" />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
        <WhyNowisSection />
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2 lg:gap-8">
        <SongGuaranteeBlock />
        <SongPortfolioBlock />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 md:pb-20">
        <SongFinalCtaSectionWithData
          data={{
            title: finalTitle,
            description: finalDescription,
            primaryCta: {
              label: finalPrimaryLabel,
              href: finalPrimaryHref,
            },
            secondaryCta: {
              label: finalSecondaryLabel,
              href: finalSecondaryHref,
            },
          }}
        />
      </section>

      <section
        id="acces-portail"
        aria-labelledby="song-request-portal-title"
        className="mx-auto grid max-w-7xl scroll-mt-24 gap-8 px-4 pb-14 sm:px-6 md:pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10"
      >
        <div>
          <div className="brand-card rounded-[1.75rem] p-6 sm:p-8 md:p-10">
            <span className="brand-chip inline-flex">Commande</span>
            <h2 id="song-request-portal-title" className="mt-5 font-display text-3xl leading-tight text-[color:var(--site-heading)] sm:text-4xl">
              Envoyer une demande claire et complète
            </h2>
            <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)] sm:text-lg">
              Décris l’histoire, l’émotion recherchée et le type d’accompagnement souhaité. Si tu hésites encore, tu peux simplement raconter le contexte avec tes mots.
            </p>
            <p className="mt-5 rounded-2xl border border-[rgba(201,117,71,0.16)] bg-[rgba(255,247,238,0.72)] px-4 py-3 text-sm leading-6 text-[color:var(--site-muted)]">
              Chaque chanson est évaluée sur demande. L’objectif est de bien comprendre le contexte avant de confirmer une soumission ou une direction créative.
            </p>

            <div className="mt-7 rounded-2xl border border-[rgba(131,97,67,0.12)] bg-white/68 p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--site-accent-strong)]">Consentement portfolio</p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--site-muted)]">{portfolioDisclosure.text}</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--site-text)]">
                {portfolioDisclosure.options.map((option) => (
                  <li key={option} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(201,117,71,0.14)] text-sm font-bold text-[color:var(--site-accent-strong)]"
                    >
                      ✓
                    </span>
                    <span>{option}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7 warm-spotlight-panel p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--site-accent-strong)]">Portail sécurisé</p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--site-muted)]">
                Les demandes ne se font plus dans un formulaire public. Pour envoyer une demande de chanson et suivre son avancement, passez par le portail client sécurisé.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={legalLinks.terms}
                  className="cta-secondary min-h-11 w-full justify-center px-5 py-3 text-center text-sm sm:w-auto"
                >
                  Conditions de vente
                </Link>
                <Link
                  href={legalLinks.privacy}
                  className="cta-secondary min-h-11 w-full justify-center px-5 py-3 text-center text-sm sm:w-auto"
                >
                  Politique de confidentialité
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={SONG_REQUEST_GOOGLE_AUTH_URL}
              className="cta-primary min-h-12 w-full justify-center px-6 py-3 text-center sm:w-auto"
            >
              Demander une chanson
            </Link>
            <Link
              href={songSalesCtas.talk.href}
              className="cta-secondary min-h-12 w-full justify-center px-6 py-3 text-center sm:w-auto"
            >
              {songSalesCtas.talk.label}
            </Link>
          </div>
        </div>

        <div className="brand-card rounded-[1.75rem] p-4 sm:p-6">
          <span className="brand-chip inline-flex">Autre méthode</span>
          <p className="mt-3 text-sm leading-6 text-[color:var(--site-muted)]">
            Vous pouvez aussi passer par le portail client classique avec une inscription ou une connexion manuelle.
          </p>
          <div className="mt-5">
            <ClientPortalRequestGate nextPath="/client/song-requests/nouveau" showBackToPortal />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 md:pb-20" aria-labelledby="song-request-help-title">
        <div className="brand-card rounded-[1.75rem] p-6 sm:p-8 md:p-10">
          <span className="brand-chip inline-flex">Préparer sa demande</span>
          <h2 id="song-request-help-title" className="mt-5 font-display text-3xl leading-tight text-[color:var(--site-heading)] sm:text-4xl">
            Besoin d’un peu d’aide avant d’envoyer la demande?
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--site-muted)]">
            Si tu veux mieux préparer ton message avant de commander, la page de préparation peut t’aider à clarifier le ton, les détails importants et les attentes du projet.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/avant-de-mecrire"
              className="cta-secondary min-h-11 w-full justify-center px-6 py-3 text-center sm:w-auto"
            >
              Bien préparer ma demande
            </Link>
            <Link
              href={songSalesCtas.listen.href}
              className="cta-secondary min-h-11 w-full justify-center px-6 py-3 text-center sm:w-auto"
            >
              {songSalesCtas.listen.label}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
