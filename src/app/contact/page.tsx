import { ClientPortalRequestGate } from '@/components/marketing/ClientPortalRequestGate';
import { PageHero } from '@/components/marketing/PageHero';
import { legalConfig, legalLinks } from '@/data/legal';
import { socialLinks } from '@/config/socialLinks';
import { buildMetadata } from '@/lib/seo';
import { getAdminBlockValue, getAdminPage, getAdminRuntimePayload, getAdminSection, getAdminSectionVisualStyle } from '@/lib/admin-runtime';

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
      href: '/connexion?next=%2Fclient%2Fsong-requests%2Fnouveau',
    },
  },
  social: {
    spotify: socialLinks.spotify,
    youtube: socialLinks.youtube,
    instagram: socialLinks.instagram,
    facebook: socialLinks.facebook,
  },
};

function pickText(adminValue: string | null | undefined, fallback: string) {
  if (typeof adminValue !== 'string') return fallback;
  const value = adminValue.trim();
  return value.length > 0 ? value : fallback;
}

function pickEmail(adminValue: string | null | undefined, fallback: string) {
  const value = pickText(adminValue, fallback);
  return value.includes('@') ? value : fallback;
}

function pickInternalHref(adminValue: string | null | undefined, fallback: string) {
  if (typeof adminValue !== 'string') return fallback;
  const value = adminValue.trim();
  if (!value) return fallback;
  return value.startsWith('/') || value.startsWith('#') ? value : fallback;
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
  return 'py-16';
}

export const metadata = buildMetadata({
  title: 'Contact Création Nowis | Demander un atelier, une chanson ou un projet créatif',
  description:
    'Contactez Création Nowis à Drummondville pour demander un atelier de création musicale avec l IA, une chanson personnalisée ou un projet créatif. Réponse directe de Nowis Morin.',
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

  const songRequestLabel = directEnabled
    ? pickText(getAdminBlockValue(directSection, 'button1.label'), DEFAULT_CONTACT_CONTENT.direct.button1.label)
    : DEFAULT_CONTACT_CONTENT.direct.button1.label;
  const songRequestHref = directEnabled
    ? pickInternalHref(getAdminBlockValue(directSection, 'button1.href'), DEFAULT_CONTACT_CONTENT.direct.button1.href)
    : DEFAULT_CONTACT_CONTENT.direct.button1.href;
  const workshopRequestLabel = directEnabled
    ? pickText(getAdminBlockValue(directSection, 'button2.label'), DEFAULT_CONTACT_CONTENT.direct.button2.label)
    : DEFAULT_CONTACT_CONTENT.direct.button2.label;
  const workshopRequestHref = directEnabled
    ? pickInternalHref(getAdminBlockValue(directSection, 'button2.href'), DEFAULT_CONTACT_CONTENT.direct.button2.href)
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
    <div className="site-background text-[color:var(--site-text)]">
      <PageHero
        eyebrow={heroEyebrow}
        title={heroTitle}
        description={heroDescription}
      />

      <section className={`mx-auto grid ${widthClass(directStyle.contentWidth)} gap-10 px-6 ${spacingClass(directStyle.verticalSpacing)} lg:grid-cols-[1.05fr_0.95fr]`}>
        <ClientPortalRequestGate nextPath="/client/dashboard" />

        <div className="space-y-6">
          <div className="glass-panel-strong rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[color:var(--site-heading)]">Contact direct</h2>
            <p className="mt-4 text-[color:var(--site-muted)]">Pour une demande rapide, une collaboration ou une idée à clarifier :</p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--site-soft)]">Réponse humaine, soumission sur demande et orientation vers la bonne formule selon votre projet.</p>
            <ul className="mt-6 space-y-3 text-[color:var(--site-text)]">
              <li>Email: <a href={`mailto:${email}`} className="hover:underline">{email}</a></li>
              <li>Telephone: <a href={phoneHref} className="hover:underline">{phone}</a></li>
            </ul>
            <div className="mt-6 flex flex-col gap-3">
              <a href={songRequestHref} className="cta-primary rounded-2xl px-5 py-3">
                {songRequestLabel}
              </a>
              <a href={workshopRequestHref} className="cta-secondary rounded-2xl px-5 py-3">
                {workshopRequestLabel}
              </a>
            </div>
          </div>

          <div className="glass-panel-soft rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[color:var(--site-heading)]">Protection des renseignements personnels</h2>
            <p className="mt-4 leading-relaxed text-[color:var(--site-muted)]">
              Responsable : {legalConfig.responsiblePrivacyName}. Pour toute demande liée à l’accès, à la correction ou au retrait de renseignements personnels, tu peux écrire directement à cette personne.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={`mailto:${legalConfig.privacyEmail}`} className="cta-secondary rounded-2xl px-5 py-4">
                {legalConfig.privacyEmail}
              </a>
              <a href={legalConfig.privacyPhoneHref} className="cta-secondary rounded-2xl px-5 py-4">
                {legalConfig.privacyPhone}
              </a>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <a href={legalLinks.legal} className="text-sm font-semibold text-[color:var(--site-accent-strong)] hover:underline">
                Voir les mentions légales
              </a>
              <a href={legalLinks.privacy} className="text-sm font-semibold text-[color:var(--site-accent-strong)] hover:underline">
                Voir la politique de confidentialité
              </a>
              <a href={legalLinks.terms} className="text-sm font-semibold text-[color:var(--site-accent-strong)] hover:underline">
                Voir les conditions de vente
              </a>
            </div>
          </div>

          <div className="glass-panel-soft rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[color:var(--site-heading)]">Où suivre Nowis Morin</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a href={spotify} target="_blank" rel="noreferrer" className="cta-secondary rounded-2xl px-5 py-4">Écouter sur Spotify</a>
              <a href={youtube} target="_blank" rel="noreferrer" className="cta-secondary rounded-2xl px-5 py-4">Voir sur YouTube</a>
              <a href={instagram} target="_blank" rel="noreferrer" className="cta-secondary rounded-2xl px-5 py-4">Instagram</a>
              <a href={facebook} target="_blank" rel="noreferrer" className="cta-secondary rounded-2xl px-5 py-4">Facebook</a>
            </div>
          </div>

          <div className="warm-cta-panel rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[color:var(--site-heading)]">Vous ne savez pas encore quelle page choisir ?</h2>
            <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)]">
              Commencez par la bonne entrée : ateliers pour un groupe, chanson personnalisée pour un moment important, ou créations pour un besoin plus large.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="/ateliers" className="cta-secondary rounded-2xl px-5 py-3">Demander un atelier</a>
              <a href="/commander-une-chanson" className="cta-secondary rounded-2xl px-5 py-3">Demander une chanson</a>
              <a href="/creations" className="cta-secondary rounded-2xl px-5 py-3">Voir mes créations</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
