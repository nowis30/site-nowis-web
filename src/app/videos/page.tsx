import { PageHero } from '@/components/marketing/PageHero';
import { VideoCard } from '@/components/videos/VideoCard';
import { getAllVideos } from '@/data/videos';
import { getAdminBlockValue, getAdminPage, getAdminRuntimePayload, getAdminSection, getAdminSectionVisualStyle } from '@/lib/admin-runtime';
import { SONG_REQUEST_GOOGLE_AUTH_URL } from '@/lib/client-portal-routes';
import { buildMetadata } from '@/lib/seo';

const videoContactMessage = encodeURIComponent(
  'Bonjour, je veux discuter d’une option visuelle ou vidéo IA pour accompagner une chanson.',
);

const DEFAULT_VIDEOS_CONTENT = {
  hero: {
    eyebrow: 'Vidéos',
    title: 'Des options visuelles et vidéos IA pour accompagner une chanson',
    description:
      'Cette section présente les vidéos et formats visuels comme compléments créatifs autour de la musique, et non comme le service principal.',
    primaryCta: { label: 'Commander une chanson', href: SONG_REQUEST_GOOGLE_AUTH_URL },
    secondaryCta: {
      label: 'Parler de mon projet',
      href: `/contact?projectType=video&message=${videoContactMessage}`,
    },
  },
  grid: {
    title: 'Des compléments visuels pour prolonger l’émotion d’une chanson',
    description:
      'Les vidéos présentées ici servent à montrer la couleur visuelle possible autour d’un projet musical. Elles peuvent accompagner une chanson, une sortie ou un souvenir, sans prendre la place de l’offre principale.',
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

function widthClass(contentWidth: 'compact' | 'normal' | 'wide') {
  if (contentWidth === 'compact') return 'max-w-5xl';
  if (contentWidth === 'wide') return 'max-w-[92rem]';
  return 'max-w-7xl';
}

function spacingClass(verticalSpacing: 'tight' | 'normal' | 'airy') {
  if (verticalSpacing === 'tight') return 'py-10 md:py-12';
  if (verticalSpacing === 'airy') return 'py-20 md:py-24';
  return 'py-16 md:py-20';
}

function mobileSpacingClass(value: 'inherit' | 'compact' | 'comfortable' | 'airy') {
  if (value === 'compact') return 'py-8 md:py-12';
  if (value === 'comfortable') return 'py-14 md:py-20';
  if (value === 'airy') return 'py-20 md:py-24';
  return '';
}

function alignClass(contentAlign: 'left' | 'center', mobileAlign: 'inherit' | 'left' | 'center') {
  const desktop = contentAlign === 'center' ? 'md:text-center' : 'md:text-left';

  if (mobileAlign === 'center') return `text-center ${desktop}`;
  if (mobileAlign === 'left') return `text-left ${desktop}`;
  return contentAlign === 'center' ? 'text-center' : 'text-left';
}

function headingClass(headingScale: 'sm' | 'md' | 'lg') {
  if (headingScale === 'sm') return 'text-2xl md:text-3xl';
  if (headingScale === 'lg') return 'text-4xl md:text-5xl';
  return 'text-3xl md:text-4xl';
}

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Vidéos IA | Création Nowis',
  description:
    'Découvre les options visuelles et vidéos IA de Création Nowis, pensées comme compléments créatifs autour des chansons et projets musicaux.',
  path: '/videos',
  keywords: ['vidéo IA Québec', 'capsule vidéo chanson', 'visuel chanson', 'Création Nowis vidéos'],
});

