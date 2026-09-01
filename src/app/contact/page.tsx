import { TrackedPhoneLink } from '@/components/analytics/TrackedPhoneLink';
import { ClientPortalRequestGate } from '@/components/marketing/ClientPortalRequestGate';
import { PageHero } from '@/components/marketing/PageHero';
import { socialLinks } from '@/config/socialLinks';
import { legalConfig, legalLinks } from '@/data/legal';
import { getAdminBlockValue, getAdminPage, getAdminRuntimePayload, getAdminSection, getAdminSectionVisualStyle } from '@/lib/admin-runtime';
import { SONG_REQUEST_GOOGLE_AUTH_URL } from '@/lib/client-portal-routes';
import { buildMetadata } from '@/lib/seo';

const DEFAULT_CONTACT_CONTENT = {
  hero: {
    eyebrow: 'Contact',
    title: 'Parlez-moi de votre groupe et de votre projet d\'atelier',
    description: 'Que ce soit pour un atelier, une chanson personnalisée ou un projet particulier — prenons contact. Les demandes d\'atelier et de projets se font via le portail client sécurisé.',
  },
  direct: {
    email: legalConfig.contactEmail,
    phone: legalConfig.contactPhone,
    phoneHref: legalConfig.contactPhoneHref,
    button1: {
      label: 'Demander un atelier',
      href: '/connexion?next=%2Fclient%2Fworkshops%2Fnouveau',
    },
    button2: {
      label: 'Commander une chanson personnalisée',
      href: SONG_REQUEST_GOOGLE_AUTH_URL,
    },
  },
  social: {
    spotify: socialLinks.spotify,
    youtube: socialLinks.youtube,
    instagram: socialLinks.instagram,
    facebook: socialLinks.facebook,
  },
};

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)] focus-visible:ring-offset-2';

function pickText(adminValue: string | null | undefined, fallback: string) {
  if (typeof adminValue !== 'string') return fallback;
  const value = adminValue.trim();
  return value.length > 0 ? value : fallback;
}

function pickEmail(adminValue: string | null | undefined, fallback: string) {
  const value = pickText(adminValue, fallback);
  return value.includes('@') ? value : fallback;
}

function pickSafeHref(adminValue: string | null | undefined, fallback: string) {
  if (typeof adminValue !== 'string') return fallback;
  const value = adminValue.trim();
  if (!value) return fallback;
  return value.startsWith('/') || value.startsWith('#') || value.startsWith('https://') || value.startsWith('http://')
    ? value
    : fallback;
}

function pickExternalHref(adminValue: string | null | undefined, fallback: string) {
  if (typeof adminValue !== 'string') return fallback;
  const value = adminValue.trim();
  if (!value) return fallback;
  return value.startsWith('https://') || value.startsWith('http://') ? value : fallback;
}

function normalizePhoneHref(phoneValue: string, fallbackHref: string) {
  const value = phoneValue.trim();
  if (!value) return fallbackHref;
  if (value.startsWith('tel:')) return value;

  const digits = value.replace(/[^\d+]/g, '');
  if (!digits || digits.length < 8) return fallbackHref;
  return `tel:${digits}`;
}

function widthClass(contentWidth: 'compact' | 'normal' | 'wide') {
  if (contentWidth === 'compact') return 'max-w-5xl';
  if (contentWidth === 'wide') return 'max-w-[92rem]';
  return 'max-w-7xl';
}

function spacingClass(verticalSpacing: 'tight' | 'normal' | 'airy') {
  if (verticalSpacing === 'tight') return 'py-10 md:py-12';
  if (verticalSpacing === 'airy') return 'py-20 md:py-24';
  return 'py-14 md:py-16';
}

export const metadata = buildMetadata({
  title: 'Contact Création Nowis | Demander un atelier, une chanson ou un projet créatif',
  description:
    'Contactez Création Nowis à Drummondville pour demander un atelier de création musicale avec l’IA, une chanson personnalisée ou un projet créatif. Réponse directe de Nowis Morin.',
  path: '/contact',
  keywords: ['contact Création Nowis', 'demander un atelier IA', 'demander une chanson personnalisée', 'Drummondville Québec'],
});

