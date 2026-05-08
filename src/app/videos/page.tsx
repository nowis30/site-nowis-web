import { PageHero } from '@/components/marketing/PageHero';
import { VideoCard } from '@/components/videos/VideoCard';
import { getAllVideos } from '@/data/videos';
import { getAdminBlockValue, getAdminPage, getAdminRuntimePayload, getAdminSection, getAdminSectionVisualStyle } from '@/lib/admin-runtime';
import { SONG_REQUEST_GOOGLE_AUTH_URL } from '@/lib/client-portal-routes';
import { buildMetadata } from '@/lib/seo';

const DEFAULT_VIDEOS_CONTENT = {
  hero: {
    eyebrow: 'Videos',
    title: 'Des options visuelles et videos IA pour accompagner une chanson',
    description:
      'Cette section presente les videos et formats visuels comme complements creatifs autour de la musique, et non comme le service principal.',
    primaryCta: { label: 'Commander une chanson', href: SONG_REQUEST_GOOGLE_AUTH_URL },
    secondaryCta: {
      label: 'Parler de mon projet',
      href: '/contact?projectType=video&message=Bonjour, je veux discuter d une option visuelle ou video IA pour accompagner une chanson.',
    },
  },
  grid: {
    title: 'Des complements visuels pour prolonger l emotion d une chanson',
    description:
      'Les videos presentees ici servent a montrer la couleur visuelle possible autour d un projet musical. Elles peuvent accompagner une chanson, une sortie ou un souvenir, sans prendre la place de l offre principale.',
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
    <div className="bg-slate-50">
      <PageHero
        eyebrow={heroEyebrow}
        title={heroTitle}
        description={heroDescription}
        primaryCta={{ label: heroPrimaryLabel, href: heroPrimaryHref }}
        secondaryCta={{ label: heroSecondaryLabel, href: heroSecondaryHref }}
      />

      <section className={`mx-auto ${widthClass(gridStyle.contentWidth)} px-6 ${spacingClass(gridStyle.verticalSpacing)}`}>
        <div className={`${gridStyle.contentAlign === 'center' ? 'mx-auto max-w-4xl text-center' : 'max-w-3xl text-left'}`}>
          <h2 className={`${headingClass(gridStyle.headingScale)} font-bold text-slate-950`}>{gridTitle}</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            {gridDescription}
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <VideoCard key={video.slug} {...video} />
          ))}
        </div>
      </section>
    </div>
  );
}