export default async function VideosPage() {
  const [videos, runtimePayload] = await Promise.all([getAllVideos(), getAdminRuntimePayload()]);
  const adminPage = getAdminPage(runtimePayload, 'videos');
  const heroSection = getAdminSection(adminPage, 'videos.hero');
  const gridSection = getAdminSection(adminPage, 'videos.grid');

  const heroEnabled = heroSection?.isActive ?? false;
  const gridEnabled = gridSection?.isActive ?? false;
  const gridStyle = getAdminSectionVisualStyle(gridSection);
  const gridMobileSpacing = mobileSpacingClass(gridStyle.mobileSpacing);
  const gridAlign = alignClass(gridStyle.contentAlign, gridStyle.mobileAlign);

  const heroEyebrow = heroEnabled
    ? pickText(getAdminBlockValue(heroSection, 'eyebrow'), DEFAULT_VIDEOS_CONTENT.hero.eyebrow)
    : DEFAULT_VIDEOS_CONTENT.hero.eyebrow;
  const heroTitle = heroEnabled
    ? pickText(heroSection?.title, DEFAULT_VIDEOS_CONTENT.hero.title)
    : DEFAULT_VIDEOS_CONTENT.hero.title;
  const heroDescription = heroEnabled
    ? pickText(heroSection?.description, DEFAULT_VIDEOS_CONTENT.hero.description)
    : DEFAULT_VIDEOS_CONTENT.hero.description;
  const heroPrimaryLabel = heroEnabled
    ? pickText(heroSection?.ctaLabel, DEFAULT_VIDEOS_CONTENT.hero.primaryCta.label)
    : DEFAULT_VIDEOS_CONTENT.hero.primaryCta.label;
  const heroPrimaryHref = heroEnabled
    ? pickHref(heroSection?.ctaHref, DEFAULT_VIDEOS_CONTENT.hero.primaryCta.href)
    : DEFAULT_VIDEOS_CONTENT.hero.primaryCta.href;
  const heroSecondaryLabel = heroEnabled
    ? pickText(getAdminBlockValue(heroSection, 'secondaryCta.label'), DEFAULT_VIDEOS_CONTENT.hero.secondaryCta.label)
    : DEFAULT_VIDEOS_CONTENT.hero.secondaryCta.label;
  const heroSecondaryHref = heroEnabled
    ? pickHref(getAdminBlockValue(heroSection, 'secondaryCta.href'), DEFAULT_VIDEOS_CONTENT.hero.secondaryCta.href)
    : DEFAULT_VIDEOS_CONTENT.hero.secondaryCta.href;

  const gridTitle = gridEnabled
    ? pickText(gridSection?.title, DEFAULT_VIDEOS_CONTENT.grid.title)
    : DEFAULT_VIDEOS_CONTENT.grid.title;
  const gridDescription = gridEnabled
    ? pickText(gridSection?.description, DEFAULT_VIDEOS_CONTENT.grid.description)
    : DEFAULT_VIDEOS_CONTENT.grid.description;

  return (
    <div className="section-soft text-[color:var(--site-text)]">
      <PageHero
        eyebrow={heroEyebrow}
        title={heroTitle}
        description={heroDescription}
        primaryCta={{ label: heroPrimaryLabel, href: heroPrimaryHref }}
        secondaryCta={{ label: heroSecondaryLabel, href: heroSecondaryHref }}
      />

      <section
        aria-labelledby="video-gallery-title"
        className={`mx-auto ${widthClass(gridStyle.contentWidth)} px-4 sm:px-6 ${spacingClass(gridStyle.verticalSpacing)} ${gridMobileSpacing}`}
      >
        <div className={`${gridStyle.contentAlign === 'center' ? 'mx-auto max-w-4xl' : 'max-w-3xl'} ${gridAlign}`}>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--site-accent-strong)]">
            Galerie vidéo
          </p>
          <h2 id="video-gallery-title" className={`mt-3 font-display ${headingClass(gridStyle.headingScale)} text-[color:var(--site-heading)]`}>
            {gridTitle}
          </h2>
          <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)] sm:text-lg">
            {gridDescription}
          </p>
        </div>

        {videos.length > 0 ? (
          <div className="mt-10 grid gap-6 md:mt-12 md:grid-cols-2 md:gap-8 xl:grid-cols-3">
            {videos.map((video) => (
              <VideoCard key={video.slug} {...video} />
            ))}
          </div>
        ) : (
          <div className="brand-card mx-auto mt-10 max-w-3xl rounded-[1.75rem] px-6 py-9 text-center sm:px-8 md:mt-12">
            <h3 className="font-display text-2xl text-[color:var(--site-heading)]">De nouveaux exemples vidéo arrivent bientôt.</h3>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[color:var(--site-muted)]">
              Les options visuelles restent disponibles sur demande même lorsque la galerie publique est vide.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