export default async function ContactPage() {
  const runtimePayload = await getAdminRuntimePayload();
  const adminPage = getAdminPage(runtimePayload, 'contact');
  const heroSection = getAdminSection(adminPage, 'contact.hero');
  const directSection = getAdminSection(adminPage, 'contact.direct-info');
  const socialSection = getAdminSection(adminPage, 'contact.social-links');

  const heroEnabled = heroSection?.isActive ?? false;
  const directEnabled = directSection?.isActive ?? false;
  const socialEnabled = socialSection?.isActive ?? false;
  const directStyle = getAdminSectionVisualStyle(directSection);

  const heroEyebrow = heroEnabled
    ? pickText(getAdminBlockValue(heroSection, 'eyebrow'), DEFAULT_CONTACT_CONTENT.hero.eyebrow)
    : DEFAULT_CONTACT_CONTENT.hero.eyebrow;
  const heroTitle = heroEnabled
    ? pickText(heroSection?.title, DEFAULT_CONTACT_CONTENT.hero.title)
    : DEFAULT_CONTACT_CONTENT.hero.title;
  const heroDescription = heroEnabled
    ? pickText(heroSection?.description, DEFAULT_CONTACT_CONTENT.hero.description)
    : DEFAULT_CONTACT_CONTENT.hero.description;

  const email = directEnabled
    ? pickEmail(getAdminBlockValue(directSection, 'email'), DEFAULT_CONTACT_CONTENT.direct.email)
    : DEFAULT_CONTACT_CONTENT.direct.email;
  const phone = directEnabled
    ? pickText(getAdminBlockValue(directSection, 'phone'), DEFAULT_CONTACT_CONTENT.direct.phone)
    : DEFAULT_CONTACT_CONTENT.direct.phone;
  const phoneHref = normalizePhoneHref(phone, DEFAULT_CONTACT_CONTENT.direct.phoneHref);

  const workshopRequestLabel = directEnabled
    ? pickText(getAdminBlockValue(directSection, 'button1.label'), DEFAULT_CONTACT_CONTENT.direct.button1.label)
    : DEFAULT_CONTACT_CONTENT.direct.button1.label;
  const workshopRequestHref = directEnabled
    ? pickSafeHref(getAdminBlockValue(directSection, 'button1.href'), DEFAULT_CONTACT_CONTENT.direct.button1.href)
    : DEFAULT_CONTACT_CONTENT.direct.button1.href;
  const songRequestLabel = directEnabled
    ? pickText(getAdminBlockValue(directSection, 'button2.label'), DEFAULT_CONTACT_CONTENT.direct.button2.label)
    : DEFAULT_CONTACT_CONTENT.direct.button2.label;
  const songRequestHref = directEnabled
    ? pickSafeHref(getAdminBlockValue(directSection, 'button2.href'), DEFAULT_CONTACT_CONTENT.direct.button2.href)
    : DEFAULT_CONTACT_CONTENT.direct.button2.href;

  const spotify = socialEnabled
    ? pickExternalHref(getAdminBlockValue(socialSection, 'spotify'), DEFAULT_CONTACT_CONTENT.social.spotify)
    : DEFAULT_CONTACT_CONTENT.social.spotify;
  const youtube = socialEnabled
    ? pickExternalHref(getAdminBlockValue(socialSection, 'youtube'), DEFAULT_CONTACT_CONTENT.social.youtube)
    : DEFAULT_CONTACT_CONTENT.social.youtube;
  const instagram = socialEnabled
    ? pickExternalHref(getAdminBlockValue(socialSection, 'instagram'), DEFAULT_CONTACT_CONTENT.social.instagram)
    : DEFAULT_CONTACT_CONTENT.social.instagram;
  const facebook = socialEnabled
    ? pickExternalHref(getAdminBlockValue(socialSection, 'facebook'), DEFAULT_CONTACT_CONTENT.social.facebook)
    : DEFAULT_CONTACT_CONTENT.social.facebook;

  return (
    <main className="text-[color:var(--site-text)]">
      <PageHero eyebrow={heroEyebrow} title={heroTitle} description={heroDescription} />

      <section
        className={`mx-auto grid ${widthClass(directStyle.contentWidth)} gap-6 px-6 ${spacingClass(directStyle.verticalSpacing)} lg:grid-cols-[1.05fr_0.95fr] lg:gap-8`}
      >
        <ClientPortalRequestGate nextPath="/client/dashboard" />

        <article className="brand-card p-7 sm:p-8 md:p-10">
          <span className="brand-chip inline-flex">Échange direct</span>
          <h2 className="mt-5 font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">
            Une façon simple de démarrer
          </h2>
          <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)]">
            Pour une demande rapide, une collaboration ou une idée à clarifier, choisissez le canal qui vous convient. Je pourrai ensuite vous orienter vers la bonne formule.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <a
              href={`mailto:${email}`}
              className={`cta-secondary inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-center font-semibold ${focusRing}`}
              aria-label={`Envoyer un courriel à ${email}`}
            >
              <span>
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--site-soft)]">Courriel</span>
                <span className="mt-1 block break-all">{email}</span>
              </span>
            </a>
            <TrackedPhoneLink
              href={phoneHref}
              className={`cta-secondary inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-center font-semibold ${focusRing}`}
              aria-label={`Appeler au ${phone}`}
            >
              <span>
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--site-soft)]">Téléphone</span>
                <span className="mt-1 block">{phone}</span>
              </span>
            </TrackedPhoneLink>
          </div>

          <div className="mt-6 grid gap-3">
            <a
              href={workshopRequestHref}
              className={`cta-primary inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-center font-semibold ${focusRing}`}
            >
              {workshopRequestLabel}
            </a>
            <a
              href={songRequestHref}
              className={`cta-secondary inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-center font-semibold ${focusRing}`}
            >
              {songRequestLabel}
            </a>
          </div>
        </article>

        <div className="grid gap-6 lg:col-span-2 lg:grid-cols-2 lg:gap-8">
          <article className="warm-spotlight-panel p-7 sm:p-8 md:p-10">
            <span className="brand-chip inline-flex">Vie privée</span>
            <h2 className="mt-5 font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">
              Protection des renseignements personnels
            </h2>
            <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)]">
              Responsable : {legalConfig.responsiblePrivacyName}. Pour toute demande liée à l’accès, à la correction ou au retrait de renseignements personnels, communiquez directement avec cette personne.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href={`mailto:${legalConfig.privacyEmail}`}
                className={`cta-secondary inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-3 text-center text-sm font-semibold ${focusRing}`}
              >
                {legalConfig.privacyEmail}
              </a>
              <TrackedPhoneLink
                href={legalConfig.privacyPhoneHref}
                className={`cta-secondary inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-3 text-center text-sm font-semibold ${focusRing}`}
              >
                {legalConfig.privacyPhone}
              </TrackedPhoneLink>
            </div>

            <nav className="mt-6 grid gap-3" aria-label="Informations légales">
              <a
                href={legalLinks.legal}
                className={`cta-secondary inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-3 text-center text-sm font-semibold ${focusRing}`}
              >
                Mentions légales
              </a>
              <a
                href={legalLinks.privacy}
                className={`cta-secondary inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-3 text-center text-sm font-semibold ${focusRing}`}
              >
                Politique de confidentialité
              </a>
              <a
                href={legalLinks.terms}
                className={`cta-secondary inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-3 text-center text-sm font-semibold ${focusRing}`}
              >
                Conditions de vente
              </a>
            </nav>
          </article>

          <article className="brand-card p-7 sm:p-8 md:p-10">
            <span className="brand-chip inline-flex">Réseaux et contenus</span>
            <h2 className="mt-5 font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">
              Suivre Nowis Morin
            </h2>
            <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)]">
              Retrouvez les chansons, vidéos et nouvelles créations sur les plateformes principales.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href={spotify}
                target="_blank"
                rel="noreferrer"
                className={`cta-secondary inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-center font-semibold ${focusRing}`}
              >
                Spotify<span className="sr-only"> — ouvre dans un nouvel onglet</span>
              </a>
              <a
                href={youtube}
                target="_blank"
                rel="noreferrer"
                className={`cta-secondary inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-center font-semibold ${focusRing}`}
              >
                YouTube<span className="sr-only"> — ouvre dans un nouvel onglet</span>
              </a>
              <a
                href={instagram}
                target="_blank"
                rel="noreferrer"
                className={`cta-secondary inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-center font-semibold ${focusRing}`}
              >
                Instagram<span className="sr-only"> — ouvre dans un nouvel onglet</span>
              </a>
              <a
                href={facebook}
                target="_blank"
                rel="noreferrer"
                className={`cta-secondary inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-center font-semibold ${focusRing}`}
              >
                Facebook<span className="sr-only"> — ouvre dans un nouvel onglet</span>
              </a>
            </div>
          </article>
        </div>

        <article className="warm-cta-panel p-7 sm:p-8 md:p-10 lg:col-span-2">
          <span className="brand-chip inline-flex">Choisir la bonne entrée</span>
          <h2 className="mt-5 font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">
            Votre projet n’entre pas encore dans une case précise ?
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--site-muted)]">
            Commencez par la section qui ressemble le plus à votre besoin : ateliers pour un groupe, chanson personnalisée pour un moment important, ou créations pour un projet plus large.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <a
              href="/ateliers"
              className={`cta-secondary inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-center font-semibold ${focusRing}`}
            >
              Voir les ateliers
            </a>
            <a
              href={SONG_REQUEST_GOOGLE_AUTH_URL}
              className={`cta-secondary inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-center font-semibold ${focusRing}`}
            >
              Demander une chanson
            </a>
            <a
              href="/creations"
              className={`cta-primary inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-center font-semibold ${focusRing}`}
            >
              Explorer les créations
            </a>
          </div>
        </article>
      </section>
    </main>
  );
}
