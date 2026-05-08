import { SongCard } from '@/components/music/SongCard';
import { PageHero } from '@/components/marketing/PageHero';
import { getAllSongs } from '@/data/songs';
import { buildMetadata } from '@/lib/seo';
import { SONG_REQUEST_GOOGLE_AUTH_URL } from '@/lib/client-portal-routes';
import { getAdminBlockValue, getAdminPage, getAdminRuntimePayload, getAdminSection, getAdminSectionVisualStyle } from '@/lib/admin-runtime';

const DEFAULT_MUSIQUE_CONTENT = {
  hero: {
    eyebrow: 'Musique',
    title: 'Des exemples pour entendre le style des chansons Création Nowis',
    description:
      'Cette page rassemble les chansons publiées pour te permettre d’écouter des exemples concrets avant de commander une création sur mesure.',
    primaryCta: { label: 'Commander une chanson', href: SONG_REQUEST_GOOGLE_AUTH_URL },
    secondaryCta: { label: 'Voir les vidéos', href: '/videos' },
  },
  grid: {
    title: 'Les créations musicales de Nowis Morin',
    description:
      'Ces chansons servent d’exemples d’écoute. Elles montrent la direction émotionnelle, la couleur musicale et l’approche générale avant de passer à une demande personnalisée.',
  },
};

function pickText(adminValue: string | null | undefined, fallback: string) {
  if (typeof adminValue !== 'string') return fallback;
  const value = adminValue.trim();
  return value.length > 0 ? value : fallback;
}

function pickInternalHref(adminValue: string | null | undefined, fallback: string) {
  if (typeof adminValue !== 'string') return fallback;
  const value = adminValue.trim();
  if (!value) return fallback;
  return value.startsWith('/') || value.startsWith('#') ? value : fallback;
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
  title: 'Musique | Création Nowis',
  description:
    'Écoute des exemples de chansons de Création Nowis pour découvrir le ton, l’émotion et la qualité des créations musicales personnalisées.',
  path: '/musique',
  keywords: ['musique Création Nowis', 'exemples chansons personnalisées', 'Nowis Morin musique', 'chansons Québec'],
});

export default async function MusiquePage() {
  const [songs, runtimePayload] = await Promise.all([getAllSongs(), getAdminRuntimePayload()]);
  const adminPage = getAdminPage(runtimePayload, 'musique');
  const heroSection = getAdminSection(adminPage, 'musique.hero');
  const songsGridSection = getAdminSection(adminPage, 'musique.songs-grid');

  const heroEnabled = heroSection?.isActive ?? false;
  const gridEnabled = songsGridSection?.isActive ?? false;
  const gridStyle = getAdminSectionVisualStyle(songsGridSection);
  const gridMobileSpacing = mobileSpacingClass(gridStyle.mobileSpacing);
  const gridAlign = alignClass(gridStyle.contentAlign, gridStyle.mobileAlign);

  const heroEyebrow = heroEnabled
    ? pickText(getAdminBlockValue(heroSection, 'eyebrow'), DEFAULT_MUSIQUE_CONTENT.hero.eyebrow)
    : DEFAULT_MUSIQUE_CONTENT.hero.eyebrow;
  const heroTitle = heroEnabled
    ? pickText(heroSection?.title, DEFAULT_MUSIQUE_CONTENT.hero.title)
    : DEFAULT_MUSIQUE_CONTENT.hero.title;
  const heroDescription = heroEnabled
    ? pickText(heroSection?.description, DEFAULT_MUSIQUE_CONTENT.hero.description)
    : DEFAULT_MUSIQUE_CONTENT.hero.description;
  const heroPrimaryLabel = heroEnabled
    ? pickText(heroSection?.ctaLabel, DEFAULT_MUSIQUE_CONTENT.hero.primaryCta.label)
    : DEFAULT_MUSIQUE_CONTENT.hero.primaryCta.label;
  const heroPrimaryHref = heroEnabled
    ? pickInternalHref(heroSection?.ctaHref, DEFAULT_MUSIQUE_CONTENT.hero.primaryCta.href)
    : DEFAULT_MUSIQUE_CONTENT.hero.primaryCta.href;
  const heroSecondaryLabel = heroEnabled
    ? pickText(getAdminBlockValue(heroSection, 'secondaryCta.label'), DEFAULT_MUSIQUE_CONTENT.hero.secondaryCta.label)
    : DEFAULT_MUSIQUE_CONTENT.hero.secondaryCta.label;
  const heroSecondaryHref = heroEnabled
    ? pickInternalHref(getAdminBlockValue(heroSection, 'secondaryCta.href'), DEFAULT_MUSIQUE_CONTENT.hero.secondaryCta.href)
    : DEFAULT_MUSIQUE_CONTENT.hero.secondaryCta.href;

  const gridTitle = gridEnabled
    ? pickText(songsGridSection?.title, DEFAULT_MUSIQUE_CONTENT.grid.title)
    : DEFAULT_MUSIQUE_CONTENT.grid.title;
  const gridDescription = gridEnabled
    ? pickText(songsGridSection?.description, DEFAULT_MUSIQUE_CONTENT.grid.description)
    : DEFAULT_MUSIQUE_CONTENT.grid.description;

  return (
    <div className="bg-slate-50">
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

      <section className={`mx-auto ${widthClass(gridStyle.contentWidth)} px-6 ${spacingClass(gridStyle.verticalSpacing)} ${gridMobileSpacing}`}>
        <div className={`${gridStyle.contentAlign === 'center' ? 'mx-auto max-w-4xl' : 'max-w-3xl'} ${gridAlign}`}>
          <h2 className={`${headingClass(gridStyle.headingScale)} font-bold text-slate-950`}>{gridTitle}</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            {gridDescription}
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {songs.map((song) => (
            <SongCard key={song.slug} song={song} />
          ))}
        </div>
      </section>
    </div>
  );
}
